# Dispatch

**The Strategic Git Platform for the Agentic Era**

[![License: MIT](https://img.shields.io/badge/license-MIT-black.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-black.svg?style=flat-square&logo=cloudflare&logoColor=F38020)](https://workers.cloudflare.com)
[![Cloudflare Artifacts](https://img.shields.io/badge/Cloudflare-Artifacts-black.svg?style=flat-square&logo=cloudflare&logoColor=F38020)](https://developers.cloudflare.com/artifacts/)
[![Cloudflare D1](https://img.shields.io/badge/Cloudflare-D1-black.svg?style=flat-square&logo=cloudflare&logoColor=F38020)](https://developers.cloudflare.com/d1/)
[![Cloudflare Workers AI](https://img.shields.io/badge/Cloudflare-Workers_AI-black.svg?style=flat-square&logo=cloudflare&logoColor=F38020)](https://developers.cloudflare.com/workers-ai/)

> **Live Production Application:** [https://dispatch.gshaheen.workers.dev](https://dispatch.gshaheen.workers.dev)  
> **Evaluator Direct Access (Full Mutation Rights):** [https://dispatch.gshaheen.workers.dev?access=cf-dispatch-2026](https://dispatch.gshaheen.workers.dev?access=cf-dispatch-2026)  
> **Competition Entry:** Cloudflare *Build the Next-Gen Git Platform* Challenge (October 2026)

---

## Overview

Traditional Git platforms (GitHub, GitLab) were architected for an era of **code scarcity**:
* Engineering hours are constrained and expensive.
* Product managers act as strict upfront gatekeepers before development begins.
* Once a pull request is submitted, teams inherit a strong sunk-cost bias to merge it.
* Standard Git PRs capture *what* changed (`diff`), but discard *why* it was built and *what business value* it produces.

### The Inverted Funnel

With autonomous coding agents, **implementation cost approaches zero**:
* Hundreds of features, performance refactors, and vulnerability patches can be generated concurrently.
* Development starts immediately across isolated branches and repositories.
* **The New Bottleneck:** Review bandwidth, blast-radius containment, concurrency collisions, and strategic alignment.
* **The Solution:** A pull request is no longer a guaranteed commitment—it is an **executable option contract**. Dispatch continuously scores, reconciles, and dispatches code changes to production based on real-time business strategy (**Revenue Growth**, **Cost Efficiency**, **Risk Reduction**).

---

## System Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        Executive Command Center (shadcn/ui)                            │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ Strategic Posture Dials & Presets (Growth / Cost / Risk Knapsack Weights)         │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────┐ ┌────────────────────────────────────┐  │
│  │ Release Batch • Conflicts • Custom Spec   │ │ Live Infrastructure Telemetry Stream│  │
│  └───────────────────────────────────────────┘ └────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ Dynamic Deployment Queue Table (Real-time dynamic re-ranking & inspection modal) │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ REST API / Workers Static Assets
┌───────────────────────────────────────────▼────────────────────────────────────────────┐
│                    Dispatch Core Engine (Cloudflare Workers)                           │
│  • Knapsack Release Ranker: Score = w_growth·S_g + w_cost·S_c + w_risk·S_r             │
│  • Concurrency Collision Detector & Semantic Reconciliation Agent                      │
│  • Layer 3 Security Guardrails & In-Worker Sliding-Window Rate Limiter                 │
│  • Ephemeral Fork Lifecycle & Clean Pruning Controller                                 │
└──────────────┬────────────────────────────┬────────────────────────────┬───────────────┘
               │                            │                            │
┌──────────────▼────────────┐ ┌─────────────▼────────────┐ ┌─────────────▼─────────────┐
│    Cloudflare Artifacts   │ │      Cloudflare D1       │ │   Cloudflare Workers AI   │
│ • `dispatch-main` baseline│ │ • Intent Packages table  │ │ • Meta Llama 3.3 70B      │
│ • Ephemeral agent forks   │ │ • Active weights config  │ │ • 3-Dimension evaluation  │
│ • Reconcile workspaces    │ │ • Deployments audit log  │ │ • AST semantic union      │
│ • Ephemeral fork pruning  │ │ • Conflict resolution log│ │ • Zero merge markers      │
└───────────────────────────┘ └──────────────────────────┘ └───────────────────────────┘
```

---

## Core Capabilities

### 1. Dynamic Strategic Posture
Engineering and executive leadership steer organizational release priorities in real time:
* **Revenue & Growth:** Prioritizes enterprise SAML/SSO deals, multi-currency payment workflows, and compliance exports.
* **Cost & Efficiency:** Prioritizes edge KV caching, database query batching, and network payload compression.
* **Risk & Security:** Prioritizes zero-day CVE patches, edge rate limiting, and parameter sanitization.

Adjusting any posture dial instantly re-computes composite scores client-side and re-sorts the entire deployment queue in real time without page reloads.

### 2. Multi-Agent Concurrency via Cloudflare Artifacts
* Cloudflare Artifacts treats repositories as **lightweight, ephemeral primitives**.
* When agent swarms generate code, Dispatch programmatically spawns isolated forks (`task-*`) from baseline `dispatch-main` in milliseconds via native Workers bindings (`env.ARTIFACTS`).
* Work completes in complete isolation without repository or branch pollution.

### 3. Multi-Dimensional Strategic Evaluator (Workers AI)
* Incoming intent packages and on-the-fly custom specs are evaluated by `@cf/meta/llama-3.3-70b-instruct`.
* Workers AI analyzes both commercial metadata (ARR at risk, CVE severity, P95 latency metrics) and the unified code diff.
* Generates structured normalized scores (-100 to +100) across Growth, Cost, and Risk, complete with plain-English rationales and executive summaries.

### 4. Autonomous Semantic Conflict Reconciliation
* When two concurrent high-priority forks modify overlapping files (e.g. `task-growth-sso` and `task-risk-cve` both editing `src/middleware/auth.ts`), traditional Git aborts with textual conflict markers (`<<<<<<< HEAD`).
* Dispatch detects the collision, creates an isolated reconciliation fork (`reconcile-*`) in Artifacts, and invokes Workers AI to synthesize a unified AST implementation that preserves both business intents without human intervention.

### 5. Automated Ephemeral Fork Lifecycle & Release Batching
* **Knapsack Batching:** Solves for the optimal set of non-conflicting, high-value intent packages fitting within organizational risk budgets.
* **1-Click Deployment:** Merges approved packages into the release stream, records audit entries in D1, and automatically prunes merged ephemeral forks from Cloudflare Artifacts.
* **1-Click Environment Reset:** Wipes temporary forks, clears deployed states, re-seeds the baseline catalog, and restores default posture in under two seconds.

### 6. Layer 3 Security Guardrails
* **Public Read Access:** Visitors and judges can explore the live queue table, inspect intent packages, and evaluate real-time slider re-ranking without login friction.
* **Mutation Protection:** State mutations (Workers AI inference, reconciliation, batch deployment, and environment reset) require authorization via `env.DEMO_ACCESS_KEY`.
* **Presenter Direct URL:** Accessing via `?access=cf-dispatch-2026` stores credentials in `localStorage` and cleans the URL bar automatically.
* **Abuse Shield:** In-worker rate limiters (8 AI requests/min, 10 resets/min) and automated scraper blocking protect Cloudflare resources from runaway consumption.

---

## User Interface Design

The Dispatch Executive Command Center is designed around modern **shadcn/ui** principles:
* **Monochrome Foundation:** Neutral dark/light color tokens, clean borders, and strict visual hierarchy.
* **System-Aware Theming:** Automatically synchronizes with OS preference (`color-scheme: light dark`) with manual toggles.
* **Data-Dense Deployment Queue Table:** Replaces unstructured cards with a streamlined table detailing rank, composite score, commercial context, multi-factor impact badges, repository fork name, and color-coded status badges (`READY`, `COLLISION`, `RECONCILED`, `DEPLOYED`).
* **Live Infrastructure Telemetry Console:** A dedicated terminal stream on the dashboard tracking Workers API execution, D1 queries, Artifacts fork operations, and Workers AI inference passes in real time.
* **Intent Package Inspector:** Detailed slide-over modal rendering source context, metric breakdowns, Artifacts remote URLs, and full code diffs.

---

## Quickstart & Self-Hosting

Dispatch can be deployed to your own Cloudflare account in under three minutes:

### 1. Prerequisites
* Node.js 18+
* A Cloudflare account with Workers, D1, Workers AI, and Artifacts enabled
* Cloudflare Wrangler CLI authenticated (`npx wrangler login`)

### 2. Installation
```bash
git clone https://github.com/gshaheen/dispatch.git
cd dispatch
npm install
```

### 3. Automated Bootstrap
```bash
npm run setup
```
The setup script:
1. Validates your Cloudflare credentials.
2. Creates and binds the `dispatch-db` D1 database.
3. Applies `schema.sql` and seeds the multi-dimensional Intent Catalog.
4. Configures Cloudflare Artifacts with the baseline SaaS repository.

### 4. Development & Deployment
```bash
# Run locally with Miniflare simulation:
npm run dev

# Deploy to Cloudflare Workers edge:
npm run deploy
```

---

## Demonstration Script

| Scene | Target Duration | Narration & Walkthrough |
| :--- | :--- | :--- |
| **1. The Post-Scarcity Dilemma** | 0:00 - 1:30 | Explain why code scarcity is over: *"When AI agents write all the code, writing code is no longer the bottleneck. The bottleneck is prioritization, conflict resolution, and aligning deployments with real-time business strategy."* |
| **2. Ephemeral Artifacts Swarms** | 1:30 - 3:00 | Highlight the 10 concurrent tasks running in isolated Cloudflare Artifacts forks without cluttering the main branch. Point out the live telemetry stream tracking edge operations. |
| **3. Real-Time Dynamic Re-Ranking** | 3:00 - 4:45 | Drag the Strategic Posture dials: <br>• **Growth (80%):** Enterprise SAML ($280k ARR) and Vanguard Audit ($350k ARR) surge to #1. <br>• **Cost (80%):** Edge KV Cache (-145ms latency) and D1 Batching surge to #1. <br>• **Risk (80%):** CVE-2026-8812 Auth patch surges to #1. |
| **4. Autonomous Semantic Reconciliation** | 4:45 - 6:30 | Demonstrate the Concurrency Collision between SAML SSO and the JWT CVE in `src/middleware/auth.ts`. Click **Reconcile with AI**. Show Workers AI generating a unified AST solution in an Artifacts workspace with zero conflict markers. |
| **5. Strategic Batch Deployment** | 6:30 - 7:30 | Review the knapsack-calculated release candidate batch and click **Deploy Strategic Batch**. Show forks merged, audit records written to D1, and ephemeral repositories automatically pruned. |
| **6. Custom Spec Evaluation & Reset** | 7:30 - 8:30 | Enter a custom feature spec (e.g. "Add Apple Pay with $180k ARR"). Show Workers AI evaluate it on the fly and provision a new fork. Click **Reset Environment** to show full cleanup in under two seconds. |

---

## License

This project is licensed under the **MIT License** in full compliance with Cloudflare competition guidelines. See [`LICENSE`](./LICENSE) for terms.
