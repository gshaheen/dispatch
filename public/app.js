// Dispatch Executive Command Center Application Logic

let activeWeights = { growth: 0.5, cost: 0.25, risk: 0.25 };
let cachedIntents = [];
let cachedConflicts = [];
let updateTimeout = null;

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initModal();
  initApp();
});

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

  const meta = intent.source_metadata ? (typeof intent.source_metadata === "string" ? JSON.parse(intent.source_metadata) : intent.source_metadata) : {};

  document.getElementById("modal-title").textContent = intent.title;
  document.getElementById("modal-subtitle").textContent = `ID: ${intent.id} • Fork: ${intent.fork_repo_name || "task-fork"}`;
  
  const statusEl = document.getElementById("modal-status");
  statusEl.textContent = intent.status;
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

  // Repo Info
  document.getElementById("modal-repo-name").textContent = intent.fork_repo_name || "task-fork";
  document.getElementById("modal-repo-remote").textContent = `https://artifacts.cloudflare.com/repos/${intent.fork_repo_name || "task-fork"}.git`;

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

async function initApp() {
  setupEventListeners();
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

  updateSliderUI();
  recalculateAndRenderQueue();

  clearTimeout(updateTimeout);
  updateTimeout = setTimeout(() => {
    syncWeightsWithServer();
  }, 350);
}

function applyPreset(g, c, r, btnId) {
  activeWeights = { growth: g, cost: c, risk: r };

  document.querySelectorAll(".preset-btn").forEach((b) => b.classList.remove("active"));
  const btn = document.getElementById(btnId);
  if (btn) btn.classList.add("active");

  updateSliderUI();
  recalculateAndRenderQueue();
  syncWeightsWithServer();
}

function updateSliderUI() {
  document.getElementById("slider-growth").value = activeWeights.growth;
  document.getElementById("slider-cost").value = activeWeights.cost;
  document.getElementById("slider-risk").value = activeWeights.risk;

  document.getElementById("val-growth").textContent = Math.round(activeWeights.growth * 100) + "%";
  document.getElementById("val-cost").textContent = Math.round(activeWeights.cost * 100) + "%";
  document.getElementById("val-risk").textContent = Math.round(activeWeights.risk * 100) + "%";
}

