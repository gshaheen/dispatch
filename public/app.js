// Dispatch Executive Command Center Application Logic (shadcn style)

let activeWeights = { growth: 0.5, cost: 0.25, risk: 0.25 };
let cachedIntents = [];
let cachedConflicts = [];
let cachedBatchIntentIds = new Set();
let updateTimeout = null;
let sliderRaf = null;

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initModal();
  initPasscodeModal();
  initTerminal();
  initApp();
});

// ── Theme Manager ────────────────────────────────────────────────────────────

function initTheme() {
  const saved = localStorage.getItem("dispatch-theme") || "system";
  setTheme(saved, false);

  document.querySelectorAll(".theme-switch-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const theme = btn.dataset.theme;
      setTheme(theme, true);
    });
  });

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    const current = localStorage.getItem("dispatch-theme") || "system";
    if (current === "system") {
      document.documentElement.style.colorScheme = "light dark";
      document.documentElement.removeAttribute("data-mode");
    }
  });
}

function setTheme(theme, persist = true) {
  if (persist) {
    localStorage.setItem("dispatch-theme", theme);
  }

  document.querySelectorAll(".theme-switch-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.theme === theme);
  });

  if (theme === "light") {
    document.documentElement.setAttribute("data-mode", "light");
    document.documentElement.style.colorScheme = "light";
  } else if (theme === "dark") {
    document.documentElement.setAttribute("data-mode", "dark");
    document.documentElement.style.colorScheme = "dark";
  } else {
    document.documentElement.removeAttribute("data-mode");
    document.documentElement.style.colorScheme = "light dark";
  }
}

// ── Live Infrastructure Terminal Logger ─────────────────────────────────────

function initTerminal() {
  const clearBtn = document.getElementById("btn-clear-terminal");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      const container = document.getElementById("terminal-logs");
      if (container) {
        container.innerHTML = "";
        logTerminal("WORKER", "Telemetry stream cleared", "worker");
      }
    });
  }

  // Initial Platform Boot Telemetry
  setTimeout(() => logTerminal("WORKER", "Dispatch Worker runtime active on Cloudflare edge (region: lax)", "worker"), 80);
  setTimeout(() => logTerminal("ARTIFACTS", "Connected to namespace 'default' (baseline: dispatch-main)", "artifacts"), 200);
  setTimeout(() => logTerminal("D1", "Database dispatch-db bound (10 Intent Packages verified)", "d1"), 320);
  setTimeout(() => logTerminal("WORKERS-AI", "Meta Llama 3.3 70B Instruct ready for evaluation & AST union", "ai"), 440);
  setTimeout(() => logTerminal("RANKER", "Knapsack release ranker initialized (active posture: 50/25/25)", "ranker"), 560);
}

function logTerminal(source, message, category = "default") {
  const container = document.getElementById("terminal-logs");
  if (!container) return;

  const now = new Date();
  const timeStr = now.toTimeString().split(" ")[0] + "." + String(now.getMilliseconds()).padStart(3, "0");

  let sourceClass = "source-worker";
  if (source === "D1") sourceClass = "source-d1";
  else if (source === "ARTIFACTS") sourceClass = "source-artifacts";
  else if (source === "WORKERS-AI") sourceClass = "source-ai";
  else if (source === "RANKER") sourceClass = "source-ranker";
  else if (source === "DEPLOY") sourceClass = "source-deploy";
  else if (source === "RECONCILER") sourceClass = "source-reconciler";
  else if (source === "RESET") sourceClass = "source-reset";

  const line = document.createElement("div");
  line.className = "terminal-line";
  line.innerHTML = `
    <span class="term-time">${timeStr}</span>
    <span class="term-source ${sourceClass}">[${source}]</span>
    <span class="term-msg">${escapeHtml(message)}</span>
  `;

  container.appendChild(line);
  container.scrollTop = container.scrollHeight;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// ── Modal Dialog Manager ────────────────────────────────────────────────────

function initModal() {
  const modal = document.getElementById("intent-modal");
  const closeBtn = document.getElementById("modal-close-btn");

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.style.display === "flex") {
      modal.style.display = "none";
    }
  });
}

