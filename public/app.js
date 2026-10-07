// Dispatch Executive Command Center Application Logic

let activeWeights = { growth: 0.5, cost: 0.25, risk: 0.25 };
let cachedIntents = [];
let updateTimeout = null;

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initApp();
});

function initTheme() {
  const saved = localStorage.getItem("dispatch-theme") || "system";
  setTheme(saved, false);

  // Setup theme button clicks
  document.querySelectorAll(".theme-switch-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const theme = btn.dataset.theme;
      setTheme(theme, true);
    });
  });

  // Watch system color scheme changes
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

  // Update button active state
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
    // System default
    document.documentElement.removeAttribute("data-mode");
    document.documentElement.style.colorScheme = "light dark";
  }
}

async function initApp() {
  setupEventListeners();
  await refreshAll();
}

async function refreshAll() {
  await loadWeights();
  await loadIntents();
  await loadBatch();
  await loadConflicts();
}

function setupEventListeners() {
  // Slider listeners
  const growthSlider = document.getElementById("slider-growth");
  const costSlider = document.getElementById("slider-cost");
  const riskSlider = document.getElementById("slider-risk");

  growthSlider.addEventListener("input", (e) => onSliderChange("growth", parseFloat(e.target.value)));
  costSlider.addEventListener("input", (e) => onSliderChange("cost", parseFloat(e.target.value)));
  riskSlider.addEventListener("input", (e) => onSliderChange("risk", parseFloat(e.target.value)));

  // Preset buttons
  document.getElementById("btn-preset-balanced").addEventListener("click", () => applyPreset(0.5, 0.25, 0.25, "btn-preset-balanced"));
  document.getElementById("btn-preset-growth").addEventListener("click", () => applyPreset(0.8, 0.1, 0.1, "btn-preset-growth"));
  document.getElementById("btn-preset-cost").addEventListener("click", () => applyPreset(0.1, 0.8, 0.1, "btn-preset-cost"));
  document.getElementById("btn-preset-risk").addEventListener("click", () => applyPreset(0.1, 0.1, 0.8, "btn-preset-risk"));

  // Demo Controls
  document.getElementById("btn-demo-reset").addEventListener("click", handleDemoReset);
  document.getElementById("btn-demo-fastforward").addEventListener("click", handleFastForward);

  // Deploy Batch button
  document.getElementById("btn-deploy-batch").addEventListener("click", handleDeployBatch);

  // Custom evaluation submit
  document.getElementById("form-custom-intent").addEventListener("submit", handleCustomIntentSubmit);
}

function onSliderChange(changedType, newValue) {
  // Normalize remaining weights to total 1.0 (100%)
  const types = ["growth", "cost", "risk"];
  const others = types.filter(t => t !== changedType);
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

  // Debounced API sync
  clearTimeout(updateTimeout);
  updateTimeout = setTimeout(() => {
    syncWeightsWithServer();
  }, 350);
}