async function syncWeightsWithServer() {
  try {
    await fetch("/api/weights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(activeWeights),
    });
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
      activeWeights = data.weights;
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

function recalculateAndRenderQueue() {
  const tbody = document.getElementById("queue-tbody");
  if (!tbody) return;

  if (!cachedIntents.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 36px; color: var(--text-subtle);">
          No intent packages available. Click <strong>"Reset Demo"</strong> to initialize the catalog.
        </td>
      </tr>
    `;
    return;
  }

  // Recalculate dynamic scores client-side
  const ranked = cachedIntents.map((intent) => {
    const score = (intent.growth_score * activeWeights.growth) +
                  (intent.cost_score * activeWeights.cost) +
                  (intent.risk_score * activeWeights.risk);
    return { ...intent, dynamicScore: Math.round(score * 10) / 10 };
  });

  ranked.sort((a, b) => b.dynamicScore - a.dynamicScore);

  tbody.innerHTML = "";

  // Check which intent IDs are currently in active conflicts
  const conflictIntentIds = new Set();
  const conflictDetails = {};
  for (const c of cachedConflicts) {
    conflictIntentIds.add(c.intentA);
    conflictIntentIds.add(c.intentB);
    conflictDetails[c.intentA] = c.conflictingFiles?.join(", ") || "overlap";
    conflictDetails[c.intentB] = c.conflictingFiles?.join(", ") || "overlap";
  }

  ranked.forEach((intent, idx) => {
    const rank = idx + 1;
    const meta = intent.source_metadata ? (typeof intent.source_metadata === "string" ? JSON.parse(intent.source_metadata) : intent.source_metadata) : {};

    let contextPill = "";
    if (meta.arrImpact) {
      contextPill = `<span class="card-source-badge card-source-crm">💰 +$${(meta.arrImpact / 1000).toFixed(0)}k ARR</span>`;
    } else if (meta.latencyImpactMs) {
      contextPill = `<span class="card-source-badge card-source-telemetry">⚡ ${meta.latencyImpactMs}ms P95</span>`;
    } else if (meta.cveId || meta.cveSeverity) {
      contextPill = `<span class="card-source-badge card-source-security">🛡️ ${meta.cveSeverity || meta.cveId}</span>`;
    } else {
      contextPill = `<span class="card-source-badge">📋 Roadmap</span>`;
    }

    const isConflict = conflictIntentIds.has(intent.id) && intent.status !== "reconciled" && intent.status !== "merged";

    let statusPill = "";
    if (isConflict) {
      statusPill = `<span class="status-pill status-conflict">⚠️ Collision</span>`;
    } else if (intent.status === "reconciled") {
      statusPill = `<span class="status-pill status-reconciled">✨ Reconciled</span>`;
    } else if (intent.status === "merged") {
      statusPill = `<span class="status-pill status-deployed">✓ Deployed</span>`;
    } else {
      statusPill = `<span class="status-pill status-ready">● Ready</span>`;
    }

    const tr = document.createElement("tr");
    tr.className = (rank === 1 ? "rank-1" : "") + (isConflict ? " row-conflict" : "");
    tr.title = "Click to inspect intent package details";

    tr.innerHTML = `
      <td style="text-align: center;"><span class="rank-badge-sm">#${rank}</span></td>
      <td><span class="score-badge">${intent.dynamicScore.toFixed(1)}</span></td>
      <td>
        <div class="intent-cell-title">${intent.title}</div>
        <div class="intent-meta-row">
          ${contextPill}
          <span style="color: var(--text-subtle);">${intent.source_ref}</span>
        </div>
      </td>
      <td>
        <div class="impact-pills">
          <span class="impact-pill impact-growth" title="Growth Score">${intent.growth_score > 0 ? "+" : ""}${intent.growth_score}G</span>
          <span class="impact-pill impact-cost" title="Cost Score">${intent.cost_score > 0 ? "+" : ""}${intent.cost_score}C</span>
          <span class="impact-pill impact-risk" title="Risk Score">${intent.risk_score > 0 ? "+" : ""}${intent.risk_score}R</span>
        </div>
      </td>
      <td><span class="repo-pill">📦 ${intent.fork_repo_name || "task-fork"}</span></td>
      <td>${statusPill}</td>
      <td style="text-align: center;">
        <button class="btn-inspect" type="button">Inspect</button>
      </td>
    `;

    tr.addEventListener("click", () => openIntentModal(intent));
    tr.querySelector(".btn-inspect").addEventListener("click", (e) => {
      e.stopPropagation();
      openIntentModal(intent);
    });

    tbody.appendChild(tr);
  });
}

async function loadBatch() {
  try {
    const res = await fetch("/api/batch");
    const data = await res.json();
    const batch = data.batch;
    if (!batch) return;

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
          <div class="resolved-title">✓ Zero Unresolved Conflicts</div>
          <div class="resolved-desc">All top candidates are verified clean or reconciled with zero conflict markers.</div>
        </div>
      `;
      return;
    }

    const conf = cachedConflicts[0];
    container.innerHTML = `
      <div class="conflict-box">
        <div class="conflict-title">⚠️ Concurrency Collision Detected</div>
        <div class="conflict-desc">
          <strong>${conf.intentA}</strong> and <strong>${conf.intentB}</strong> both touch <code>${conf.conflictingFiles.join(", ")}</code>.
        </div>
        <button class="btn-secondary" id="btn-trigger-reconcile" style="width: 100%; margin-top: 6px;">
          🤖 Reconcile with Agent
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
  try {
    const res = await fetch("/api/reconcile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intentA, intentB }),
    });
    const data = await res.json();
    if (data.success) {
      showToast(`✓ Resolved in ${data.reconciledRepoName} with zero conflict markers!`);
      await refreshAll();
    }
  } catch (e) {
    showToast("Reconciliation failed: " + e.message);
  }
}

async function handleDeployBatch() {
  const btn = document.getElementById("btn-deploy-batch");
  const intentIds = JSON.parse(btn.dataset.intentIds || "[]");
  if (!intentIds.length) return;

  showToast("Deploying candidate batch to Cloudflare Workers...");
  try {
    const res = await fetch("/api/deploy-batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intentIds }),
    });
    const data = await res.json();
    if (data.success) {
      showToast(`🚀 Deployed ${data.deployment.count} PRs successfully! Ephemeral forks pruned.`);
      await refreshAll();
    }
  } catch (e) {
    showToast("Deployment failed: " + e.message);
  }
}

async function handleDemoReset() {
  showToast("Pruning Artifacts forks & resetting to evaluated baseline...");
  try {
    const res = await fetch("/api/demo/reset", { method: "POST" });
    const data = await res.json();
    if (data.success) {
      showToast(`✓ Demo reset! Ephemeral forks pruned & catalog initialized.`);
      await refreshAll();
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
  try {
    const res = await fetch("/api/evaluate-custom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        sourceType: arr > 0 ? "crm" : "roadmap",
        sourceMetadata: { arrImpact: arr },
        codeDiff: `// Feature: ${title}\n// Description: ${description}\nexport function execute() {\n  return { success: true, timestamp: Date.now() };\n}\n`,
      }),
    });
    const data = await res.json();
    if (data.success) {
      showToast(`✓ Fork ${data.forkName} created & evaluated by Workers AI!`);
      document.getElementById("input-custom-title").value = "";
      document.getElementById("input-custom-desc").value = "";
      document.getElementById("input-custom-arr").value = "";

      await refreshAll();

      if (data.intent) {
        openIntentModal(data.intent);
      }
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