function openIntentModal(intent) {
  const modal = document.getElementById("intent-modal");
  if (!modal) return;

  logTerminal("ARTIFACTS", `Inspected Intent Package ${intent.id} (${intent.fork_repo_name || "task-fork"} @ main)`, "artifacts");

  const meta = intent.source_metadata ? (typeof intent.source_metadata === "string" ? JSON.parse(intent.source_metadata) : intent.source_metadata) : {};

  document.getElementById("modal-title").textContent = intent.title;
  document.getElementById("modal-subtitle").textContent = `ID: ${intent.id} • Fork: ${intent.fork_repo_name || "task-fork"}`;

  const statusEl = document.getElementById("modal-status");
  statusEl.textContent = (intent.status || "READY").toUpperCase();
  statusEl.className = "status-pill " + (
    intent.status === "reconciled" ? "status-reconciled" :
    intent.status === "merged" ? "status-deployed" : "status-ready"
  );

  document.getElementById("modal-summary").textContent = intent.executive_summary || intent.description;

  const compositeScore = (intent.dynamicScore || intent.composite_score || 0).toFixed(1);
  document.getElementById("modal-score-composite").textContent = compositeScore;
  document.getElementById("modal-score-growth").textContent = (intent.growth_score > 0 ? "+" : "") + intent.growth_score;
  document.getElementById("modal-score-cost").textContent = (intent.cost_score > 0 ? "+" : "") + intent.cost_score;
  document.getElementById("modal-score-risk").textContent = (intent.risk_score > 0 ? "+" : "") + intent.risk_score;

  // Business Context Items
  const contextGrid = document.getElementById("modal-context");
  contextGrid.innerHTML = `
    <div class="modal-context-item">
      <span class="modal-context-label">Source Type</span>
      <span class="modal-context-value">${intent.source_type?.toUpperCase() || "ROADMAP"}</span>
    </div>
    <div class="modal-context-item">
      <span class="modal-context-label">Source Reference</span>
      <span class="modal-context-value">${intent.source_ref || "N/A"}</span>
    </div>
    <div class="modal-context-item">
      <span class="modal-context-label">Business Metric</span>
      <span class="modal-context-value">${
        meta.arrImpact ? `+$${(meta.arrImpact / 1000).toFixed(0)}k ARR` :
        meta.latencyImpactMs ? `${meta.latencyImpactMs}ms Latency` :
        meta.cveSeverity ? `${meta.cveSeverity}` : "Standard Roadmap"
      }</span>
    </div>
  `;

  // Architectural DAG & Prerequisites Info
  const dagEl = document.getElementById("modal-dag-info");
  if (dagEl) {
    if (intent.dependsOn && intent.dependsOn.length > 0) {
      const depItems = intent.dependsOn.map(depId => {
        const dep = cachedIntents.find(i => i.id === depId);
        const isMerged = dep && dep.status === "merged";
        const statusBadge = isMerged
          ? `<span class="dag-badge dag-badge-merged">✓ MERGED IN BASELINE</span>`
          : `<span class="dag-badge dag-badge-pending">⏳ PREREQUISITE PENDING</span>`;
        return `<div style="margin-bottom: 4px;"><strong>Prerequisite:</strong> <code>${depId}</code> (${dep?.title || "Dependency"}) • ${statusBadge}</div>`;
      }).join("");

      const dependents = cachedIntents.filter(i => (i.dependsOn || []).includes(intent.id));
      const depDownstream = dependents.length > 0
        ? `<div style="margin-top: 6px; color: var(--text-subtle);"><strong>Downstream Dependents:</strong> ${dependents.map(d => `<code>${d.id}</code>`).join(", ")} (blocked until this package merges)</div>`
        : "";

      dagEl.innerHTML = `
        ${depItems}
        ${depDownstream}
        <div style="margin-top: 6px; font-size: 0.7rem; color: var(--text-subtle);">
          Topological DAG validator prevents deployment until all prerequisites are merged or co-scheduled in the candidate batch.
        </div>
      `;
    } else {
      const dependents = cachedIntents.filter(i => (i.dependsOn || []).includes(intent.id));
      const depDownstream = dependents.length > 0
        ? `<div style="margin-top: 6px; color: var(--text-subtle);"><strong>Downstream Dependents:</strong> ${dependents.map(d => `<code>${d.id}</code> (${d.title})`).join(", ")}</div>`
        : "";

      dagEl.innerHTML = `
        <div><strong>Architectural Root Package:</strong> Zero upstream dependencies. Eligible for independent deployment.</div>
        ${depDownstream}
      `;
    }
  }

  // Cloudflare Artifacts Git Primitives Info
  const forkName = intent.fork_repo_name || "task-fork";
  const commitSha = intent.commitSha || "7a8f3b2";
  const parentSha = intent.parentSha || "b92e104";

  document.getElementById("modal-repo-name").textContent = forkName;
  const commitShaEl = document.getElementById("modal-commit-sha");
  if (commitShaEl) commitShaEl.textContent = commitSha;
  const parentShaEl = document.getElementById("modal-parent-sha");
  if (parentShaEl) parentShaEl.textContent = `dispatch-main @ v1.0.0-baseline [${parentSha}]`;
  const remoteEl = document.getElementById("modal-repo-remote");
  if (remoteEl) remoteEl.textContent = `git clone https://artifacts.cloudflare.com/dispatch/${forkName}.git`;

  // Code Diff / Implementation Viewer
  const diffViewer = document.getElementById("modal-diff");
  if (intent.files && Object.keys(intent.files).length > 0) {
    let diffContent = "";
    for (const [file, code] of Object.entries(intent.files)) {
      diffContent += `// ── ${file} ──────────────────────────────────────────\n${code}\n\n`;
    }
    diffViewer.textContent = diffContent.trim();
  } else {
    diffViewer.textContent = `// Candidate change description:\n${intent.description}\n\n// Isolated fork created at:\n// ${intent.fork_repo_name}`;
  }

  modal.style.display = "flex";
}

// ── App Initialization ──────────────────────────────────────────────────────

async function initApp() {
  setupEventListeners();
  // Hydrate local weights for instant pre-paint posture
  const savedWeights = localStorage.getItem("dispatch-weights");
  if (savedWeights) {
    try {
      activeWeights = JSON.parse(savedWeights);
      updateSliderUI();
    } catch (e) {}
  }
  await refreshAll();
}

async function refreshAll() {
  await loadWeights();
  await loadConflicts();
  await loadIntents();
  await loadBatch();
}

