import { Env, IntentPackage, StrategicWeights } from "./types";
import { ConflictReconciler } from "./reconciler";

export interface CandidateBatch {
  selectedIntents: IntentPackage[];
  conflictingPairs: Array<{ intentA: string; intentB: string; conflictingFiles: string[] }>;
  dagWarnings: Array<{ intentId: string; blockedBy: string; message: string }>;
  totalGrowthScore: number;
  totalCostScore: number;
  totalRiskScore: number;
  compositeScore: number;
}

export class ReleaseRanker {
  private reconciler: ConflictReconciler;

  constructor(private env: Env) {
    this.reconciler = new ConflictReconciler(env);
  }

  /**
   * Analyze candidates and produce an optimal deployment batch with Topological DAG enforcement
   */
  async buildReleaseBatch(limit: number = 5): Promise<CandidateBatch> {
    const rows = await this.env.DB.prepare(
      "SELECT * FROM intents WHERE status IN ('evaluated', 'reconciled') ORDER BY composite_score DESC LIMIT ?"
    ).bind(limit * 3).all<any>();

    const candidates = rows.results || [];
    const selected: any[] = [];
    const conflicts: Array<{ intentA: string; intentB: string; conflictingFiles: string[] }> = [];
    const dagWarnings: Array<{ intentId: string; blockedBy: string; message: string }> = [];

    // Check already merged intents in D1
    const mergedRows = await this.env.DB.prepare(
      "SELECT id FROM intents WHERE status = 'merged'"
    ).all<any>();
    const mergedIds = new Set<string>((mergedRows.results || []).map((r: any) => r.id));

    // Check existing resolved reconciliations
    const resolvedRecs = await this.env.DB.prepare(
      "SELECT primary_intent_id, secondary_intent_id FROM reconciliations WHERE status = 'resolved'"
    ).all<any>();
    const resolvedSet = new Set<string>();
    for (const r of (resolvedRecs.results || [])) {
      resolvedSet.add(`${r.primary_intent_id}:${r.secondary_intent_id}`);
      resolvedSet.add(`${r.secondary_intent_id}:${r.primary_intent_id}`);
    }

    const candidateMap = new Map<string, any>();
    for (const c of candidates) {
      candidateMap.set(c.id, c);
    }

    for (const candidate of candidates) {
      if (selected.length >= limit) break;
      if (selected.some((s) => s.id === candidate.id)) continue;

      // ── Topological DAG Validation ──────────────────────────────────────────
      const rawDeps = candidate.depends_on
        ? (typeof candidate.depends_on === "string" ? JSON.parse(candidate.depends_on) : candidate.depends_on)
        : [];
      
      let dagBlocked = false;
      for (const depId of rawDeps) {
        // Is prerequisite already merged or already selected earlier in batch?
        const isDepMerged = mergedIds.has(depId);
        const isDepSelected = selected.some((s) => s.id === depId);

        if (!isDepMerged && !isDepSelected) {
          // Attempt topological co-scheduling: can we bring the prerequisite into the batch?
          const depCandidate = candidateMap.get(depId);
          if (depCandidate && selected.length + 1 < limit) {
            // Check if prerequisite has any unresolvable conflicts with current batch
            let depConflicts = false;
            for (const existing of selected) {
              const overlap = this.reconciler.detectConflicts(depCandidate.id, existing.id);
              if (overlap.length > 0 && !resolvedSet.has(`${existing.id}:${depCandidate.id}`)) {
                depConflicts = true;
                break;
              }
            }
            if (!depConflicts) {
              // Successfully co-schedule prerequisite ahead of dependent
              selected.push(depCandidate);
              continue;
            }
          }

          // If prerequisite cannot be co-scheduled, this candidate is DAG-blocked
          dagBlocked = true;
          dagWarnings.push({
            intentId: candidate.id,
            blockedBy: depId,
            message: `Requires ${depId} to be merged or co-batched first`,
          });
          break;
        }
      }

      if (dagBlocked) {
        continue; // Defer candidate until prerequisite is satisfied
      }

      // ── Concurrency Conflict Detection ──────────────────────────────────────
      let hasConflict = false;
      for (const existing of selected) {
        const overlap = this.reconciler.detectConflicts(candidate.id, existing.id);
        if (overlap.length > 0) {
          const isResolved = resolvedSet.has(`${existing.id}:${candidate.id}`) ||
                             (candidate.status === "reconciled" && existing.status === "reconciled");

          if (!isResolved) {
            conflicts.push({
              intentA: existing.id,
              intentB: candidate.id,
              conflictingFiles: overlap,
            });
            hasConflict = true;
          }
        }
      }

      // If no conflict or reconciled, include in batch
      if (!hasConflict || candidate.status === "reconciled") {
        selected.push(candidate);
      }
    }

    let totalGrowth = 0;
    let totalCost = 0;
    let totalRisk = 0;
    let totalComposite = 0;

    for (const item of selected) {
      totalGrowth += item.growth_score;
      totalCost += item.cost_score;
      totalRisk += item.risk_score;
      totalComposite += item.composite_score;
    }

    return {
      selectedIntents: selected,
      conflictingPairs: conflicts,
      dagWarnings,
      totalGrowthScore: Math.round(totalGrowth),
      totalCostScore: Math.round(totalCost),
      totalRiskScore: Math.round(totalRisk),
      compositeScore: Math.round(totalComposite * 10) / 10,
    };
  }

