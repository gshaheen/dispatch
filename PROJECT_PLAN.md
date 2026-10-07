# Dispatch: The Strategic Git Platform for the Agentic Era

> **Contest Submission for Cloudflare's "Build the Next-Gen Git Platform" Competition**  
> **Core Theme:** When coding agents make building features trivial, the bottleneck shifts from writing code to *review, prioritization, conflict resolution, and deciding what to deploy based on real-time business strategy*.

---

## 1. Executive Summary & Vision

### The Problem
Traditional Git (GitHub, GitLab) was built for an era of **code scarcity**:
* Human engineering hours are expensive and slow.
* Product Managers act as strict gatekeepers *before* development begins (RICE scoring, backlog grooming).
* Once a PR is opened, organizations have a strong sunk-cost bias to merge it.
* A Git PR only records *what* changed (`diff`), but loses all business context (*why* it was built, what deals depend on it, what revenue or risk it addresses).

### The Inverted Funnel (The Agentic Era)
With autonomous coding agents, **implementation cost approaches zero**:
* Hundreds of features, refactors, and bug fixes can be coded concurrently.
* Work starts immediately without upfront gating.
* **The New Bottleneck:** Review bandwidth, blast radius management, and deployment prioritization.
* **The Solution:** A PR is no longer a guaranteed commitment; it is an **executable option contract**. **Dispatch** continuously ranks and dispatches code changes to production based on the company's real-time strategic priorities (**Revenue Growth**, **Cost Efficiency**, **Risk Reduction**).

---

## 2. Competition Criteria Alignment

| Criteria (Weight) | How Dispatch Wins |
| :--- | :--- |
| **Originality & Prototype Quality (50%)** | Unlike conventional submissions that just slap a chat assistant onto a traditional Git UI, Dispatch completely re-architects the Git lifecycle around the *Inverted Funnel* and creates an **Executive Strategic Control Plane for Code**. |
| **Multi-Agent Concurrency & Conflict Handling (25%)** | Demonstrates dozens of agents working in parallel on isolated **Cloudflare Artifacts** forks, automated multi-dimensional scorecards, context preservation (`EVALUATION.json`), and an automated **Semantic Conflict Reconciliation Agent** that merges overlapping changes without human intervention. |
| **Product & User Experience (25%)** | A mission-control dashboard featuring real-time strategic weighting sliders, live re-ranking animations, live Worker Preview inspections, and a 1-click strategic deployment pipeline. |

---

## 3. High-Level Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│             Executive Command Center (React + Tailwind UI)             │
│  [Strategic Sliders]  [Dynamic Deployment Queue]  [Conflict Visualizer]│
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ REST / Server-Sent Events
┌────────────────────────────────────▼───────────────────────────────────┐
│               Dispatch Core Engine (Cloudflare Workers)                │
│  - Re-ranking Engine: Score = w_growth*S_g + w_cost*S_c + w_risk*S_r   │
│  - Fork & Task Orchestrator                                            │
│  - Reset & Demo Fast-Forward Controller                                │
└────────┬───────────────────────────┬───────────────────────────┬───────┘
         │                           │                           │