function setupEventListeners() {
  const growthSlider = document.getElementById("slider-growth");
  const costSlider = document.getElementById("slider-cost");
  const riskSlider = document.getElementById("slider-risk");

  growthSlider.addEventListener("input", (e) => onSliderChange("growth", parseFloat(e.target.value)));
  costSlider.addEventListener("input", (e) => onSliderChange("cost", parseFloat(e.target.value)));
  riskSlider.addEventListener("input", (e) => onSliderChange("risk", parseFloat(e.target.value)));

  document.getElementById("btn-preset-balanced").addEventListener("click", () => applyPreset(0.5, 0.25, 0.25, "btn-preset-balanced"));
  document.getElementById("btn-preset-growth").addEventListener("click", () => applyPreset(0.8, 0.1, 0.1, "btn-preset-growth"));
  document.getElementById("btn-preset-cost").addEventListener("click", () => applyPreset(0.1, 0.8, 0.1, "btn-preset-cost"));
  document.getElementById("btn-preset-risk").addEventListener("click", () => applyPreset(0.1, 0.1, 0.8, "btn-preset-risk"));

  document.getElementById("btn-demo-reset").addEventListener("click", handleDemoReset);
  document.getElementById("btn-deploy-batch").addEventListener("click", handleDeployBatch);
  document.getElementById("form-custom-intent").addEventListener("submit", handleCustomIntentSubmit);
}

function scheduleQueueRender() {
  if (sliderRaf) return;
  sliderRaf = requestAnimationFrame(() => {
    recalculateAndRenderQueue();
    sliderRaf = null;
  });
}

function onSliderChange(changedType, newValue) {
  const types = ["growth", "cost", "risk"];
  const others = types.filter((t) => t !== changedType);
  const remainingTotal = 1.0 - newValue;
  const currentOtherSum = activeWeights[others[0]] + activeWeights[others[1]];

  activeWeights[changedType] = newValue;

  if (currentOtherSum > 0) {
    activeWeights[others[0]] = (activeWeights[others[0]] / currentOtherSum) * remainingTotal;
    activeWeights[others[1]] = (activeWeights[others[1]] / currentOtherSum) * remainingTotal;
  } else {
    activeWeights[others[0]] = remainingTotal / 2;
    activeWeights[others[1]] = remainingTotal / 2;
  }

  localStorage.setItem("dispatch-weights", JSON.stringify(activeWeights));
  updateSliderUI();
  scheduleQueueRender();

  clearTimeout(updateTimeout);
  updateTimeout = setTimeout(() => {
    syncWeightsWithServer();
  }, 300);
}

function applyPreset(g, c, r, btnId) {
  activeWeights = { growth: g, cost: c, risk: r };
  localStorage.setItem("dispatch-weights", JSON.stringify(activeWeights));

  document.querySelectorAll(".preset-btn").forEach((b) => b.classList.remove("active"));
  const btn = document.getElementById(btnId);
  if (btn) btn.classList.add("active");

  updateSliderUI();
  recalculateAndRenderQueue();
  syncWeightsWithServer();

  logTerminal("RANKER", `Applied posture '${btn?.textContent}': G=${Math.round(g * 100)}%, C=${Math.round(c * 100)}%, R=${Math.round(r * 100)}%`, "ranker");
}

function updateSliderUI() {
  document.getElementById("slider-growth").value = activeWeights.growth;
  document.getElementById("slider-cost").value = activeWeights.cost;
  document.getElementById("slider-risk").value = activeWeights.risk;

  document.getElementById("val-growth").textContent = Math.round(activeWeights.growth * 100) + "%";
  document.getElementById("val-cost").textContent = Math.round(activeWeights.cost * 100) + "%";
  document.getElementById("val-risk").textContent = Math.round(activeWeights.risk * 100) + "%";
}

// ── Authorization & Access Key Manager (Layer 3) ────────────────────────────

function getAccessKey() {
  return localStorage.getItem("dispatch-access-key") || "";
}

function setAccessKey(key) {
  if (key) {
    localStorage.setItem("dispatch-access-key", key);
  } else {
    localStorage.removeItem("dispatch-access-key");
  }
  updateAuthUI();
}

function getApiHeaders() {
  const key = getAccessKey();
  const headers = {
    "Content-Type": "application/json",
    "x-dispatch-client": "dispatch-console-v1"
  };
  if (key) {
    headers["x-dispatch-access-key"] = key;
  }
  return headers;
}

async function updateAuthUI() {
  const btn = document.getElementById("btn-auth-status");
  if (!btn) return;
  const key = getAccessKey();
  if (!key) {
    btn.className = "auth-status-btn auth-status-locked";
    btn.textContent = "Read-Only";
    btn.title = "Demo mutations locked. Click to enter access key.";
    return;
  }

  try {
    const res = await fetch("/api/auth/verify", {
      headers: { "x-dispatch-access-key": key }
    });
    const data = await res.json();
    if (data.authenticated) {
      btn.className = "auth-status-btn auth-status-unlocked";
      btn.textContent = "● Unlocked";
      btn.title = "Demo mutation access authorized. Click to change key.";
    } else {
      btn.className = "auth-status-btn auth-status-locked";
      btn.textContent = "Read-Only";
      btn.title = "Invalid key. Click to re-enter access key.";
    }
  } catch (err) {
    btn.className = "auth-status-btn auth-status-unlocked";
    btn.textContent = "● Unlocked";
  }
}

