-- Dispatch Database Schema (Cloudflare D1)

CREATE TABLE IF NOT EXISTS strategic_weights (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  growth_weight REAL NOT NULL DEFAULT 0.50,
  cost_weight REAL NOT NULL DEFAULT 0.25,
  risk_weight REAL NOT NULL DEFAULT 0.25,
  updated_at TEXT NOT NULL
);

-- Initialize default weights (50% Growth, 25% Cost Efficiency, 25% Risk Reduction)
INSERT OR IGNORE INTO strategic_weights (id, growth_weight, cost_weight, risk_weight, updated_at)
VALUES (1, 0.50, 0.25, 0.25, CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS intents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  source_type TEXT NOT NULL, -- 'crm', 'telemetry', 'security', 'roadmap'
  source_ref TEXT NOT NULL,  -- e.g. 'Salesforce Opp #8492', 'Sentry Alert #204'
  source_metadata TEXT,      -- JSON string with business metrics (arrImpact, customer, etc.)
  fork_repo_name TEXT,       -- Artifacts repository fork name (e.g. 'task-sso-01')
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'forked', 'evaluated', 'reconciled', 'merged'
  growth_score REAL DEFAULT 0,
  cost_score REAL DEFAULT 0,
  risk_score REAL DEFAULT 0,
  composite_score REAL DEFAULT 0,
  executive_summary TEXT,
  preview_url TEXT,
  diff_summary TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reconciliations (
  id TEXT PRIMARY KEY,
  primary_intent_id TEXT NOT NULL,
  secondary_intent_id TEXT NOT NULL,
  reconciled_repo_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'resolved', -- 'in_progress', 'resolved', 'failed'
  conflict_files TEXT, -- JSON array of file paths
  resolution_summary TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS deployments (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL,
  intent_ids TEXT NOT NULL, -- JSON array of intent IDs
  merged_commit_hash TEXT,
  status TEXT NOT NULL DEFAULT 'deployed',
  deployed_at TEXT NOT NULL
);