  /**
   * Deploy the top release batch and prune its ephemeral forks from Artifacts
   */
  async deployReleaseBatch(intentIds: string[]): Promise<{
    batchId: string;
    count: number;
    deployedAt: string;
    mergedCommitHash: string;
    deployedForks: Array<{ id: string; forkRepoName: string; commitSha: string }>;
  }> {
    const batchId = `batch-${Date.now().toString(16)}`;
    const mergedCommitHash = `rel-${Date.now().toString(16).slice(-7)}`;
    const timestamp = new Date().toISOString();
    const { ArtifactsService } = await import("./artifacts");
    const artifacts = new ArtifactsService(this.env);
    const deployedForks: Array<{ id: string; forkRepoName: string; commitSha: string }> = [];

    // Mark intents as merged in D1 and prune their ephemeral Artifacts forks
    for (const id of intentIds) {
      const row = await this.env.DB.prepare(
        "SELECT fork_repo_name, commit_sha FROM intents WHERE id = ?"
      ).bind(id).first<{ fork_repo_name: string; commit_sha: string }>();

      const forkName = row?.fork_repo_name || `task-${id}`;
      const commitSha = row?.commit_sha || "7a8f3b2";
      deployedForks.push({ id, forkRepoName: forkName, commitSha });

      if (forkName) {
        try {
          await artifacts.deleteRepo(forkName);
        } catch (e) {
          console.warn(`Could not delete deployed repo ${forkName}:`, e);
        }
      }

      await this.env.DB.prepare(
        "UPDATE intents SET status = 'merged', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      ).bind(id).run();
    }

    // Also prune any reconciled repo for these intents
    try {
      const recs = await this.env.DB.prepare(
        "SELECT reconciled_repo_name FROM reconciliations WHERE status = 'resolved'"
      ).all<{ reconciled_repo_name: string }>();
      for (const r of (recs.results || [])) {
        if (r.reconciled_repo_name) {
          await artifacts.deleteRepo(r.reconciled_repo_name);
        }
      }
    } catch (e) {}

    // Record deployment in D1 audit trail
    await this.env.DB.prepare(`
      INSERT INTO deployments (id, batch_id, intent_ids, merged_commit_hash, status, deployed_at)
      VALUES (?, ?, ?, ?, 'deployed', ?)
    `).bind(
      batchId,
      batchId,
      JSON.stringify(intentIds),
      mergedCommitHash,
      timestamp
    ).run();

    return {
      batchId,
      count: intentIds.length,
      deployedAt: timestamp,
      mergedCommitHash,
      deployedForks,
    };
  }
}