┌────────▼───────────────┐ ┌─────────▼───────────────┐ ┌─────────▼───────┐
│  Cloudflare Artifacts  │ │      Cloudflare D1      │ │  Workers AI /   │
│ - `main` baseline repo │ │ - Intent Packages       │ │   AI Gateway    │
│ - Ephemeral task forks │ │ - Active Weights        │ │ - Evaluation    │
│ - Scoped Git tokens    │ │ - Evaluation History    │ │ - Conflict Re-  │
│ - Push event stream    │ │ - Reconcile records     │ │   conciliation  │
└────────────────────────┘ └─────────────────────────┘ └─────────────────┘
```

### Why Cloudflare Artifacts is Fundamental:
1. **Scale to Millions of Repos:** Repos are lightweight primitives. We spawn isolated forks per agent task (`task-sso-okta`, `task-cache-opt`) without polluting the organization's repository list.
2. **Native Workers Binding (`env.ARTIFACTS`):** Programmatic inspection of commits, trees, files, and tokens without heavy local git processes.
3. **Event-Driven Reactive Loops:** Native `cf.artifacts.repo.pushed` events trigger evaluation pipelines instantly.
4. **Instant Verification via Worker Previews:** Every fork generates an isolated live preview URL to verify the running application.

---

## 4. The Data Model: Business Intent Packages

Each piece of work in Dispatch is an **Intent Package**, uniting technical specifications with commercial metadata:

```typescript
interface IntentPackage {
  id: string;                    // e.g. "intent-sso-01"
  title: string;                 // e.g. "Enterprise SAML / Okta SSO"
  source: {
    type: "crm" | "telemetry" | "security" | "roadmap";
    ref: string;                 // e.g. "Salesforce Opp #8492"
    metadata: {
      arrImpact?: number;        // e.g. $250,000
      customer?: string;         // e.g. "Acme Corp (Renewal Risk)"
      cveSeverity?: string;      // e.g. "CRITICAL 9.8"
      latencyImpactMs?: number;  // e.g. "-120ms P95"
    };
  };
  forkRepoName: string;          // e.g. "task-sso-01"
  status: "pending" | "forked" | "evaluated" | "reconciled" | "merged";
  scores: {
    growth: number;              // -100 to +100
    cost: number;                // -100 to +100
    risk: number;                // -100 to +100
  };
  executiveSummary: string;      // Plain-English business impact
  previewUrl?: string;           // Cloudflare Worker Preview link
}
```

---

## 5. Strategic Prioritization Formula

The deployment queue dynamically orders candidate changes according to active executive weights:

$$\text{Priority Score} = w_{\text{growth}} \cdot S_{\text{growth}} + w_{\text{cost}} \cdot S_{\text{cost}} + w_{\text{risk}} \cdot S_{\text{risk}}$$

Where:
* $w_{\text{growth}} + w_{\text{cost}} + w_{\text{risk}} = 1.0$ (adjusted via dashboard sliders).
* $S_{\text{growth}}$: Measures revenue potential, deal unblocking, and market expansion.
* $S_{\text{cost}}$: Measures infrastructure savings, CPU/memory reduction, and query efficiency.
* $S_{\text{risk}}$: Measures test coverage gains, vulnerability elimination, and architectural simplification.

**The Magic Moment:** When an executive changes priorities (e.g., shifting focus from Growth to Cost Reduction), the entire queue re-ranks instantly in real time.

---

## 6. The Agent Fleet: Real vs. Streamlined

To keep the platform blisteringly fast, 100% reliable, and focused on Git mechanics rather than slow LLM syntax loops:

| Agent Role | Implementation Strategy | Purpose |
| :--- | :--- | :--- |
| **Task Coding Swarm (12–15 tasks)** | **Streamlined / Pre-packaged Changes:** Pre-crafted file diffs pushed to real Artifacts forks via Worker API. | Simulates an instant swarm of 15 agents without waiting minutes for LLM code generation. |
| **Strategic Evaluator Agent** | **Real Workers AI (`@cf/meta/llama-3.3-70b-instruct`)**: Reads Code Diff + Intent Package metadata. | Computes the multi-dimensional score and writes an immutable `EVALUATION.json` and business summary into the Artifact fork. |
| **Semantic Conflict Reconciler** | **Real Workers AI**: Reconciles conflicting top-priority forks. | Detects file/logic conflicts between top PRs, produces a unified commit in a reconciliation fork, and tests compatibility. |
| **Interactive Spec Agent** | **Real Workers AI**: Live prompt box for judges/users. | Allows live user input (e.g. *"Add a promotional banner"*) to demonstrate real end-to-end agentic creation on demand. |

---

## 7. 1-Click Demo Reset & Fast-Forward Engine

To guarantee flawless demo rehearsals, video takes, and live presentations:

### Reset Endpoint: `POST /api/demo/reset` (CLI: `npm run demo:reset`)
1. **Prune Forks:** Queries `env.ARTIFACTS.list()` and deletes all `task-*` and `reconcile-*` forks.
2. **Reset `main`:** Restores the `main` repository in Artifacts to baseline (`v1.0.0-baseline`).
3. **Reset D1:** Re-seeds the initial 12–15 Intent Packages into `"pending"` state and resets slider weights to default (50% Growth, 25% Cost, 25% Risk).

### Demo Fast-Forward Presets:
* **Preset 0: Fresh Slate** — Backlog populated, ready to click *"Dispatch Swarm"*.
* **Preset 1: Swarm Evaluated** — All 15 forks populated, scored, and ready for slider re-ranking demos.
* **Preset 2: Conflict Scenario** — Two high-value conflicting PRs queued, ready to trigger the Semantic Reconciler.

---

## 8. Step-by-Step Implementation Roadmap

### Phase 1: Core Foundation & Artifacts Binding (COMPLETED)
- [x] Initialize Worker project (`dispatch`) with TypeScript and `wrangler.jsonc`.
- [x] Configure `ARTIFACTS`, `D1`, and `AI` bindings.
- [x] Create the seed `main` repository in Artifacts containing a sample Cloudflare Workers SaaS application (`dispatch-main` @ `v1.0.0-baseline`).
- [x] Implement and verify programmatic fork, read, commit, and token operations (`src/artifacts.ts`).
- [x] Deploy live to Cloudflare Workers (`https://dispatch.gshaheen.workers.dev`) and verify health check.
- [x] Add official MIT `LICENSE` file.