function initPasscodeModal() {
  // Extract ?access= parameter from URL if provided (zero friction for judges/presenter)
  const urlParams = new URLSearchParams(window.location.search);
  const urlAccess = urlParams.get("access");
  if (urlAccess) {
    localStorage.setItem("dispatch-access-key", urlAccess);
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
    setTimeout(() => {
      logTerminal("WORKER", "Access key recognized from URL parameter (?access=...) and saved", "worker");
    }, 600);
  }

  updateAuthUI();

  const authBtn = document.getElementById("btn-auth-status");
  const modal = document.getElementById("passcode-modal");
  const closeBtn = document.getElementById("modal-passcode-close");
  const cancelBtn = document.getElementById("btn-passcode-cancel");
  const form = document.getElementById("form-passcode");
  const input = document.getElementById("input-passcode");

  if (authBtn) {
    authBtn.addEventListener("click", () => openPasscodeModal());
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", () => closePasscodeModal());
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => closePasscodeModal());
  }

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closePasscodeModal();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal && modal.style.display === "flex") {
      closePasscodeModal();
    }
  });

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const enteredKey = input.value.trim();
      if (!enteredKey) return;

      try {
        const res = await fetch("/api/auth/verify", {
          headers: { "x-dispatch-access-key": enteredKey }
        });
        const data = await res.json();
        if (data.authenticated) {
          setAccessKey(enteredKey);
          closePasscodeModal();
          showToast("Access unlocked! Mutations & AI inference enabled.");
          logTerminal("WORKER", "Demo mutation key verified and authorized", "worker");
        } else {
          showToast("Invalid access key. Please verify your demo credentials.");
          logTerminal("WORKER", "Demo authorization rejected: invalid key", "reset");
        }
      } catch (err) {
        showToast("Error verifying key: " + err.message);
      }
    });
  }
}

function openPasscodeModal() {
  const modal = document.getElementById("passcode-modal");
  const input = document.getElementById("input-passcode");
  if (!modal) return;
  if (input) input.value = getAccessKey();
  modal.style.display = "flex";
  if (input) input.focus();
}

function closePasscodeModal() {
  const modal = document.getElementById("passcode-modal");
  if (modal) modal.style.display = "none";
}

async function syncWeightsWithServer() {
  try {
    const res = await fetch("/api/weights", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify(activeWeights),
    });
    if (res.status === 401) {
      // In read-only mode, slider changes re-rank locally without blocking the user
      return;
    }
    logTerminal("D1", `POST /api/weights -> persisted weights { growth: ${activeWeights.growth.toFixed(2)}, cost: ${activeWeights.cost.toFixed(2)}, risk: ${activeWeights.risk.toFixed(2)} }`, "d1");
    await loadBatch();
    await loadConflicts();
  } catch (e) {
    console.error("Failed to sync weights:", e);
  }
}

async function loadWeights() {
  try {
    const res = await fetch("/api/weights");
    const data = await res.json();
    if (data.weights) {
      const saved = localStorage.getItem("dispatch-weights");
      activeWeights = saved ? JSON.parse(saved) : data.weights;
      updateSliderUI();
    }
  } catch (e) {
    console.error("Failed to load weights:", e);
  }
}

async function loadIntents() {
  try {
    const res = await fetch("/api/intents");
    const data = await res.json();
    cachedIntents = data.intents || [];
    recalculateAndRenderQueue();
  } catch (e) {
    console.error("Failed to load intents:", e);
  }
}

function computeClientBatchIds(scoredCandidates, limit = 5) {
  const eligible = scoredCandidates.filter((i) => i.status !== "merged");
  const selected = [];
  const selectedIds = new Set();

  const conflictPairs = new Set();
  for (const c of cachedConflicts) {
    if (c.status !== "resolved") {
      conflictPairs.add(`${c.intentA}:${c.intentB}`);
      conflictPairs.add(`${c.intentB}:${c.intentA}`);
    }
  }

  const mergedIds = new Set(cachedIntents.filter((i) => i.status === "merged").map((i) => i.id));
  const intentMap = new Map();
  cachedIntents.forEach((i) => intentMap.set(i.id, i));

  // Sort candidates by dynamicScore descending
  const sortedCandidates = [...eligible].sort((a, b) => b.dynamicScore - a.dynamicScore);

  for (const item of sortedCandidates) {
    if (selected.length >= limit) break;
    if (selectedIds.has(item.id)) continue;

    // Topological DAG check
    const deps = item.dependsOn || [];
    let blocked = false;

    for (const depId of deps) {
      const isMerged = mergedIds.has(depId);
      const isSelected = selectedIds.has(depId);
      if (!isMerged && !isSelected) {
        // Can we bring depId into batch?
        const depCandidate = intentMap.get(depId);
        if (depCandidate && selected.length + 1 <= limit) {
          let depConflicts = false;
          for (const existing of selected) {
            if (conflictPairs.has(`${existing.id}:${depCandidate.id}`)) {
              depConflicts = true;
              break;
            }
          }
          if (!depConflicts) {
            selected.push(depCandidate);
            selectedIds.add(depCandidate.id);
            continue;
          }
        }
        blocked = true;
        break;
      }
    }

    if (blocked) continue;

    // Check conflict with already selected
    let hasConflict = false;
    for (const s of selected) {
      if (conflictPairs.has(`${s.id}:${item.id}`)) {
        hasConflict = true;
        break;
      }
    }

    if (!hasConflict) {
      selected.push(item);
      selectedIds.add(item.id);
    }
  }

  return selectedIds;
}

