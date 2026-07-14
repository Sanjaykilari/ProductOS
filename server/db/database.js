import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "../database.sqlite");
const db = new sqlite3.Database(dbPath);

export const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

export const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export async function initDatabase() {
  // Existing AI integration tables
  await dbRun(`
    CREATE TABLE IF NOT EXISTS providers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      status TEXT DEFAULT 'Active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS models (
      id TEXT PRIMARY KEY,
      provider_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'chat',
      speed TEXT,
      cost_per_1k_prompt REAL,
      cost_per_1k_completion REAL,
      context_length INTEGER,
      quality_score REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(provider_id) REFERENCES providers(id)
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS provider_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider_id TEXT UNIQUE NOT NULL,
      encrypted_api_key TEXT,
      api_endpoint TEXT,
      timeout_ms INTEGER DEFAULT 10000,
      rate_limit_rpm INTEGER DEFAULT 60,
      FOREIGN KEY(provider_id) REFERENCES providers(id)
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS prompt_templates (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      system_prompt TEXT NOT NULL,
      default_variables TEXT
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS prompt_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id TEXT NOT NULL,
      version INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(template_id) REFERENCES prompt_templates(id)
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      title TEXT,
      workspace_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS conversation_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      tokens INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(conversation_id) REFERENCES conversations(id)
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS memory (
      id TEXT PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL,
      type TEXT DEFAULT 'long-term',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS ai_requests_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      workspace_id TEXT,
      project_id TEXT,
      agent_id TEXT,
      provider_id TEXT,
      model_id TEXT,
      prompt TEXT,
      completion TEXT,
      input_tokens INTEGER DEFAULT 0,
      output_tokens INTEGER DEFAULT 0,
      cost REAL DEFAULT 0.0,
      latency_ms INTEGER DEFAULT 0,
      status_code INTEGER,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS model_routing_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_id TEXT UNIQUE NOT NULL,
      model_id TEXT NOT NULL,
      reasoning TEXT,
      FOREIGN KEY(model_id) REFERENCES models(id)
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS error_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider_id TEXT,
      model_id TEXT,
      error_message TEXT,
      stack_trace TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ==========================================
  // NEW SCHEMAS FOR WORKSPACE & AGENT ORCHESTRATION
  // ==========================================

  await dbRun(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      vision TEXT,
      goals TEXT,
      business_case TEXT,
      tech_stack TEXT,
      complexity TEXT,
      timeline TEXT,
      status TEXT DEFAULT 'Draft',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS epics (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'Draft',
      progress INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS features (
      id TEXT PRIMARY KEY,
      epic_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'Draft',
      value INTEGER DEFAULT 5,
      complexity INTEGER DEFAULT 5,
      impact TEXT DEFAULT 'Medium',
      score REAL DEFAULT 0.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(epic_id) REFERENCES epics(id) ON DELETE CASCADE
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS stories (
      id TEXT PRIMARY KEY,
      feature_id TEXT NOT NULL,
      title TEXT NOT NULL,
      template TEXT NOT NULL,
      points INTEGER DEFAULT 3,
      status TEXT DEFAULT 'Draft',
      dod TEXT DEFAULT 'Pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(feature_id) REFERENCES features(id) ON DELETE CASCADE
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      story_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'Draft',
      points INTEGER DEFAULT 3,
      assignee TEXT,
      reporter TEXT DEFAULT 'PMAgent',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(story_id) REFERENCES stories(id) ON DELETE CASCADE
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS task_dependencies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id TEXT NOT NULL,
      depends_on_task_id TEXT NOT NULL,
      type TEXT DEFAULT 'blocks', -- blocks, relates
      FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY(depends_on_task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      UNIQUE(task_id, depends_on_task_id)
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS agent_states (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      status TEXT DEFAULT 'Idle', -- Idle, Planning, Executing, Blocked, Failed, Completed
      current_task TEXT,
      cpu INTEGER DEFAULT 0,
      ram TEXT DEFAULT '0.5GB',
      tokens TEXT DEFAULT '0K',
      eta TEXT DEFAULT 'Done',
      health TEXT DEFAULT 'Healthy',
      last_active DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS execution_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id TEXT UNIQUE NOT NULL,
      agent_id TEXT NOT NULL,
      priority INTEGER DEFAULT 1, -- higher is higher priority
      status TEXT DEFAULT 'Pending', -- Pending, Processing, Completed, Failed
      retry_count INTEGER DEFAULT 0,
      last_error TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS approval_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_type TEXT NOT NULL, -- Project, Epic, Feature, Story, Task
      item_id TEXT NOT NULL,
      status TEXT DEFAULT 'Pending', -- Pending, Approved, Rejected
      confidence_score REAL DEFAULT 0.8,
      reasoning TEXT,
      risk_level TEXT DEFAULT 'Low',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(item_type, item_id)
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS events_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      payload TEXT, -- JSON string
      correlation_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL, -- Info, Success, Warning, Error
      message TEXT NOT NULL,
      read INTEGER DEFAULT 0, -- 0=unread, 1=read
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed default data if providers table is empty
  const providersCount = await dbGet(`SELECT COUNT(*) as count FROM providers`);
  if (providersCount.count === 0) {
    await seedDatabase();
  } else {
    // If database existed but new tables are empty, seed agents and project
    const agentsCount = await dbGet(`SELECT COUNT(*) as count FROM agent_states`);
    if (agentsCount.count === 0) {
      await seedAgentsOnly();
    }
    const projectsCount = await dbGet(`SELECT COUNT(*) as count FROM projects`);
    if (projectsCount.count === 0) {
      await seedSampleProject();
    }
  }
}

async function seedAgentsOnly() {
  console.log("[DB] Seeding AI Agent Initial States...");
  const defaultAgents = [
    { id: "pm-agent", name: "Product Manager Agent", role: "Product Manager" },
    { id: "ba-agent", name: "Business Analyst Agent", role: "Business Analyst" },
    { id: "arch-agent", name: "Architecture Agent", role: "Software Architect" },
    { id: "research-agent", name: "Research Agent", role: "Research Scientist" },
    { id: "ui-agent", name: "UI/UX Agent", role: "Product Designer" },
    { id: "fe-agent", name: "Frontend Agent", role: "Frontend Developer" },
    { id: "be-agent", name: "Backend Agent", role: "Backend Developer" },
    { id: "db-agent", name: "Database Agent", role: "Database Engineer" },
    { id: "qa-agent", name: "QA Agent", role: "QA Engineer" },
    { id: "devops-agent", name: "DevOps Agent", role: "DevOps Engineer" },
    { id: "doc-agent", name: "Documentation Agent", role: "Technical Writer" },
    { id: "sec-agent", name: "Security Agent", role: "Security Auditor" },
    { id: "release-agent", name: "Release Agent", role: "Release Manager" }
  ];

  for (const agent of defaultAgents) {
    await dbRun(`
      INSERT INTO agent_states (id, name, role, status, cpu, ram, tokens, eta, health)
      VALUES (?, ?, ?, 'Idle', 0, '0.5GB', '0K', 'Done', 'Healthy')
    `, [agent.name, agent.name, agent.role]);
  }
}

async function seedDatabase() {
  console.log("[DB] Seeding default database parameters...");

  // Seed Providers
  await dbRun(`INSERT INTO providers (id, name, status) VALUES ('deepseek', 'DeepSeek', 'Active')`);
  await dbRun(`INSERT INTO providers (id, name, status) VALUES ('openai', 'OpenAI', 'Active')`);
  await dbRun(`INSERT INTO providers (id, name, status) VALUES ('anthropic', 'Anthropic', 'Active')`);
  await dbRun(`INSERT INTO providers (id, name, status) VALUES ('gemini', 'Google Gemini', 'Active')`);

  // Seed Models
  await dbRun(`INSERT INTO models (id, provider_id, name, type, speed, cost_per_1k_prompt, cost_per_1k_completion, context_length, quality_score)
    VALUES ('deepseek-chat', 'deepseek', 'DeepSeek V3 Chat', 'chat', 'balanced', 0.00014, 0.00028, 64000, 92.0)`);
  await dbRun(`INSERT INTO models (id, provider_id, name, type, speed, cost_per_1k_prompt, cost_per_1k_completion, context_length, quality_score)
    VALUES ('deepseek-coder', 'deepseek', 'DeepSeek Coder V2', 'chat', 'balanced', 0.00014, 0.00028, 64000, 94.5)`);
  await dbRun(`INSERT INTO models (id, provider_id, name, type, speed, cost_per_1k_prompt, cost_per_1k_completion, context_length, quality_score)
    VALUES ('gpt-4o', 'openai', 'GPT-4o', 'chat', 'fast', 0.0025, 0.010, 128000, 95.0)`);
  await dbRun(`INSERT INTO models (id, provider_id, name, type, speed, cost_per_1k_prompt, cost_per_1k_completion, context_length, quality_score)
    VALUES ('claude-3-5-sonnet', 'anthropic', 'Claude 3.5 Sonnet', 'chat', 'balanced', 0.003, 0.015, 200000, 98.0)`);
  await dbRun(`INSERT INTO models (id, provider_id, name, type, speed, cost_per_1k_prompt, cost_per_1k_completion, context_length, quality_score)
    VALUES ('gemini-1.5-pro', 'gemini', 'Gemini 1.5 Pro', 'chat', 'fast', 0.00125, 0.00375, 1000000, 94.0)`);

  // Seed Default Configuration records
  await dbRun(`INSERT INTO provider_config (provider_id, api_endpoint) VALUES ('deepseek', 'https://api.deepseek.com/v1')`);
  await dbRun(`INSERT INTO provider_config (provider_id, api_endpoint) VALUES ('openai', 'https://api.openai.com/v1')`);
  await dbRun(`INSERT INTO provider_config (provider_id, api_endpoint) VALUES ('anthropic', 'https://api.anthropic.com/v1')`);
  await dbRun(`INSERT INTO provider_config (provider_id, api_endpoint) VALUES ('gemini', 'https://generativelanguage.googleapis.com/v1beta')`);

  // Seed Default Prompt Templates
  await dbRun(`INSERT INTO prompt_templates (id, category, name, system_prompt, default_variables) VALUES (
    'pm-prd-writer',
    'PM',
    'Generate PRD Section',
    'You are a Lead Product Manager Agent. Write a PRD section for the feature: {{featureName}}. Context details: {{context}}.',
    '["featureName", "context"]'
  )`);
  await dbRun(`INSERT INTO prompt_templates (id, category, name, system_prompt, default_variables) VALUES (
    'dev-refactor',
    'DEV',
    'Optimize code module',
    'You are a Senior Staff Engineer. Optimize and refactor this code to comply with style guides: {{codeContent}}.',
    '["codeContent"]'
  )`);

  // Seed Prompt Version 1 for templates
  await dbRun(`INSERT INTO prompt_versions (template_id, version, content) VALUES (
    'pm-prd-writer',
    1,
    'You are a Lead Product Manager Agent. Write a PRD section for the feature: {{featureName}}. Context details: {{context}}.'
  )`);

  // Seed Default Routing Rules
  await dbRun(`INSERT INTO model_routing_rules (agent_id, model_id, reasoning) VALUES ('PM Agent', 'deepseek-chat', 'Low cost and high reasoning for text scoping')`);
  await dbRun(`INSERT INTO model_routing_rules (agent_id, model_id, reasoning) VALUES ('Developer Agent', 'deepseek-coder', 'Optimized context mapping and syntax compilation capability')`);
  await dbRun(`INSERT INTO model_routing_rules (agent_id, model_id, reasoning) VALUES ('QA Agent', 'claude-3-5-sonnet', 'Excellent test plan edge-case detection quality')`);
  await dbRun(`INSERT INTO model_routing_rules (agent_id, model_id, reasoning) VALUES ('Security Agent', 'claude-3-5-sonnet', 'Highest logical validation benchmarks')`);

  // Seed AI Agents Initial State
  const defaultAgents = [
    { id: "pm-agent", name: "Product Manager Agent", role: "Product Manager" },
    { id: "ba-agent", name: "Business Analyst Agent", role: "Business Analyst" },
    { id: "arch-agent", name: "Architecture Agent", role: "Software Architect" },
    { id: "research-agent", name: "Research Agent", role: "Research Scientist" },
    { id: "ui-agent", name: "UI/UX Agent", role: "Product Designer" },
    { id: "fe-agent", name: "Frontend Agent", role: "Frontend Developer" },
    { id: "be-agent", name: "Backend Agent", role: "Backend Developer" },
    { id: "db-agent", name: "Database Agent", role: "Database Engineer" },
    { id: "qa-agent", name: "QA Agent", role: "QA Engineer" },
    { id: "devops-agent", name: "DevOps Agent", role: "DevOps Engineer" },
    { id: "doc-agent", name: "Documentation Agent", role: "Technical Writer" },
    { id: "sec-agent", name: "Security Agent", role: "Security Auditor" },
    { id: "release-agent", name: "Release Agent", role: "Release Manager" }
  ];

  for (const agent of defaultAgents) {
    await dbRun(`
      INSERT INTO agent_states (id, name, role, status, cpu, ram, tokens, eta, health)
      VALUES (?, ?, ?, 'Idle', 0, '0.5GB', '0K', 'Done', 'Healthy')
    `, [agent.name, agent.name, agent.role]);
  }

  // Seed sample project
  await seedSampleProject();

  console.log("[DB] Default database parameters successfully seeded.");
}

async function seedSampleProject() {
  console.log("[DB] Seeding realistic sample project 'ProductOS Core Analytics'...");

  const projId = "proj-analytics";
  // Seed Project
  await dbRun(`
    INSERT INTO projects (id, title, description, vision, goals, business_case, tech_stack, complexity, timeline, status)
    VALUES (?, 'ProductOS Core Analytics', 'Provide real-time telemetry metrics and agent CPU tracking.', 'Universal observability dashboard for digital worker grids.', 'Reduce latency by 20%, audit monthly token expenditures.', 'Aligns product performance metrics to SLA targets.', 'Node.js + SQLite + React + CSS Variables', 'Medium', '4 Weeks', 'Approved')
  `, [projId]);

  // Seed Epic
  const epicId = "epic-observability";
  await dbRun(`
    INSERT INTO epics (id, project_id, title, description, status, progress)
    VALUES (?, ?, 'Real-time Observability Panel', 'Build a visual card layout tracking live trace logs.', 'Approved', 45)
  `, [epicId, projId]);

  // Seed Feature
  const featId = "feat-latency-chart";
  await dbRun(`
    INSERT INTO features (id, epic_id, title, description, status, value, complexity, impact, score)
    VALUES (?, ?, 'SVG Latency Histogram Chart', 'Visual histogram plotting transaction response times.', 'Approved', 8, 4, 'High', 6.0)
  `, [featId, epicId]);

  // Seed User Story
  const storyId = "story-chart-interaction";
  await dbRun(`
    INSERT INTO stories (id, feature_id, title, template, points, status, dod)
    VALUES (?, ?, 'Select bar to view traces', 'As a developer, I want to hover over histogram bars so I can view logs from that specific time slice.', 5, 'Approved', 'Passed')
  `, [storyId, featId]);

  // Seed Tasks
  const taskId1 = "task-svg-bars";
  const taskId2 = "task-hover-tooltip";

  await dbRun(`
    INSERT INTO tasks (id, story_id, title, description, status, points, assignee, reporter)
    VALUES (?, ?, 'Implement SVG histogram bars layout', 'Render responsive vector columns scaled by response duration.', 'Approved', 3, 'Developer Agent', 'PM Agent')
  `, [taskId1, storyId]);

  await dbRun(`
    INSERT INTO tasks (id, story_id, title, description, status, points, assignee, reporter)
    VALUES (?, ?, 'Bind hover handlers and tooltip portals', 'Trigger portal rendering showing message count and timestamp on hover.', 'Approved', 2, 'Developer Agent', 'PM Agent')
  `, [taskId2, storyId]);

  // Seed Task Dependency (task-hover-tooltip depends on task-svg-bars)
  await dbRun(`
    INSERT INTO task_dependencies (task_id, depends_on_task_id, type)
    VALUES (?, ?, 'blocks')
  `, [taskId2, taskId1]);

  console.log("[DB] Sample project seeded.");
}

export default db;
