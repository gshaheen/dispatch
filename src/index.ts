import { Env, StrategicWeights } from "./types";
import { ArtifactsService } from "./artifacts";
import { SwarmDispatcher } from "./dispatcher";
import { StrategicEvaluator } from "./evaluator";
import { ConflictReconciler } from "./reconciler";
import { ReleaseRanker } from "./ranker";
import seedData from "../seed.json";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // API Routing
    if (url.pathname.startsWith("/api/")) {
      return handleApi(request, url, env);
    }

    // Serve static assets if bound
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Dispatch Platform Worker Active", { status: 200 });
  },
};

async function handleApi(request: Request, url: URL, env: Env): Promise<Response> {
  const artifacts = new ArtifactsService(env);

  // Health check
  if (url.pathname === "/api/health" && request.method === "GET") {
    let d1Healthy = false;
    let weights = null;
    try {
      const res = await env.DB.prepare("SELECT * FROM strategic_weights WHERE id = 1").first();
      d1Healthy = !!res;
      weights = res;
    } catch (e) {
      console.error("D1 check error:", e);
    }

    let artifactsHealthy = false;
    try {
      const info = await artifacts.getRepoInfo("dispatch-main");
      artifactsHealthy = !!info;
    } catch (e) {
      console.warn("Artifacts main repo check:", e);
    }

    return json({
      status: "ok",
      version: "1.0.0",
      services: {
        d1: d1Healthy,
        artifacts: artifactsHealthy,
        workersAi: !!env.AI,
      },
      currentWeights: weights,
    });
  }

  // Get current strategic weights
  if (url.pathname === "/api/weights" && request.method === "GET") {
    const row = await env.DB.prepare("SELECT growth_weight, cost_weight, risk_weight FROM strategic_weights WHERE id = 1").first<{
      growth_weight: number;
      cost_weight: number;
      risk_weight: number;
    }>();

    const weights: StrategicWeights = row ? {
      growth: row.growth_weight,
      cost: row.cost_weight,
      risk: row.risk_weight,
    } : { growth: 0.5, cost: 0.25, risk: 0.25 };

    return json({ weights });
  }

  // Update strategic weights
  if (url.pathname === "/api/weights" && request.method === "POST") {
    try {
      const body = await request.json() as { growth?: number; cost?: number; risk?: number };
      const growth = Number(body.growth ?? 0.5);
      const cost = Number(body.cost ?? 0.25);
      const risk = Number(body.risk ?? 0.25);

      await env.DB.prepare(
        "UPDATE strategic_weights SET growth_weight = ?, cost_weight = ?, risk_weight = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1"
      ).bind(growth, cost, risk).run();

      // Recalculate composite scores for all evaluated intents
      await env.DB.prepare(
        "UPDATE intents SET composite_score = (growth_score * ?) + (cost_score * ?) + (risk_score * ?) WHERE status != 'pending'"
      ).bind(growth, cost, risk).run();

      return json({ success: true, weights: { growth, cost, risk } });
    } catch (err: any) {
      return json({ error: err.message }, 400);
    }
  }

  // List all intent packages
  if (url.pathname === "/api/intents" && request.method === "GET") {
    const rows = await env.DB.prepare(
      "SELECT * FROM intents ORDER BY composite_score DESC, created_at DESC"
    ).all();

    const intents = (rows.results || []).map((row: any) => {
      const seedItem = (seedData as any[]).find((s) => s.id === row.id);
      return {
        ...row,
        files: seedItem?.files || null,
      };
    });

    return json({ intents });
  }

  // Seed Catalog into D1
  if (url.pathname === "/api/seed" && request.method === "POST") {
    try {
      const dispatcher = new SwarmDispatcher(env);
      const count = await dispatcher.seedCatalog();
      return json({ success: true, count, message: `Seeded ${count} Intent Packages` });
    } catch (err: any) {
      return json({ error: err.message }, 500);
    }
  }

  // Dispatch Swarm (Forks Artifacts repos for pending intents)
  if (url.pathname === "/api/swarm/dispatch" && request.method === "POST") {
    try {
      const dispatcher = new SwarmDispatcher(env);
      const body = await request.json().catch(() => ({})) as { intentId?: string };
      if (body.intentId) {
        const res = await dispatcher.dispatchIntent(body.intentId);
        return json(res);
      }
      const res = await dispatcher.dispatchSwarm();
      return json(res);
    } catch (err: any) {
      return json({ error: err.message }, 500);
    }
  }

  // Fast-Forward to Evaluated Swarm (Demo State 1)
  if (url.pathname === "/api/swarm/fast-forward" && request.method === "POST") {
    try {
      const dispatcher = new SwarmDispatcher(env);
      const res = await dispatcher.fastForwardEvaluated();
      return json({ success: true, count: res.count, message: "Swarm fast-forwarded to evaluated state" });
    } catch (err: any) {
      return json({ error: err.message }, 500);
    }
  }

  // Strategic Evaluation with Workers AI for an Intent
  if (url.pathname === "/api/intents/evaluate" && request.method === "POST") {
    try {
      const body = await request.json() as { intentId: string };
      const intent = await env.DB.prepare("SELECT * FROM intents WHERE id = ?").bind(body.intentId).first<any>();
      if (!intent) return json({ error: "Intent not found" }, 404);

      // Find code diff from seed catalog
      const seedItem = (seedData as any[]).find((s) => s.id === body.intentId);
      const diffString = seedItem?.files ? JSON.stringify(seedItem.files, null, 2) : "// Modified endpoints";

      const evaluator = new StrategicEvaluator(env);
      const metadata = intent.source_metadata ? JSON.parse(intent.source_metadata) : {};
      const evalResult = await evaluator.evaluateIntent(
        intent.title,
        intent.description || "",
        intent.source_type,
        metadata,
        diffString
      );

      // Get current weights to compute composite score
      const weightRow = await env.DB.prepare("SELECT growth_weight, cost_weight, risk_weight FROM strategic_weights WHERE id = 1").first<any>();
      const w = weightRow || { growth_weight: 0.5, cost_weight: 0.25, risk_weight: 0.25 };
      const composite = (evalResult.growthScore * w.growth_weight) +
                        (evalResult.costScore * w.cost_weight) +
                        (evalResult.riskScore * w.risk_weight);

      // Persist in D1
      await env.DB.prepare(`
        UPDATE intents 
        SET status = 'evaluated',
            growth_score = ?,
            cost_score = ?,
            risk_score = ?,
            composite_score = ?,
            executive_summary = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        evalResult.growthScore,
        evalResult.costScore,
        evalResult.riskScore,
        composite,
        evalResult.executiveSummary,
        body.intentId
      ).run();

      return json({
        success: true,
        intentId: body.intentId,
        evaluation: evalResult,
        compositeScore: composite,
      });
    } catch (err: any) {
      return json({ error: err.message }, 500);
    }
  }

  // Custom Live Evaluation Endpoint
  if (url.pathname === "/api/evaluate-custom" && request.method === "POST") {
    try {
      const body = await request.json() as {
        title: string;
        description: string;
        sourceType?: string;
        sourceMetadata?: any;
        codeDiff?: string;
      };

      const title = body.title || "Custom Feature";
      const description = body.description || "";
      const sourceType = body.sourceType || "roadmap";
      const sourceMetadata = body.sourceMetadata || {};
      const diffString = body.codeDiff || `// Added ${title}\nexport function customFeature() {\n  return { enabled: true };\n}\n`;

      const evaluator = new StrategicEvaluator(env);
      const evalResult = await evaluator.evaluateIntent(
        title,
        description,
        sourceType,
        sourceMetadata,
        diffString
      );

      const customId = `intent-custom-${Date.now().toString(36)}`;
      const forkName = `task-custom-${Date.now().toString(36)}`;

      // Fork isolated repository in Cloudflare Artifacts
      try {
        await artifacts.forkRepo("dispatch-main", forkName);
      } catch (e: any) {
        console.warn(`Artifacts fork for ${forkName}:`, e.message);
      }

      // Compute composite score with current strategic weights
      const weightRow = await env.DB.prepare("SELECT growth_weight, cost_weight, risk_weight FROM strategic_weights WHERE id = 1").first<any>();
      const w = weightRow || { growth_weight: 0.5, cost_weight: 0.25, risk_weight: 0.25 };
      const composite = (evalResult.growthScore * w.growth_weight) +
                        (evalResult.costScore * w.cost_weight) +
                        (evalResult.riskScore * w.risk_weight);

      // Insert new Intent Package into D1
      await env.DB.prepare(`
        INSERT INTO intents (
          id, title, description, source_type, source_ref, source_metadata,
          fork_repo_name, status, growth_score, cost_score, risk_score,
          composite_score, executive_summary, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'evaluated', ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).bind(
        customId,
        title,
        description,
        sourceType,
        `Custom Evaluation #${Date.now().toString().slice(-4)}`,
        JSON.stringify(sourceMetadata),
        forkName,
        evalResult.growthScore,
        evalResult.costScore,
        evalResult.riskScore,
        Math.round(composite * 10) / 10,
        evalResult.executiveSummary
      ).run();

      const newIntent = await env.DB.prepare("SELECT * FROM intents WHERE id = ?").bind(customId).first<any>();

      return json({
        success: true,
        intent: newIntent,
        forkName,
        evaluation: evalResult
      });
    } catch (err: any) {
      return json({ error: err.message }, 500);
    }
  }

  // Detect Conflicts between Candidates
  if (url.pathname === "/api/conflicts" && request.method === "GET") {
    try {
      const ranker = new ReleaseRanker(env);
      const batch = await ranker.buildReleaseBatch(10);
      return json({ conflicts: batch.conflictingPairs });
    } catch (err: any) {
      return json({ error: err.message }, 500);
    }
  }

  // Run Semantic Conflict Reconciliation Agent
  if (url.pathname === "/api/reconcile" && request.method === "POST") {
    try {
      const body = await request.json() as { intentA: string; intentB: string };
      const reconciler = new ConflictReconciler(env);
      const res = await reconciler.reconcileIntents(body.intentA, body.intentB);
      return json(res);
    } catch (err: any) {
      return json({ error: err.message }, 500);
    }
  }

  // Get Current Release Candidate Batch
  if (url.pathname === "/api/batch" && request.method === "GET") {
    try {
      const ranker = new ReleaseRanker(env);
      const batch = await ranker.buildReleaseBatch();
      return json({ batch });
    } catch (err: any) {
      return json({ error: err.message }, 500);
    }
  }

  // Deploy Strategic Release Batch
  if (url.pathname === "/api/deploy-batch" && request.method === "POST") {
    try {
      const body = await request.json() as { intentIds: string[] };
      const ranker = new ReleaseRanker(env);
      const res = await ranker.deployReleaseBatch(body.intentIds || []);
      return json({ success: true, deployment: res });
    } catch (err: any) {
      return json({ error: err.message }, 500);
    }
  }

  // List Artifacts repositories
  if (url.pathname === "/api/repos" && request.method === "GET") {
    try {
      const repos = await artifacts.listRepos();
      return json({ repos });
    } catch (err: any) {
      return json({ error: err.message }, 500);
    }
  }

  // Demo Reset Endpoint
  if (url.pathname === "/api/demo/reset" && request.method === "POST") {
    try {
      // 1. Prune ephemeral Artifacts forks
      const pruned = await artifacts.pruneEphemeralForks();

      // 2. Clear reconciliations and deployments records
      await env.DB.prepare("DELETE FROM reconciliations").run();
      await env.DB.prepare("DELETE FROM deployments").run();

      // 3. Reset strategic weights to default 50/25/25
      await env.DB.prepare(
        "UPDATE strategic_weights SET growth_weight = 0.50, cost_weight = 0.25, risk_weight = 0.25, updated_at = CURRENT_TIMESTAMP WHERE id = 1"
      ).run();

      // 4. Re-seed all intents back to pristine evaluated state
      const dispatcher = new SwarmDispatcher(env);
      await dispatcher.seedCatalog();

      return json({
        success: true,
        message: "Demo state reset and re-seeded successfully",
        prunedForks: pruned,
        defaultWeights: { growth: 0.5, cost: 0.25, risk: 0.25 },
      });
    } catch (err: any) {
      return json({ error: err.message }, 500);
    }
  }

  return json({ error: "Endpoint not found" }, 404);
}

function json(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
    },
  });
}