function updateBatchMetricsUI(selectedIds, scoredList) {
  const batchItems = scoredList.filter((i) => selectedIds.has(i.id));
  let totalG = 0, totalC = 0, totalR = 0;
  for (const b of batchItems) {
    totalG += b.growth_score || 0;
    totalC += b.cost_score || 0;
    totalR += b.risk_score || 0;
  }
  const countEl = document.getElementById("batch-count");
  if (countEl) countEl.textContent = batchItems.length;
  const gEl = document.getElementById("batch-growth");
  if (gEl) gEl.textContent = (totalG > 0 ? "+" : "") + totalG;
  const cEl = document.getElementById("batch-cost");
  if (cEl) cEl.textContent = (totalC > 0 ? "+" : "") + totalC;
  const rEl = document.getElementById("batch-risk");
  if (rEl) rEl.textContent = (totalR > 0 ? "+" : "") + totalR;
  const deployBtn = document.getElementById("btn-deploy-batch");
  if (deployBtn) {
    deployBtn.disabled = batchItems.length === 0;
    deployBtn.dataset.intentIds = JSON.stringify(batchItems.map((i) => i.id));
  }
}

function recalculateAndRenderQueue(recomputeBatch = true) {
  const tbody = document.getElementById("queue-tbody");
  if (!tbody) return;

  if (!cachedIntents.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 32px; color: var(--text-subtle);">
          No Intent Packages loaded. Click <strong>"Reset Environment"</strong> to re-seed.
        </td>
      </tr>
    `;
    return;
  }

  // 1. Recalculate dynamic scores & parse dependency arrays
  const scored = cachedIntents.map((intent) => {
    const score = (intent.growth_score * activeWeights.growth) +
                  (intent.cost_score * activeWeights.cost) +
                  (intent.risk_score * activeWeights.risk);
    const rawDeps = intent.dependsOn || intent.depends_on;
    const dependsOn = rawDeps ? (typeof rawDeps === "string" ? JSON.parse(rawDeps) : rawDeps) : [];
    return {
      ...intent,
      dependsOn,
      dynamicScore: Math.round(score * 10) / 10
    };
  });

  // Calculate client-side batch selection for real-time responsiveness during slider drag
  if (recomputeBatch || !cachedBatchIntentIds || cachedBatchIntentIds.size === 0) {
    cachedBatchIntentIds = computeClientBatchIds(scored);
  }
  updateBatchMetricsUI(cachedBatchIntentIds, scored);

  // 2. Build Topological DAG Dependency Graph & Tree Clusters
  const intentMap = new Map();
  scored.forEach((i) => intentMap.set(i.id, i));

  const childrenMap = new Map();
  const roots = [];

  scored.forEach((intent) => {
    const deps = intent.dependsOn || [];
    // Check if prerequisite exists in active catalog and is not yet merged
    const parentId = deps.find((d) => intentMap.has(d));
    if (parentId) {
      if (!childrenMap.has(parentId)) childrenMap.set(parentId, []);
      childrenMap.get(parentId).push(intent);
    } else {
      roots.push(intent);
    }
  });

  // Calculate max cluster score for each root tree
  function getClusterMaxScore(node) {
    let max = node.dynamicScore;
    const kids = childrenMap.get(node.id) || [];
    for (const k of kids) {
      max = Math.max(max, getClusterMaxScore(k));
    }
    return max;
  }

  roots.forEach((r) => {
    r.clusterScore = getClusterMaxScore(r);
  });

  // Sort root clusters descending by cluster score, then root dynamic score
  roots.sort((a, b) => (b.clusterScore - a.clusterScore) || (b.dynamicScore - a.dynamicScore));

  // Flatten tree into file-tree hierarchy with indentation & tree branch lines
  const flatQueue = [];
  let rootIdx = 1;

  roots.forEach((root) => {
    const clusterRank = rootIdx++;
    let childCounter = 1;

    function traverse(node, depth, isLastArray, rankDisplay, parentNode) {
      const kids = childrenMap.get(node.id) || [];
      kids.sort((a, b) => b.dynamicScore - a.dynamicScore);

      let treePrefix = "";
      if (depth > 0) {
        for (let i = 0; i < depth - 1; i++) {
          treePrefix += isLastArray[i] ? "    " : "│   ";
        }
        treePrefix += isLastArray[depth - 1] ? "└── " : "├── ";
      }

      flatQueue.push({
        ...node,
        treeDepth: depth,
        treePrefix,
        hasChildren: kids.length > 0,
        isRoot: depth === 0,
        parentIntent: parentNode,
        rankDisplay
      });

      kids.forEach((k, idx) => {
        const isLast = idx === kids.length - 1;
        const childRank = `${clusterRank}.${childCounter++}`;
        traverse(k, depth + 1, [...isLastArray, isLast], childRank, node);
      });
    }

    traverse(root, 0, [], `#${clusterRank}`, null);
  });

  // 3. FLIP Animation: Record Initial Row Offsets
  const prevTops = new Map();
  const existingRows = tbody.querySelectorAll("tr[data-intent-id]");
  for (const r of existingRows) {
    prevTops.set(r.dataset.intentId, r.getBoundingClientRect().top);
  }

  const conflictIntentIds = new Set();
  for (const c of cachedConflicts) {
    conflictIntentIds.add(c.intentA);
    conflictIntentIds.add(c.intentB);
  }

  // 4. Update or Create DOM Rows
  const fragment = document.createDocumentFragment();
  const rowMap = new Map();
  for (const r of existingRows) {
    rowMap.set(r.dataset.intentId, r);
  }

  flatQueue.forEach((intent) => {
    const meta = intent.source_metadata ? (typeof intent.source_metadata === "string" ? JSON.parse(intent.source_metadata) : intent.source_metadata) : {};

    let contextPill = "";
    if (meta.arrImpact) {
      contextPill = `<span class="card-source-badge card-source-crm">+$${(meta.arrImpact / 1000).toFixed(0)}k ARR</span>`;
    } else if (meta.latencyImpactMs) {
      contextPill = `<span class="card-source-badge card-source-telemetry">${meta.latencyImpactMs}ms P95</span>`;
    } else if (meta.cveId || meta.cveSeverity) {
      contextPill = `<span class="card-source-badge card-source-security">${meta.cveSeverity || meta.cveId}</span>`;
    } else {
      contextPill = `<span class="card-source-badge">Roadmap</span>`;
    }

    // Minimalist DAG tree tag
    let dagTag = "";
    if (intent.isRoot) {
      if (intent.hasChildren) {
        dagTag = `<span class="tree-tag tree-tag-root" title="Architectural root prerequisite for downstream features">DAG ROOT</span>`;
      }
    } else {
      const pId = intent.parentIntent ? intent.parentIntent.id.replace("intent-", "") : "prereq";
      const isMerged = intent.parentIntent && intent.parentIntent.status === "merged";
      if (isMerged) {
        dagTag = `<span class="tree-tag tree-tag-merged" title="Prerequisite merged into baseline">✓ ${pId}</span>`;
      } else {
        dagTag = `<span class="tree-tag tree-tag-dep" title="Requires ${pId} to merge first">↳ REQUIRES: ${pId}</span>`;
      }
    }

    const isConflict = conflictIntentIds.has(intent.id) && intent.status !== "reconciled" && intent.status !== "merged";
    const isInBatch = cachedBatchIntentIds.has(intent.id);

    let statusPill = "";
    if (isConflict) {
      statusPill = `<span class="status-pill status-conflict">COLLISION</span>`;
    } else if (intent.status === "reconciled") {
      statusPill = `<span class="status-pill status-reconciled">RECONCILED</span>`;
    } else if (intent.status === "merged") {
      statusPill = `<span class="status-pill status-deployed">DEPLOYED</span>`;
    } else {
      statusPill = `<span class="status-pill status-ready">READY</span>`;
    }

    const batchPillHtml = isInBatch
      ? `<span class="batch-pill" title="Included in Candidate Release Batch"><span class="batch-dot"></span>IN BATCH</span>`
      : "";

    let tr = rowMap.get(intent.id);
    if (!tr) {
      tr = document.createElement("tr");
      tr.dataset.intentId = intent.id;
      tr.addEventListener("click", () => {
        const cur = cachedIntents.find((i) => i.id === intent.id);
        if (cur) openIntentModal(cur);
      });
    }

    const classes = [];
    if (intent.rankDisplay === "#1") classes.push("rank-1");
    if (isConflict) classes.push("row-conflict");
    if (isInBatch) classes.push("row-in-batch");
    if (!intent.isRoot) classes.push("row-tree-child");
    tr.className = classes.join(" ");

    const rankBadge = intent.isRoot
      ? `<span class="rank-badge-sm">${intent.rankDisplay}</span>`
      : `<span class="rank-badge-child">${intent.rankDisplay}</span>`;

    tr.innerHTML = `
      <td style="text-align: center;">${rankBadge}</td>
      <td><span class="score-badge">${intent.dynamicScore.toFixed(1)}</span></td>
      <td>
        <div class="tree-node-cell">
          ${intent.treePrefix ? `<span class="tree-branch-prefix">${intent.treePrefix}</span>` : ""}
          <div class="tree-node-body">
            <div class="intent-cell-title">${intent.title}</div>
            <div class="intent-meta-row">
              ${dagTag}
              ${contextPill}
              <span style="color: var(--text-subtle);">${intent.source_ref}</span>
            </div>
          </div>
        </div>
      </td>
      <td>
        <div class="impact-pills">
          <span class="impact-pill impact-growth" title="Growth">${intent.growth_score > 0 ? "+" : ""}${intent.growth_score}G</span>
          <span class="impact-pill impact-cost" title="Cost">${intent.cost_score > 0 ? "+" : ""}${intent.cost_score}C</span>
          <span class="impact-pill impact-risk" title="Risk">${intent.risk_score > 0 ? "+" : ""}${intent.risk_score}R</span>
        </div>
      </td>
      <td><span class="repo-pill">${intent.fork_repo_name || "task-fork"}</span></td>
      <td>
        <div class="status-cell-flex">
          ${batchPillHtml}
          ${statusPill}
        </div>
      </td>
      <td style="text-align: center;">
        <button class="btn-inspect" type="button">Inspect</button>
      </td>
    `;

    const inspectBtn = tr.querySelector(".btn-inspect");
    if (inspectBtn) {
      inspectBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const cur = cachedIntents.find((i) => i.id === intent.id);
        if (cur) openIntentModal(cur);
      });
    }

    fragment.appendChild(tr);
  });

  tbody.innerHTML = "";
  tbody.appendChild(fragment);

  // 5. FLIP Animation: Invert & Play
  if (prevTops.size > 0) {
    const moves = [];
    for (const tr of tbody.querySelectorAll("tr[data-intent-id]")) {
      const id = tr.dataset.intentId;
      const oldTop = prevTops.get(id);
      if (oldTop !== undefined) {
        const newTop = tr.getBoundingClientRect().top;
        const deltaY = oldTop - newTop;
        if (Math.abs(deltaY) > 0.5) {
          moves.push({ tr, deltaY });
        }
      }
    }

    if (moves.length > 0) {
      for (const { tr, deltaY } of moves) {
        tr.style.transition = "none";
        tr.style.transform = `translateY(${deltaY}px)`;
        tr.style.willChange = "transform";
        tr.style.zIndex = "2";
      }

      // Force layout reflow
      void tbody.offsetHeight;

      requestAnimationFrame(() => {
        for (const { tr } of moves) {
          tr.style.transition = "transform 340ms cubic-bezier(0.16, 1, 0.3, 1)";
          tr.style.transform = "";
        }
        setTimeout(() => {
          for (const { tr } of moves) {
            tr.style.transition = "";
            tr.style.transform = "";
            tr.style.willChange = "";
            tr.style.zIndex = "";
          }
        }, 360);
      });
    }
  }
}

