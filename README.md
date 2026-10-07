# Dispatch

**The Strategic Git Platform for the Agentic Era**

[![License: MIT](https://img.shields.io/badge/license-MIT-black.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-black.svg?style=flat-square&logo=cloudflare&logoColor=F38020)](https://workers.cloudflare.com)
[![Cloudflare Artifacts](https://img.shields.io/badge/Cloudflare-Artifacts-black.svg?style=flat-square&logo=cloudflare&logoColor=F38020)](https://developers.cloudflare.com/artifacts/)
[![Cloudflare D1](https://img.shields.io/badge/Cloudflare-D1-black.svg?style=flat-square&logo=cloudflare&logoColor=F38020)](https://developers.cloudflare.com/d1/)
[![Cloudflare Workers AI](https://img.shields.io/badge/Cloudflare-Workers_AI-black.svg?style=flat-square&logo=cloudflare&logoColor=F38020)](https://developers.cloudflare.com/workers-ai/)

> **Live Production Application:** [https://dispatch.gshaheen.workers.dev](https://dispatch.gshaheen.workers.dev)  
> **Competition Entry:** Cloudflare *Build the Next-Gen Git Platform* Challenge (October 2026)

---

## Overview

Traditional Git platforms (GitHub, GitLab) were architected for an era of **code scarcity**:
* Engineering hours are constrained, slow, and expensive.
* Product managers act as strict upfront gatekeepers before development begins.
* Once a pull request is submitted, teams inherit a strong sunk-cost bias to merge it.
* Standard Git PRs capture *what* changed (`diff`), but discard *why* it was built and *what business value* it produces.

### The Inverted Funnel

With autonomous coding agents, **implementation cost approaches zero**:
* Hundreds of features, performance refactors, and vulnerability patches can be generated concurrently.
* Development starts immediately across isolated branches and repositories.
* **The New Bottleneck:** Review bandwidth, blast-radius containment, concurrency collisions, dependency co-scheduling, and strategic alignment.
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
│  │ Candidate Batch • Conflicts • Custom Spec │ │ Live Infrastructure Telemetry Stream│  │
│  └───────────────────────────────────────────┘ └────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ Dynamic Deployment Queue (DAG File-Tree Hierarchy • IN BATCH Badges • FLIP Motion)│  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ REST API / Workers Static Assets
┌───────────────────────────────────────────▼────────────────────────────────────────────┐
│                    Dispatch Core Engine (Cloudflare Workers)                           │
│  • Topological DAG Knapsack Ranker: Score = w_growth·S_g + w_cost·S_c + w_risk·S_r     │
│  • Concurrency Collision Detector & Semantic Reconciliation Agent                      │
│  • Layer 3 Security Guardrails & In-Worker Sliding-Window Rate Limiter                 │
│  • Ephemeral Fork Lifecycle & Clean Pruning Controller                                 │
└──────────────┬────────────────────────────┬────────────────────────────┬───────────────┘
               │                            │                            │
┌──────────────▼────────────┐ ┌─────────────▼────────────┐ ┌─────────────▼─────────────┐
│    Cloudflare Artifacts   │ │      Cloudflare D1       │ │   Cloudflare Workers AI   │
│ • `dispatch-main` baseline│ │ • Intent Packages table  │ │ • Meta Llama 3.3 70B Fast │
│ • Ephemeral agent forks   │ │ • Active weights config  │ │ • 3-Dimension evaluation  │
│ • Reconcile workspaces    │ │ • Deployments audit log  │ │ • AST semantic union      │
│ • Ephemeral fork pruning  │ │ • Conflict resolution log│ │ • Zero merge markers      │
└───────────────────────────┘ └──────────────────────────┘ └───────────────────────────┘
```

---

## Core Capabilities

### 1. Dynamic Strategic Posture & Real-Time Steering
Engineering and executive leadership steer organizational release priorities in real time:
* **Revenue & Growth:** Prioritizes enterprise SAML/SSO deals, multi-currency payment workflows, and compliance exports.
* **Cost & Efficiency:** Prioritizes edge KV caching, database query batching, and network payload compression.
* **Risk & Security:** Prioritizes zero-day CVE patches, edge rate limiting, and parameter sanitization.

Adjusting any posture dial dynamically re-computes composite scores client-side and persists weights back to Cloudflare D1 via dual-layer storage (`localStorage` + D1 `POST /api/weights`), preserving executive choices across page refreshes.

### 2. Topological DAG Knapsack Ranker & Minimalist File-Tree
Real enterprise software exhibits strict dependency chains. Dispatch treats pull requests as nodes in an architectural graph rather than isolated diffs:
* **Topological Co-Scheduling:** If a high-priority intent requires an upstream prerequisite (e.g. `SOC2 Audit Logging` requires `Enterprise SAML SSO`), the knapsack ranker automatically co-schedules the prerequisite ahead of the dependent or flags DAG guards (`dagWarnings`).
* **Minimalist File-Tree Hierarchy:** Dependent PRs render clustered directly beneath their prerequisites using clean monospace tree branch connectors (`├── `, `└── `, `│   └── `), showing at a glance how changes roll together to deploy.
* **Hierarchical Outline Ranking:** Displays clean outline numbering (`#1` for root prerequisite, `1.1` for child, `1.2` for downstream child) preserving full visibility across all seven data columns.
* **Architectural Status Tags:** Clearly tags packages with `DAG ROOT`, `↳ REQUIRES: <prereq>`, or `✓ BASELINE` when already merged.

### 3. Candidate Release Batch & Visual Status Badging
* **`IN BATCH` Visual Indicators:** Every PR selected by the knapsack ranker into the Candidate Release Batch is highlighted with a signature Cloudflare orange indicator badge (`● IN BATCH`) and a distinct left accent border (`3px solid var(--brand-orange)`).
* **Live Knapsack Synchronization:** As posture dials move, candidate batch selection and cumulative impact metrics (ARR, efficiency, risk reduction) update in real time with immediate visual feedback.

### 4. Smooth FLIP Reordering Animation
* **Physics-Smooth Transitions:** Replaces abrupt table redraws with a First-Last-Invert-Play (FLIP) layout transition using `getBoundingClientRect()` and GPU hardware transforms (`translateY`).
* **Display Refresh Throttling:** Rapid dial adjustments use `requestAnimationFrame` to deliver silky-smooth 60fps/120fps motion as rows glide past each other without layout jumps.

### 5. Multi-Agent Concurrency via Cloudflare Artifacts
* **Forks as Ephemeral Primitives:** Repositories are lightweight primitives. When agent swarms generate code, Dispatch programmatically spawns isolated forks (`task-*`) from baseline `dispatch-main` in milliseconds via native Workers bindings (`env.ARTIFACTS`).
* **Git Mechanics Transparency:** The dashboard exposes authentic Git primitives—clone URLs (`https://artifacts.cloudflare.com/dispatch/<fork>.git`), commit SHAs, ancestor baseline references (`dispatch-main @ v1.0.0-baseline [b92e104]`), and explicit fast-forward merge/prune logs in the live telemetry stream.

### 6. Multi-Dimensional Strategic Evaluator (Workers AI)
* **Llama 3.3 70B GPU Inference:** Incoming intent packages and on-the-fly custom specifications are evaluated at the edge by `@cf/meta/llama-3.3-70b-instruct-fp8-fast`.
* **Context Preservation:** Workers AI analyzes commercial metadata (ARR at risk, CVE severity, P95 latency metrics) and the unified code diff to generate structured scores (-100 to +100) across Growth, Cost, and Risk, complete with plain-English executive summaries.

### 7. Autonomous Semantic Conflict Reconciliation
* **Zero Merge Markers:** When concurrent high-priority forks modify overlapping files (e.g. `task-growth-sso` and `task-risk-cve` both editing `src/middleware/auth.ts`), traditional Git aborts with textual conflict markers (`<<<<<<< HEAD`).
* **Automated 3-Way AST Union:** Dispatch detects the collision, creates an isolated reconciliation fork (`reconcile-*`) in Artifacts, and invokes Workers AI to synthesize a unified AST implementation that preserves both business intents without human intervention.

### 8. Automated Ephemeral Fork Lifecycle & Release Batching
* **Knapsack Batching:** Solves for the optimal set of non-conflicting, topologically valid intent packages fitting within organizational release capacity.
* **1-Click Deployment:** Merges approved packages into the release stream, records audit entries in D1, and automatically garbage-collects ephemeral forks from Cloudflare Artifacts.
* **1-Click Environment Reset:** Wipes temporary forks, purges reconciliation records, re-seeds the baseline catalog, and restores default posture in under two seconds.

### 9. Layer 3 Security Guardrails & Abuse Shield
* **Frictionless Public Exploration:** Visitors can freely explore the live queue table, adjust strategic dials, view intent packages, and monitor the real-time telemetry stream without authentication friction.
* **Mutation Protection:** Destructive or compute-intensive state mutations (Workers AI inference, semantic reconciliation, batch deployment, and environment reset) require authorization via a configurable Worker secret (`DEMO_ACCESS_KEY`).
* **Abuse Shield:** In-worker rate limiters (8 AI requests/min, 10 resets/min) and automated scraper blocking protect Cloudflare resources from runaway consumption.

---

## User Interface Design

The Dispatch Executive Command Center is designed around modern **shadcn/ui** principles:
* **Monochrome Foundation:** Neutral dark/light color tokens, clean borders, and strict visual hierarchy.
* **System-Aware Theming:** Automatically synchronizes with OS preference (`color-scheme: light dark`) with manual toggles.
* **Data-Dense Deployment Queue:** Detailed table displaying rank, composite score, commercial context, multi-factor impact badges, repository fork name, `IN BATCH` tag, and color-coded status badges (`READY`, `COLLISION`, `RECONCILED`, `DEPLOYED`).
* **Live Infrastructure Telemetry Console:** A dedicated terminal stream on the dashboard tracking Workers API execution, D1 queries, Artifacts fork operations, and Workers AI inference passes in real time.
* **Intent Package Inspector:** Detailed slide-over modal rendering source context, metric breakdowns, DAG prerequisites, Artifacts remote URLs, and code diffs.

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

*(Optional)* To guard state mutations on your deployment, configure an access key secret:
```bash
npx wrangler secret put DEMO_ACCESS_KEY
```

---

## License

This project is licensed under the **MIT License** in full compliance with Cloudflare competition guidelines. See [`LICENSE`](./LICENSE) for terms.