function applyPreset(g, c, r, btnId) {
  activeWeights = { growth: g, cost: c, risk: r };
  
  document.querySelectorAll(".preset-btn").forEach(b => b.classList.remove("active"));
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
    loadBatch();
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
  if (!cachedIntents.length) {
    document.getElementById("queue-container").innerHTML = `
      <div style="text-align: center; padding: 40px; color: var(--text-muted);">
        No intent packages loaded. Click <strong>"Seed / Fast-Forward"</strong> in Demo Controls.
      </div>
    `;
    return;
  }

  // Recalculate dynamic score client-side for ultra-responsive slider dragging
  const ranked = cachedIntents.map(intent => {
    const score = (intent.growth_score * activeWeights.growth) +
                  (intent.cost_score * activeWeights.cost) +
                  (intent.risk_score * activeWeights.risk);
    return { ...intent, dynamicScore: Math.round(score * 10) / 10 };
  });

  // Sort descending by dynamic score
  ranked.sort((a, b) => b.dynamicScore - a.dynamicScore);

  const container = document.getElementById("queue-container");
  container.innerHTML = "";

  ranked.forEach((intent, idx) => {
    const rank = idx + 1;
    const meta = intent.source_metadata ? JSON.parse(intent.source_metadata) : {};

    let sourcePill = "";
    if (meta.arrImpact) {
      sourcePill = `<span class="card-source-badge card-source-crm">💰 +$${(meta.arrImpact / 1000).toFixed(0)}k ARR</span>`;
    } else if (meta.latencyImpactMs) {
      sourcePill = `<span class="card-source-badge card-source-telemetry">⚡ ${meta.latencyImpactMs}ms P95</span>`;
    } else if (meta.cveId || meta.cveSeverity) {
      sourcePill = `<span class="card-source-badge card-source-security">🛡️ ${meta.cveSeverity || meta.cveId}</span>`;
    } else {
      sourcePill = `<span class="card-source-badge">📋 Roadmap</span>`;
    }

    const card = document.createElement("div");
    card.className = `queue-card ${rank === 1 ? "rank-1" : ""}`;
    card.innerHTML = `
      <div class="card-top">
        <div class="card-header-left">
          <div class="rank-badge">#${rank}</div>
          <div>
            <div class="card-title">${intent.title}</div>
            <div style="display: flex; gap: 8px; margin-top: 4px; align-items: center;">
              ${sourcePill}
              <span style="font-size: 0.72rem; color: var(--text-muted);">${intent.source_ref}</span>
              <span style="font-size: 0.72rem; font-family: monospace; color: #a78bfa;">📦 ${intent.fork_repo_name || 'task-fork'}</span>
            </div>
          </div>
        </div>
        <div class="card-score-box">
          <div class="card-composite-label">Priority Score</div>
          <div class="card-composite-val">${intent.dynamicScore.toFixed(1)}</div>
        </div>
      </div>
      <div class="card-summary">
        ${intent.executive_summary || intent.description}
      </div>
      <div class="card-footer">
        <div class="score-bars-row">
          <span class="score-tag score-tag-growth">Growth: <strong>${intent.growth_score > 0 ? '+' : ''}${intent.growth_score}</strong></span>
          <span class="score-tag score-tag-cost">Cost: <strong>${intent.cost_score > 0 ? '+' : ''}${intent.cost_score}</strong></span>
          <span class="score-tag score-tag-risk">Risk: <strong>${intent.risk_score > 0 ? '+' : ''}${intent.risk_score}</strong></span>
        </div>
        <div>
          <span style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: ${intent.status === 'reconciled' ? 'var(--accent-purple)' : intent.status === 'merged' ? 'var(--accent-green)' : 'var(--accent-orange)'};">
            ● ${intent.status}
          </span>
        </div>
      </div>
    `;
    container.appendChild(card);
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

    // Enable / disable deploy button
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
    const conflicts = data.conflicts || [];

    const container = document.getElementById("conflict-container");
    if (!conflicts.length) {
      container.innerHTML = `
        <div style="font-size: 0.8rem; color: var(--accent-green); margin-top: 8px;">
          ✓ Zero unresolved merge conflicts across top candidates.
        </div>
      `;
      return;
    }

    const conf = conflicts[0];
    container.innerHTML = `
      <div class="conflict-box">
        <div class="conflict-title">⚠️ Concurrency Collision Detected</div>
        <div class="conflict-desc">
          <strong>${conf.intentA}</strong> and <strong>${conf.intentB}</strong> both touch <code>${conf.conflictingFiles.join(', ')}</code>.
        </div>
        <button class="btn-secondary" id="btn-trigger-reconcile" style="width: 100%;">
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
      showToast(`🚀 Deployed ${data.deployment.count} PRs successfully! (Batch ${data.deployment.batchId})`);
      await refreshAll();
    }
  } catch (e) {
    showToast("Deployment failed: " + e.message);
  }
}

async function handleDemoReset() {
  showToast("Pruning Artifacts forks & resetting to baseline...");
  try {
    const res = await fetch("/api/demo/reset", { method: "POST" });
    const data = await res.json();
    if (data.success) {
      showToast(`✓ System reset! Pruned ${data.prunedForks?.length || 0} Artifacts forks.`);
      await refreshAll();
    }
  } catch (e) {
    showToast("Reset error: " + e.message);
  }
}

async function handleFastForward() {
  showToast("Dispatching swarm & fast-forwarding evaluations...");
  try {
    const res = await fetch("/api/swarm/fast-forward", { method: "POST" });
    const data = await res.json();
    if (data.success) {
      showToast(`✓ Swarm evaluated! ${data.count} forks ready for deployment.`);
      await refreshAll();
    }
  } catch (e) {
    showToast("Fast-forward error: " + e.message);
  }
}

async function handleCustomIntentSubmit(e) {
  e.preventDefault();
  const title = document.getElementById("input-custom-title").value;
  const description = document.getElementById("input-custom-desc").value;
  const arr = parseFloat(document.getElementById("input-custom-arr").value || 0);

  if (!title) return;

  showToast("Strategic Evaluator Agent analyzing with Workers AI...");
  try {
    const res = await fetch("/api/evaluate-custom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        sourceType: arr > 0 ? "crm" : "roadmap",
        sourceMetadata: { arrImpact: arr },
        codeDiff: "// Generated feature diff"
      }),
    });
    const data = await res.json();
    if (data.success) {
      const ev = data.evaluation;
      alert(`Workers AI Evaluation Result:\n\n• Growth Score: ${ev.growthScore}\n• Cost Score: ${ev.costScore}\n• Risk Score: ${ev.riskScore}\n\nSummary: ${ev.executiveSummary}`);
      document.getElementById("input-custom-title").value = "";
      document.getElementById("input-custom-desc").value = "";
      document.getElementById("input-custom-arr").value = "";
    }
  } catch (err) {
    showToast("Evaluation error: " + err.message);
  }
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.style.display = "block";
  clearTimeout(toast.timeoutId);
  toast.timeoutId = setTimeout(() => {
    toast.style.display = "none";
  }, 4000);
}