### Phase 2: Intent Catalog & Swarm Dispatcher (COMPLETED)
- [x] Design D1 database schema for Intent Packages, strategic weights, and evaluation metrics (`schema.sql`).
- [x] Seed catalog with 10 realistic Intent Packages spanning:
  * Enterprise Growth (SAML SSO, Stripe Multi-Currency, Audit Logs, CSV Export).
  * Infrastructure & Cost Efficiency (Edge KV Caching, DB Query Batching, Payload Compression).
  * Risk & Security (JWT CVE Patch, Rate Limiting, Input Sanitization).
- [x] Build the Swarm Dispatcher (`src/dispatcher.ts`) to programmatically fork real Cloudflare Artifacts repositories.
- [x] Implement demo fast-forward (`/api/swarm/fast-forward`) and 1-click clean reset (`/api/demo/reset`) that prunes Artifacts forks.
- [x] Deploy and verify dynamic real-time re-ranking across Growth, Cost, and Risk strategic postures.

### Phase 3: Strategic Evaluation Engine (COMPLETED)
- [x] Set up evaluation pipeline with Cloudflare Workers AI (`@cf/meta/llama-3.3-70b-instruct`) in `src/evaluator.ts`.
- [x] Implement prompt analyzing Intent metadata (ARR impact, CVEs, latency) + code diffs.
- [x] Generate structured scores (`growth`, `cost`, `risk`), 3-dimension rationale, and executive summary.
- [x] Integrate evaluation endpoints (`/api/intents/evaluate` and `/api/evaluate-custom`) to support both cataloged and on-the-fly custom intent evaluation.
- [x] Verify live Cloudflare execution and score persistence in D1.

### Phase 4: Dynamic Re-ranking & Conflict Reconciliation Agent (COMPLETED)
- [x] Implement live scoring, knapsack release candidate batching, and compatibility validation in `src/ranker.ts`.
- [x] Implement automated file-level conflict detection across concurrent forks (`GET /api/conflicts`).
- [x] Implement the Semantic Conflict Reconciliation Agent (`src/reconciler.ts`) using Cloudflare Workers AI to synthesize unified code in dedicated `reconcile-*` Artifacts forks.
- [x] Implement automated release batch deployment (`POST /api/deploy-batch`) with D1 audit tracking.
- [x] Verify live Cloudflare execution: successfully detected `src/middleware/auth.ts` collision, generated unified code with zero conflict markers, and deployed candidate batch.