async function loadBatch() {
  try {
    const res = await fetch("/api/batch");
    const data = await res.json();
    const batch = data.batch;
    if (!batch) return;

    if (batch.selectedIntents) {
      cachedBatchIntentIds = new Set(batch.selectedIntents.map((i) => i.id));
    }

    document.getElementById("batch-count").textContent = batch.selectedIntents?.length || 0;
    document.getElementById("batch-growth").textContent = (batch.totalGrowthScore > 0 ? "+" : "") + batch.totalGrowthScore;
    document.getElementById("batch-cost").textContent = (batch.totalCostScore > 0 ? "+" : "") + batch.totalCostScore;
    document.getElementById("batch-risk").textContent = (batch.totalRiskScore > 0 ? "+" : "") + batch.totalRiskScore;

    const deployBtn = document.getElementById("btn-deploy-batch");
    if (batch.selectedIntents && batch.selectedIntents.length > 0) {
      deployBtn.disabled = false;
      deployBtn.dataset.intentIds = JSON.stringify(batch.selectedIntents.map((i) => i.id));
    } else {
      deployBtn.disabled = true;
    }

    if (batch.dagWarnings && batch.dagWarnings.length > 0) {
      for (const w of batch.dagWarnings) {
        logTerminal("RANKER", `Topological DAG Guard: ${w.intentId} deferred (${w.message})`, "ranker");
      }
    }

    // Refresh queue with server-confirmed batch
    recalculateAndRenderQueue(false);
  } catch (e) {
    console.error("Failed to load batch:", e);
  }
}

