# 🍊 Dispatch: The Strategic Git Platform for the Agentic Era

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare)](https://workers.cloudflare.com)
[![Cloudflare Artifacts](https://img.shields.io/badge/Cloudflare-Artifacts-F38020?logo=cloudflare)](https://developers.cloudflare.com/artifacts/)
[![Cloudflare D1](https://img.shields.io/badge/Cloudflare-D1-F38020?logo=cloudflare)](https://developers.cloudflare.com/d1/)
[![Cloudflare Kumo](https://img.shields.io/badge/UI-Cloudflare%20Kumo-F38020)](https://github.com/cloudflare/kumo)

> **Live Production Demo:** [https://dispatch.gshaheen.workers.dev](https://dispatch.gshaheen.workers.dev)  
> **Built for:** Cloudflare's *"Build the Next-Gen Git Platform"* Competition (October 2026).

---

## 💡 The Core Thesis: Inverting the Development Funnel

Traditional Git platforms (GitHub, GitLab) were designed for an era of **code scarcity**:
* Human developer hours are expensive and constrained.
* Product Managers act as strict gatekeepers **before** code is written (RICE scoring, backlog grooming).
* Once a PR is opened, organizations have a strong sunk-cost bias to merge it.
* Traditional Git records *what* changed (`diff`), but completely discards *why* it changed and *what business value* it creates.

### The Agentic Paradigm Shift
With autonomous coding agents, **implementation cost approaches zero**:
* Hundreds of features, bug patches, and performance refactors can be coded concurrently.
* Work starts immediately without upfront human gating.
* **The New Bottleneck:** Review bandwidth, blast radius management, and deployment prioritization.
* **The Solution:** A PR is no longer a guaranteed commitment; it is an **executable option contract**. **Dispatch** continuously ranks and dispatches code changes to production governed by the company's real-time strategic priorities (**Revenue Growth**, **Cost Efficiency**, **Risk Reduction**).

---

## 🚀 Key Features

### 1. Executive Strategic Priority Dials
Executives and engineering leaders dynamically adjust company postures in real time:
* **🚀 Revenue & Growth:** Prioritizes enterprise compliance deals, new market integrations, and customer-requested features.
* **⚡ Cost & Efficiency:** Prioritizes edge caching, database query batching, and egress compression.
* **🛡️ Risk & Security:** Prioritizes critical CVE remediation, rate limiting, and input sanitization.

*Drag any slider on the dashboard, and the entire deployment queue re-ranks instantaneously across the company.*

### 2. Multi-Agent Concurrency via Cloudflare Artifacts
* Repositories in Dispatch are **lightweight, ephemeral primitives**.
* When an agent task is triggered, Dispatch uses the Workers binding (`env.ARTIFACTS.get('dispatch-main').fork('task-...')`) to spawn an isolated repository fork in milliseconds.
* Each agent operates in its own sandbox with scoped Git tokens—eliminating branch clutter on the main repository.

### 3. Multi-Dimensional Strategic Evaluator (Workers AI)
* When code changes are submitted, the **Strategic Evaluator Agent** (powered by `@cf/meta/llama-3.3-70b-instruct`) evaluates the **Business Intent Package + Code Diff**.
* Scores each change on a standardized scale (-100 to +100) across Growth, Cost, and Risk.
* Generates a concise, plain-English **Executive Impact Summary** preserved immutably alongside the code.

### 4. Autonomous Semantic Conflict Reconciliation Agent
* When two high-priority candidate forks touch overlapping files (e.g. one adds Enterprise SAML SSO while another patches a critical JWT CVE in `src/middleware/auth.ts`), traditional Git throws `<<<<<<< HEAD` merge conflicts.
* Dispatch spawns a dedicated reconciliation fork (`reconcile-...`) in Cloudflare Artifacts where an autonomous AI agent synthesizes a **unified implementation** that preserves *both* business intents with zero manual intervention.

### 5. Cloudflare Kumo UI & Adaptive Theming
* Built with Cloudflare's official **Kumo** design system tokens.
* **Adaptive Theme Control:** Defaults automatically to the user's OS system theme (`color-scheme: light dark`), with manual toggle buttons for explicit **☀️ Light** and **🌙 Dark** modes.

### 6. 1-Click Demo Reset & Fast-Forward Engine
* Built-in reset controller (`POST /api/demo/reset`) that prunes all ephemeral Artifacts forks, resets D1 state, and restores baseline repos in under 2 seconds for repeatable demonstrations.

---

## 🏛️ Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│             Executive Command Center (Cloudflare Kumo UI)              │
│  [Strategic Dials]  [Dynamic Deployment Queue]  [Conflict Visualizer]  │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ REST / Assets
┌────────────────────────────────────▼───────────────────────────────────┐
│               Dispatch Core Engine (Cloudflare Workers)                │
│  - Re-ranking Engine: Score = w_growth·S_g + w_cost·S_c + w_risk·S_r   │
│  - Fork & Task Orchestrator                                            │
│  - Semantic Conflict Reconciliation Agent                              │
│  - Demo Reset & Fast-Forward Controller                                │
└────────┬───────────────────────────┬───────────────────────────┬───────┘
         │                           │                           │
┌────────▼───────────────┐ ┌─────────▼───────────────┐ ┌─────────▼───────┐
│  Cloudflare Artifacts  │ │      Cloudflare D1      │ │  Workers AI /   │
│ - `dispatch-main` repo │ │ - Intent Packages       │ │   Llama 3.3 70B │
│ - Ephemeral task forks │ │ - Strategic Weights     │ │ - Evaluation    │
│ - Scoped Git tokens    │ │ - Reconcile records     │ │ - Reconciliation│
└────────────────────────┘ └─────────────────────────┘ └─────────────────┘
```

---

## ⚡ 1-Command Self-Hosting Quickstart

Any developer or judge can launch their own instance of Dispatch in under 3 minutes:

### 1. Clone & Install
```bash
git clone https://github.com/gshaheen/dispatch.git
cd dispatch
npm install
```

### 2. Bootstrap Cloudflare Resources
```bash
npm run setup
```
*This automated script applies the D1 schema, seeds the multi-dimensional intent catalog, and configures the environment.*

### 3. Run Locally or Deploy Live
```bash
# Run locally with Miniflare simulation:
npm run dev

# Or deploy live to your Cloudflare account in one command:
npm run deploy
```

---

## 🎬 5–10 Minute Demo Video Walkthrough Script

| Scene | Duration | Action & Narration |
| :--- | :--- | :--- |
| **1. The Dilemma** | 0:00 - 1:30 | Explain the post-scarcity coding problem: *"When agents write all the code, writing code is no longer the bottleneck. The bottleneck is review, conflict management, and deciding what to deploy based on business strategy."* |
| **2. The Swarm in Artifacts** | 1:30 - 3:00 | Show the 10 concurrent agent tasks running in isolated Cloudflare Artifacts forks. Highlight how Artifacts handles millions of ephemeral repos without cluttering the main project. |
| **3. The Magic Moment (Re-Ranking)** | 3:00 - 4:45 | Drag the Strategic Priority Dials in the Kumo UI: <br>• Slide to **Growth (80%)** $\rightarrow$ SAML SSO ($280k ARR) and Vanguard Audit ($350k ARR) surge to #1. <br>• Slide to **Cost (80%)** $\rightarrow$ Edge Cache (-145ms P95) and D1 Query Batching surge to #1. <br>• Slide to **Risk (80%)** $\rightarrow$ CVE-2026-8812 Auth patch surges to #1. |
| **4. Autonomous Conflict Resolution** | 4:45 - 6:30 | Show the Concurrency Collision between SSO and CVE-2026-8812 in `auth.ts`. Click **"🤖 Reconcile with Agent"**. Watch the AI agent synthesize unified code in a dedicated Artifacts fork with zero conflict markers. |
| **5. Strategic Deployment** | 6:30 - 7:30 | Click **"🚀 Deploy Strategic Batch"**. The top-ranked, verified release candidate batch is merged and deployed live. |
| **6. The Reset** | 7:30 - 8:30 | Click **"🔄 Reset Demo"**. Show Artifacts pruning all ephemeral forks and returning to baseline in 2 seconds. |

---

## 📜 License & Compliance

Distributed under the **MIT License** in full compliance with Cloudflare's competition rules. See [`LICENSE`](./LICENSE) for full details.