### Phase 5: The Executive Command Center UI
- [ ] Build a sleek, responsive dashboard (Tailwind + React/HTML).
- [ ] Implement interactive strategic sliders with instantaneous animated queue re-ordering.
- [ ] Add Intent Cards with business source badges, ARR tags, scorecards, and live Worker Preview links.
- [ ] Add the Concurrency & Conflict matrix visualization.
- [ ] Add the "1-Click Deploy Strategic Batch" button that merges winning forks into `main`.
- [ ] Add the Demo Controls dropdown (Reset, State 0, State 1, State 2).

### Phase 6: Open Source Distribution, Self-Hosting & Contest Polish
- [ ] License repository under the permissive **MIT License** with an official `LICENSE` file.
- [ ] Create an automated, 1-command setup and launch workflow (`npm run setup && npm run deploy`):
  * Auto-creates the D1 database (`wrangler d1 create dispatch-db`).
  * Applies schema and seeds data (`wrangler d1 execute`).
  * Provisions the initial Cloudflare Artifacts namespace and baseline `main` repo.
  * Deploys the full-stack Worker to the user's Cloudflare account.
- [ ] Initialize public GitHub repository with comprehensive `README.md`:
  * Clear architecture overview and visual diagrams.
  * Step-by-step instructions for running locally and deploying to Cloudflare in under 3 minutes.
  * Contest submission notes, video demo link, and architecture walkthrough.
- [ ] Write the 5–10 minute demonstration video script.
- [ ] Record the demonstration video highlighting the problem, the live sliders, real Artifacts operations, and conflict resolution.

---

## 9. Key File Structure (Target)

```
dispatch/
├── PROJECT_PLAN.md               # This master roadmap
├── LICENSE                       # MIT License (Contest Rule Requirement)
├── README.md                     # Contest overview & 1-click setup instructions
├── wrangler.jsonc                # Cloudflare Workers, Artifacts, D1 & AI config
├── schema.sql                    # D1 Database schema
├── seed.json                     # Seed Intent Packages & commit bundles
├── scripts/
│   ├── setup.ts                  # 1-command bootstrap (D1 setup, Artifacts seed)
│   └── reset.ts                  # CLI reset script (npm run demo:reset)
├── src/
│   ├── index.ts                  # Main Worker entry point & API routes
│   ├── artifacts.ts              # Artifacts binding wrapper (fork, read, commit, prune)
│   ├── evaluator.ts              # Workers AI Strategic Evaluator
│   ├── reconciler.ts             # Workers AI Conflict Reconciliation Agent
│   ├── ranker.ts                 # Dynamic Knapsack Re-ranking Engine
│   └── reset.ts                  # Demo Reset & Fast-Forward controller
└── public/                       # Executive Command Center UI
    ├── index.html
    ├── app.js
    └── styles.css
```

---

## 10. Open Source & Self-Hosting Strategy

To guarantee full compliance with Contest Rule #4 (*"The Project source code must be licensed under the MIT License, Apache 2.0, or BSD... and include instructions for running the Project"*), Dispatch is designed so any judge, developer, or team can launch their own instance with zero manual friction:

### Quickstart for Anyone Launching Dispatch:
```bash
# 1. Clone repository
git clone https://github.com/<username>/dispatch.git
cd dispatch

# 2. Install dependencies
npm install

# 3. One-Command Setup (provisions D1, initializes Artifacts, seeds baseline app)
npm run setup

# 4. Run locally with simulated Artifacts & local D1
npm run dev

# 5. Or deploy live to Cloudflare in one command
npm run deploy
```

