import { Env, IntentPackage, SourceMetadata } from "./types";

export interface EvaluationResult {
  growthScore: number;
  costScore: number;
  riskScore: number;
  executiveSummary: string;
  rationale: {
    growth: string;
    cost: string;
    risk: string;
  };
}

export class StrategicEvaluator {
  constructor(private env: Env) {}

  /**
   * Evaluate an Intent Package and its code changes using Cloudflare Workers AI
   */
  async evaluateIntent(
    title: string,
    description: string,
    sourceType: string,
    sourceMetadata: SourceMetadata,
    codeDiff: string
  ): Promise<EvaluationResult> {
    const prompt = `You are the Strategic Evaluator Agent for Dispatch, an autonomous Git deployment platform.
Your job is to analyze an incoming software change across three strategic corporate pillars:
1. Growth / Revenue Impact (-100 to +100): Commercial upside, deal unblocking, new customer acquisition, market expansion.
2. Cost Savings / Efficiency (-100 to +100): Infrastructure efficiency, Worker CPU time reduction, egress savings, database query minimization.
3. Risk Reduction / Safety (-100 to +100): Security vulnerability elimination, bug fixing, test coverage, blast radius safety. (Positive = safer / reduces risk; Negative = adds high risk).

INPUT CONTEXT:
- Title: ${title}
- Description: ${description}
- Source: ${sourceType}
- Business Metadata: ${JSON.stringify(sourceMetadata)}
- Code Changes:
${codeDiff}

Respond ONLY with valid JSON in this exact structure:
{
  "growthScore": <number between -100 and 100>,
  "costScore": <number between -100 and 100>,
  "riskScore": <number between -100 and 100>,
  "executiveSummary": "<2 sentences for executives explaining business value and strategic impact>",
  "rationale": {
    "growth": "<1 sentence explaining growth score>",
    "cost": "<1 sentence explaining cost score>",
    "risk": "<1 sentence explaining risk score>"
  }
}`;

    // If Workers AI binding is present, run the model
    if (this.env.AI) {
      try {
        const response = await this.env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
          messages: [
            {
              role: "system",
              content: "You are an expert Chief Technology Officer and quantitative software strategist. You output only strict JSON without markdown fences."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 600,
        });

        const rawText = typeof response.response === "string" 
          ? response.response 
          : JSON.stringify(response);

        const parsed = this.parseAiResponse(rawText);
        if (parsed) return parsed;
      } catch (err: any) {
        console.warn("Workers AI evaluation error, falling back to heuristic evaluation:", err.message);
      }
    }

    // Deterministic fallback if AI is unavailable or produces unparseable output
    return this.fallbackHeuristic(title, description, sourceMetadata, codeDiff);
  }

  private parseAiResponse(text: string): EvaluationResult | null {
    try {
      // Clean possible markdown code fences
      const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const obj = JSON.parse(cleaned);

      if (
        typeof obj.growthScore === "number" &&
        typeof obj.costScore === "number" &&
        typeof obj.riskScore === "number" &&
        typeof obj.executiveSummary === "string"
      ) {
        return {
          growthScore: Math.min(100, Math.max(-100, Math.round(obj.growthScore))),
          costScore: Math.min(100, Math.max(-100, Math.round(obj.costScore))),
          riskScore: Math.min(100, Math.max(-100, Math.round(obj.riskScore))),
          executiveSummary: obj.executiveSummary,
          rationale: {
            growth: obj.rationale?.growth || "Assessed based on commercial impact.",
            cost: obj.rationale?.cost || "Assessed based on compute and storage profile.",
            risk: obj.rationale?.risk || "Assessed based on blast radius and security.",
          },
        };
      }
    } catch (e) {
      console.warn("Failed to parse AI response as JSON:", text);
    }
    return null;
  }

  private fallbackHeuristic(
    title: string,
    description: string,
    sourceMetadata: SourceMetadata,
    codeDiff: string
  ): EvaluationResult {
    let growth = 10;
    let cost = 5;
    let risk = 15;

    if (sourceMetadata.arrImpact) {
      growth = Math.min(95, Math.round(40 + (sourceMetadata.arrImpact / 5000)));
    }
    if (sourceMetadata.latencyImpactMs && sourceMetadata.latencyImpactMs < 0) {
      cost = Math.min(90, Math.round(40 + Math.abs(sourceMetadata.latencyImpactMs) * 0.4));
    }
    if (sourceMetadata.cveSeverity || sourceMetadata.cveId) {
      risk = 95;
    }

    return {
      growthScore: growth,
      costScore: cost,
      riskScore: risk,
      executiveSummary: `Strategic evaluation assessed ${title}. Delivers impact aligned with ${sourceMetadata.arrImpact ? "revenue growth" : sourceMetadata.latencyImpactMs ? "operational efficiency" : "risk reduction"}.`,
      rationale: {
        growth: sourceMetadata.arrImpact ? `Unblocks $${sourceMetadata.arrImpact.toLocaleString()} in commercial pipeline.` : "Modest customer-facing impact.",
        cost: sourceMetadata.latencyImpactMs ? `Improves latency by ${Math.abs(sourceMetadata.latencyImpactMs)}ms and lowers compute cycles.` : "Neutral impact on infrastructure expenditure.",
        risk: sourceMetadata.cveId ? `Remediates critical security vulnerability ${sourceMetadata.cveId}.` : "Low operational risk change.",
      },
    };
  }
}
