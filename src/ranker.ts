import { Env, IntentPackage, StrategicWeights } from "./types";
import { ConflictReconciler } from "./reconciler";

export interface CandidateBatch {
  selectedIntents: IntentPackage[];
  conflictingPairs: Array<{ intentA: string; intentB: string; conflictingFiles: string[] }>;
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
   * Analyze the top candidates and produce an optimal deployment batch
   */
  async buildReleaseBatch(limit: number = 5): Promise<CandidateBatch> {
    const rows = await this.env.DB.prepare(
      "SELECT * FROM intents WHERE status IN ('evaluated', 'reconciled') ORDER BY composite_score DESC LIMIT ?"
    ).bind(limit * 2).all<any>();

    const candidates = rows.results || [];
    const selected: any[] = [];
    const conflicts: Array<{ intentA: string; intentB: string; conflictingFiles: string[] }> = [];

    for (const candidate of candidates) {
      if (selected.length >= limit) break;

      // Check if candidate conflicts with any already selected candidate
      let hasConflict = false;
      for (const existing of selected) {
        const overlap = this.reconciler.detectConflicts(candidate.id, existing.id);
        if (overlap.length > 0) {
          conflicts.push({
            intentA: existing.id,
            intentB: candidate.id,
            conflictingFiles: overlap,
          });
          hasConflict = true;
        }
      }

      // If no conflict or if already reconciled, include in the batch
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
      totalGrowthScore: Math.round(totalGrowth),
      totalCostScore: Math.round(totalCost),
      totalRiskScore: Math.round(totalRisk),
      compositeScore: Math.round(totalComposite * 10) / 10,
    };
  }

  /**
   * Deploy the top release batch
   */
  async deployReleaseBatch(intentIds: string[]): Promise<{ batchId: string; count: number; deployedAt: string }> {
    const batchId = `batch-${Date.now()}`;
    const timestamp = new Date().toISOString();

    // Mark intents as merged in D1
    for (const id of intentIds) {
      await this.env.DB.prepare(
        "UPDATE intents SET status = 'merged', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      ).bind(id).run();
    }

    // Record deployment
    await this.env.DB.prepare(`
      INSERT INTO deployments (id, batch_id, intent_ids, merged_commit_hash, status, deployed_at)
      VALUES (?, ?, ?, ?, 'deployed', ?)
    `).bind(
      batchId,
      batchId,
      JSON.stringify(intentIds),
      `commit-${Date.now().toString(16)}`,
      timestamp
    ).run();

    return { batchId, count: intentIds.length, deployedAt: timestamp };
  }
}
