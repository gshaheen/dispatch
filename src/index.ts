import { Env, StrategicWeights } from "./types";
import { ArtifactsService } from "./artifacts";

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

    return json({ intents: rows.results || [] });
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

      // 2. Reset strategic weights to default 50/25/25
      await env.DB.prepare(
        "UPDATE strategic_weights SET growth_weight = 0.50, cost_weight = 0.25, risk_weight = 0.25, updated_at = CURRENT_TIMESTAMP WHERE id = 1"
      ).run();

      // 3. Reset all intents back to pending or initial seeded state
      await env.DB.prepare(
        "UPDATE intents SET status = 'pending', composite_score = 0 WHERE status != 'pending'"
      ).run();

      return json({
        success: true,
        message: "Demo state reset successfully",
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