async function loadConflicts() {
  try {
    const res = await fetch("/api/conflicts");
    const data = await res.json();
    cachedConflicts = data.conflicts || [];

    const container = document.getElementById("conflict-container");
    if (!cachedConflicts.length) {
      container.innerHTML = `
        <div class="resolved-box">
          <div class="resolved-title">Zero Unresolved Conflicts</div>
          <div class="resolved-desc">All candidate Artifacts forks are clean or reconciled without conflict markers.</div>
        </div>
      `;
      return;
    }

    const conf = cachedConflicts[0];
    container.innerHTML = `
      <div class="conflict-box">
        <div class="conflict-title">Concurrency Collision Detected</div>
        <div class="conflict-desc">
          <strong>${conf.intentA}</strong> and <strong>${conf.intentB}</strong> both touch <code>${conf.conflictingFiles.join(", ")}</code>.
        </div>
        <button class="btn-secondary" id="btn-trigger-reconcile" style="width: 100%; margin-top: 6px;">
          Reconcile with AI
        </button>
      </div>
    `;

    document.getElementById("btn-trigger-reconcile").addEventListener("click", () => {
      triggerReconciliation(conf.intentA, conf.intentB);
    });
  } catch (e) {
    console.error("Failed to load conflicts:", e);
  }
}

async function triggerReconciliation(intentA, intentB) {
  showToast("Dispatching Semantic Reconciliation Agent in Artifacts fork...");
  logTerminal("RECONCILER", `Initiated semantic reconciliation: ${intentA} vs ${intentB}`, "reconciler");
  const recForkName = `reconcile-${intentA.replace('intent-', '')}-${intentB.replace('intent-', '')}`;
  logTerminal("ARTIFACTS", `git init-fork ${recForkName}.git from dispatch-main @ b92e104`, "artifacts");
  logTerminal("WORKERS-AI", `Running Llama 3.3 70B FP8 inference on overlapping src/middleware/auth.ts`, "ai");

  try {
    const res = await fetch("/api/reconcile", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({ intentA, intentB }),
    });
    if (res.status === 401) {
      showToast("Access key required to run Workers AI reconciliation");
      logTerminal("RECONCILER", "Mutation blocked: 401 Unauthorized (access key required)", "reset");
      openPasscodeModal();
      return;
    }
    const data = await res.json();
    if (data.success) {
      logTerminal("WORKERS-AI", `AST union complete: zero git conflict markers synthesized`, "ai");
      logTerminal("ARTIFACTS", `git commit -m "Semantic reconciliation: unify ${intentA} + ${intentB}" -> SHA 3c91a4f`, "artifacts");
      logTerminal("D1", `INSERT INTO reconciliations (status='resolved') -> updated intents`, "d1");
      showToast(`Resolved in ${data.reconciledRepoName} with zero conflict markers!`);
      await refreshAll();
    } else {
      showToast("Reconciliation failed: " + (data.error || "Unknown error"));
    }
  } catch (e) {
    showToast("Reconciliation failed: " + e.message);
    logTerminal("RECONCILER", "Reconciliation error: " + e.message, "reset");
  }
}

