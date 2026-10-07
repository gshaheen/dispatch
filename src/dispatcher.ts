import { Env, IntentPackage, StrategicWeights } from "./types";
import { ArtifactsService } from "./artifacts";
import seedData from "../seed.json";

export class SwarmDispatcher {
  private artifacts: ArtifactsService;

  constructor(private env: Env) {
    this.artifacts = new ArtifactsService(env);
  }

  /**
   * Seed the D1 database with the catalog of Intent Packages
   */
  async seedCatalog(): Promise<number> {
    const weights = await this.getWeights();

    for (const item of seedData as any[]) {
      const composite = (item.growthScore * weights.growth) + 
                        (item.costScore * weights.cost) + 
                        (item.riskScore * weights.risk);

      await this.env.DB.prepare(`
        INSERT OR REPLACE INTO intents (
          id, title, description, source_type, source_ref, source_metadata,
          fork_repo_name, status, growth_score, cost_score, risk_score,
          composite_score, executive_summary, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'evaluated', ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).bind(
        item.id,
        item.title,
        item.description,
        item.sourceType,
        item.sourceRef,
        JSON.stringify(item.sourceMetadata),
        item.forkRepoName,
        item.growthScore,
        item.costScore,
        item.riskScore,
        Math.round(composite * 10) / 10,
        item.executiveSummary
      ).run();

      // Create isolated fork in Artifacts if it does not already exist
      try {
        await this.artifacts.forkRepo("dispatch-main", item.forkRepoName);
      } catch (e: any) {
        // Fork may already exist or baseline is ready
      }
    }

    return seedData.length;
  }

  /**
   * Dispatch a single intent: creates an isolated fork in Cloudflare Artifacts
   */
  async dispatchIntent(intentId: string): Promise<{ success: boolean; forkName: string; remote?: string }> {
    const row = await this.env.DB.prepare("SELECT * FROM intents WHERE id = ?").bind(intentId).first<any>();
    if (!row) {
      throw new Error(`Intent ${intentId} not found`);
    }

    const forkName = row.fork_repo_name || `task-${intentId}`;

    // Fork the baseline repo in Artifacts
    let remote = "";
    try {
      const forkResult = await this.artifacts.forkRepo("dispatch-main", forkName);
      remote = forkResult.remote;
    } catch (err: any) {
      console.warn(`Artifacts fork for ${forkName}:`, err.message);
    }

    // Update status in D1 to 'forked'
    await this.env.DB.prepare(
      "UPDATE intents SET status = 'forked', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(intentId).run();

    return { success: true, forkName, remote };
  }

  /**
   * Dispatch the entire swarm concurrently
   */
  async dispatchSwarm(): Promise<{ count: number; forked: string[] }> {
    const rows = await this.env.DB.prepare("SELECT id, fork_repo_name FROM intents WHERE status = 'pending'").all<any>();
    const intents = rows.results || [];
    const forked: string[] = [];

    for (const intent of intents) {
      try {
        await this.dispatchIntent(intent.id);
        forked.push(intent.fork_repo_name);
      } catch (e) {
        console.warn(`Failed to dispatch ${intent.id}:`, e);
      }
    }

    return { count: forked.length, forked };
  }

  /**
   * Demo Fast-Forward: Mark all intents as 'evaluated' and compute initial composite scores
   */
  async fastForwardEvaluated(): Promise<{ count: number }> {
    const weights = await this.getWeights();

    // Fork in artifacts if not already forked
    await this.dispatchSwarm();

    // Update all to evaluated and compute composite score
    await this.env.DB.prepare(`
      UPDATE intents 
      SET status = 'evaluated',
          composite_score = (growth_score * ?) + (cost_score * ?) + (risk_score * ?),
          updated_at = CURRENT_TIMESTAMP
    `).bind(weights.growth, weights.cost, weights.risk).run();

    const countResult = await this.env.DB.prepare("SELECT COUNT(*) as count FROM intents WHERE status = 'evaluated'").first<{ count: number }>();
    return { count: countResult?.count || 0 };
  }

  /**
   * Helper to retrieve active strategic weights
   */
  private async getWeights(): Promise<StrategicWeights> {
    const row = await this.env.DB.prepare("SELECT growth_weight, cost_weight, risk_weight FROM strategic_weights WHERE id = 1").first<any>();
    if (!row) return { growth: 0.5, cost: 0.25, risk: 0.25 };
    return {
      growth: row.growth_weight,
      cost: row.cost_weight,
      risk: row.risk_weight,
    };
  }
}
