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

### Phase 5: The Executive Command Center UI (COMPLETED)
- [x] Build sleek, responsive executive dark-mode dashboard ([`public/index.html`](file:///Users/georgeshaheen/Desktop/repos/dispatch/public/index.html) & [`public/styles.css`](file:///Users/georgeshaheen/Desktop/repos/dispatch/public/styles.css)).
- [x] Implement interactive strategic priority sliders (Growth, Cost, Risk) with normalized automatic weighting and instant client-side dynamic queue re-ordering.
- [x] Add Intent Cards with business source badges ($ ARR, P95 latency, CVE alerts), scorecards, and branch fork tags.
- [x] Add Concurrency & Conflict detection panel with 1-click "Reconcile with Agent" action.
- [x] Add Candidate Release Batch panel with cumulative metrics and "1-Click Deploy Strategic Batch".
- [x] Add Demo Controls (Swarm Ready / Fast-Forward, 1-Click Clean Reset) and live Custom Spec evaluation prompt.
- [x] Deployed live to Cloudflare Workers Static Assets (`https://dispatch.gshaheen.workers.dev`).

### Phase 6: Open Source Distribution, Self-Hosting & Contest Polish (COMPLETED)
- [x] License repository under the permissive **MIT License** with an official [`LICENSE`](file:///Users/georgeshaheen/Desktop/repos/dispatch/LICENSE) file.
- [x] Integrate Cloudflare **Kumo** design system tokens ([`public/kumo.css`](file:///Users/georgeshaheen/Desktop/repos/dispatch/public/kumo.css)) with automatic OS system theme detection and manual light/dark switching.
- [x] Create an automated, 1-command setup and launch workflow ([`scripts/setup.mjs`](file:///Users/georgeshaheen/Desktop/repos/dispatch/scripts/setup.mjs)):
  * Verifies Cloudflare credentials.
  * Applies schema and seeds data to D1.
  * Configures Artifacts and displays local/deploy instructions.
- [x] Create comprehensive, world-class [`README.md`](file:///Users/georgeshaheen/Desktop/repos/dispatch/README.md) with visual architecture diagrams, 3-minute self-hosting quickstart, and full 5–10 minute demonstration video script.
- [x] Synchronized with public GitHub repository: [https://github.com/gshaheen/dispatch](https://github.com/gshaheen/dispatch).

### Phase 7: Security Guardrails & Layer 3 Passcode Protection (COMPLETED)
- [x] Edge IP Rate Limiter & Abuse Shield: In-memory sliding-window bucket capping AI inference (8 req/min) and resets (10 req/min) to prevent resource drain while allowing natural evaluator testing.
- [x] Automated Scraper Blocker: Intercepts automated headless scrapers (`python-requests`, `aiohttp`, `scrapy`, `sqlmap`) missing the application token.
- [x] Layer 3 Passcode / Access Key Authorization:
  * Protects state mutations (`POST /api/reconcile`, `POST /api/deploy-batch`, `POST /api/demo/reset`, `POST /api/evaluate-custom`) behind configurable `DEMO_ACCESS_KEY` (default: `cf-dispatch-2026`).
  * Preserves frictionless public read-only access (`GET /api/intents`, `GET /api/weights`, `GET /api/batch`, `GET /api/conflicts`) and allows public slider posture adjustments (`POST /api/weights`).
  * Seamless presenter URL parameter: visiting `?access=cf-dispatch-2026` automatically registers and persists the key in `localStorage` and cleans the URL via `history.replaceState`.
  * Interactive shadcn-style Passcode Dialog interceptor: unauthorized mutations trigger a clean modal prompt with default key assistance.
  * Environment reset pruning fix: verified that custom intent submissions (`task-custom-*`) are thoroughly deleted from both Cloudflare Artifacts forks and D1 database tables upon reset.

### Phase 8: Enterprise DAG Graph, Git Primitives Visibility & Workers AI Suffix Alignment (COMPLETED)
- [x] Workers AI Model Suffix Alignment: Fixed model string to `@cf/meta/llama-3.3-70b-instruct-fp8-fast` across evaluation and reconciliation pipelines, ensuring active GPU token generation without gateway rejection.
- [x] Topological DAG in Knapsack Ranker:
  * Model enterprise dependency chains in Intent Packages (`dependsOn`).
  * Knapsack ranker resolves upstream prerequisites, topologically co-scheduling dependencies or deferring invalid batches (`dagWarnings`).
  * Rendered visual DAG badges in the queue table (`✓ Requires: sso` / `⏳ Requires: sso`) and dedicated architectural dependency breakdown in the inspector modal.
- [x] Cloudflare Artifacts Git Primitives Visibility:
  * Expose explicit Git mechanics: commit SHAs (`7a8f3b2`), ancestor baseline ref (`dispatch-main @ v1.0.0 [b92e104]`), and copyable `git clone https://artifacts.cloudflare.com/dispatch/...` command.
  * Live Telemetry Console outputs explicit Git CLI operations on fast-forward merges, commit hashes, and ephemeral fork garbage-collection.
- [x] Client-Side Sliders vs. Server Truth Persistence:
  * Unlocked public posture adjustment via `POST /api/weights`.
  * Implemented dual-layer persistence (`localStorage` + D1) so custom strategic postures survive hard page refreshes seamlessly.

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
git clone https://github.com/gshaheen/dispatch.git
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

---

## 11. Minimalist UI & Demo Streamlining Addendum

- **Dynamic Deployment Queue Table:** Replaced card grid with a minimalist, data-dense table providing rank, priority score, intent title, business context badge, impact scores (Growth/Cost/Risk), Artifact fork name, and color-coded status.
- **Intent Package Inspection Modal:** Any row or "Inspect" button opens a comprehensive modal displaying Workers AI executive summaries, multi-dimensional score breakdown, business context, Artifacts clone URL, and modified code diffs.
- **Automatic Evaluated Baseline:** Baseline catalog seeds directly in the evaluated state with forks provisioned, eliminating manual fast-forward prerequisites before demoing.
- **Immediate Conflict State Resolution:** Reconciled pairs dynamically clear from the concurrency collision card upon resolution and show purple `✨ Reconciled` badges in the queue.
- **Artifacts Ephemeral Fork Pruning on Deploy:** Merged candidate releases and reset operations systematically prune ephemeral task and reconciliation forks from Cloudflare Artifacts.
- **Live Custom Evaluation & Forking:** Custom intent submissions invoke Workers AI and automatically spin up isolated `task-custom-*` forks in Artifacts.