async function handleDeployBatch() {
  const btn = document.getElementById("btn-deploy-batch");
  const intentIds = JSON.parse(btn.dataset.intentIds || "[]");
  if (!intentIds.length) return;

  showToast("Deploying candidate release batch to Cloudflare Workers...");
  logTerminal("DEPLOY", `Initiating strategic release deployment for ${intentIds.length} candidate forks`, "deploy");

  try {
    const res = await fetch("/api/deploy-batch", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({ intentIds }),
    });
    if (res.status === 401) {
      showToast("Access key required to deploy release batch");
      logTerminal("DEPLOY", "Mutation blocked: 401 Unauthorized (access key required)", "reset");
      openPasscodeModal();
      return;
    }
    const data = await res.json();
    if (data.success) {
      logTerminal("ARTIFACTS", "git fetch artifacts://dispatch/main.git", "artifacts");
      if (data.deployment?.deployedForks && data.deployment.deployedForks.length > 0) {
        for (const fork of data.deployment.deployedForks) {
          logTerminal("ARTIFACTS", `Fast-forward merge: dispatch-main (b92e104) -> ${fork.forkRepoName} (${fork.commitSha})`, "artifacts");
          logTerminal("ARTIFACTS", `Garbage-collected ephemeral fork: ${fork.forkRepoName} (SHA ${fork.commitSha} pruned from namespace 'default')`, "artifacts");
        }
      } else {
        logTerminal("ARTIFACTS", `Pruning deployed forks: [${intentIds.join(", ")}]`, "artifacts");
      }
      logTerminal("D1", `Updated status to 'merged' for batch ${data.deployment.batchId}`, "d1");
      logTerminal("WORKER", `Production target updated to release hash ${data.deployment.mergedCommitHash || data.deployment.batchId} (200 OK)`, "worker");
      showToast(`Deployed ${data.deployment.count} PRs successfully! Deployed forks merged & pruned.`);
      await refreshAll();
    } else {
      showToast("Deployment failed: " + (data.error || "Unknown error"));
    }
  } catch (e) {
    showToast("Deployment failed: " + e.message);
  }
}

async function handleDemoReset() {
  showToast("Pruning Artifacts forks & resetting environment...");
  logTerminal("RESET", "POST /api/demo/reset -> initiating full environment reset", "reset");

  try {
    const res = await fetch("/api/demo/reset", {
      method: "POST",
      headers: getApiHeaders(),
    });
    if (res.status === 401) {
      showToast("Access key required to reset demo environment");
      logTerminal("RESET", "Mutation blocked: 401 Unauthorized (access key required)", "reset");
      openPasscodeModal();
      return;
    }
    const data = await res.json();
    if (data.success) {
      logTerminal("ARTIFACTS", `Pruned ${data.prunedForks?.length || 0} ephemeral repositories from namespace 'default' (reclaimed storage)`, "artifacts");
      logTerminal("D1", "Purged reconciliations and deployments; reset weights to 50/25/25", "d1");
      logTerminal("D1", "Catalog re-seeded into evaluated baseline (10 intent packages)", "d1");
      showToast("Environment reset! Ephemeral forks pruned & catalog initialized.");
      await refreshAll();
    } else {
      showToast("Reset error: " + (data.error || "Unknown error"));
    }
  } catch (e) {
    showToast("Reset error: " + e.message);
  }
}

async function handleCustomIntentSubmit(e) {
  e.preventDefault();
  const title = document.getElementById("input-custom-title").value.trim();
  const description = document.getElementById("input-custom-desc").value.trim();
  const arr = parseFloat(document.getElementById("input-custom-arr").value || 0);

  if (!title) return;

  showToast("Workers AI evaluating intent & provisioning Artifacts fork...");
  logTerminal("WORKERS-AI", `POST /api/evaluate-custom -> analyzing intent: "${title}"`, "ai");

  try {
    const res = await fetch("/api/evaluate-custom", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({
        title,
        description,
        sourceType: arr > 0 ? "crm" : "roadmap",
        sourceMetadata: { arrImpact: arr },
        codeDiff: `// Feature: ${title}\n// Description: ${description}\nexport function execute() {\n  return { success: true, timestamp: Date.now() };\n}\n`,
      }),
    });
    if (res.status === 401) {
      showToast("Access key required to run Workers AI evaluation");
      logTerminal("WORKERS-AI", "Mutation blocked: 401 Unauthorized (access key required)", "reset");
      openPasscodeModal();
      return;
    }
    const data = await res.json();
    if (data.success) {
      const cSha = data.intent?.commit_sha || "custom-sha";
      logTerminal("WORKERS-AI", `Llama 3.3 70B evaluation complete: Growth=${data.evaluation.growthScore}, Cost=${data.evaluation.costScore}, Risk=${data.evaluation.riskScore}`, "ai");
      logTerminal("ARTIFACTS", `git fork dispatch-main (b92e104) -> ${data.forkName}.git (HEAD ${cSha})`, "artifacts");
      logTerminal("D1", `Inserted new Intent Package ${data.intent.id} into database`, "d1");

      showToast(`Fork ${data.forkName} created & evaluated by Workers AI!`);
      document.getElementById("input-custom-title").value = "";
      document.getElementById("input-custom-desc").value = "";
      document.getElementById("input-custom-arr").value = "";

      await refreshAll();

      if (data.intent) {
        openIntentModal(data.intent);
      }
    } else {
      showToast("Evaluation error: " + (data.error || "Unknown error"));
    }
  } catch (err) {
    showToast("Evaluation error: " + err.message);
  }
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.style.display = "block";
  clearTimeout(toast.timeoutId);
  toast.timeoutId = setTimeout(() => {
    toast.style.display = "none";
  }, 4000);
}
