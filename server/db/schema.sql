-- ============================================================================
-- PRODUCTOS ENTERPRISE DATABASE SCHEMA
-- Target Database: SQLite (MVP) / Standard ANSI SQL (PostgreSQL Ready)
-- Total Modules: 15 | Total Tables: 215
-- ============================================================================

-- ============================================================================
-- MODULE 1: CORE PLATFORM LOOKUPS & FOUNDATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS currencies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  symbol TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS countries (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  iso_code_2 TEXT UNIQUE NOT NULL,
  iso_code_3 TEXT UNIQUE NOT NULL,
  phone_code TEXT NOT NULL,
  currency_id TEXT REFERENCES currencies(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS languages (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS time_zones (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  utc_offset TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS themes (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  css_class TEXT NOT NULL,
  is_dark INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Active'
);

-- ============================================================================
-- TENANT SECURITY & ORGANIZATION LAYER
-- ============================================================================

CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT UNIQUE,
  sso_enabled INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_private INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_system INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Active',
  UNIQUE(organization_id, name)
);

CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  module TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS role_permissions (
  id TEXT PRIMARY KEY,
  role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id TEXT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  UNIQUE(role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  organization_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  mfa_secret TEXT,
  mfa_enabled INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  language_id TEXT REFERENCES languages(id),
  time_zone_id TEXT REFERENCES time_zones(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS workspace_members (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id TEXT REFERENCES roles(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Active',
  UNIQUE(workspace_id, user_id)
);

CREATE TABLE IF NOT EXISTS user_preferences (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theme_id TEXT REFERENCES themes(id),
  email_notifications INTEGER DEFAULT 1,
  push_notifications INTEGER DEFAULT 1,
  sidebar_collapsed INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS user_settings (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mfa_backup_codes TEXT,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS team_members (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_lead INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  UNIQUE(team_id, user_id)
);

CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS department_members (
  id TEXT PRIMARY KEY,
  department_id TEXT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  UNIQUE(department_id, user_id)
);

CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  hashed_key TEXT NOT NULL,
  expires_at DATETIME,
  last_used_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS login_history (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  email_attempted TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  success INTEGER NOT NULL,
  failure_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1
);

-- ============================================================================
-- GLOBAL ATTACHMENTS, TAGS, LABELS, FAVORITES
-- ============================================================================

CREATE TABLE IF NOT EXISTS attachments (
  id TEXT PRIMARY KEY,
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  UNIQUE(workspace_id, name)
);

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL, -- Task, Epic, Document, PRD
  target_id TEXT NOT NULL,
  content TEXT NOT NULL,
  parent_id TEXT REFERENCES comments(id) ON DELETE CASCADE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS labels (
  id TEXT PRIMARY KEY,
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  UNIQUE(workspace_id, name)
);

CREATE TABLE IF NOT EXISTS favorites (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL, -- Project, Task, Doc
  item_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  UNIQUE(user_id, item_type, item_id)
);

CREATE TABLE IF NOT EXISTS bookmarks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS custom_fields (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  field_type TEXT NOT NULL, -- Text, Number, Date, Select
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  UNIQUE(workspace_id, name)
);

CREATE TABLE IF NOT EXISTS custom_field_options (
  id TEXT PRIMARY KEY,
  custom_field_id TEXT NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
  option_value TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS custom_field_values (
  id TEXT PRIMARY KEY,
  custom_field_id TEXT NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL, -- Task, Epic
  target_id TEXT NOT NULL,
  value_text TEXT,
  value_number REAL,
  value_date DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  UNIQUE(custom_field_id, target_type, target_id)
);

CREATE TABLE IF NOT EXISTS feature_flags (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  is_enabled INTEGER DEFAULT 0,
  rules_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1
);

-- ============================================================================
-- MODULE 2: PRODUCT MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS portfolios (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS programs (
  id TEXT PRIMARY KEY,
  portfolio_id TEXT NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  program_id TEXT REFERENCES programs(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  vision TEXT,
  goals TEXT,
  business_case TEXT,
  tech_stack TEXT,
  complexity TEXT DEFAULT 'Medium',
  timeline TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Draft'
);

CREATE TABLE IF NOT EXISTS roadmaps (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS objectives (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS okrs (
  id TEXT PRIMARY KEY,
  objective_id TEXT NOT NULL REFERENCES objectives(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_value REAL NOT NULL,
  current_value REAL DEFAULT 0.0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS milestones (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATETIME,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Pending'
);

CREATE TABLE IF NOT EXISTS releases (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version_name TEXT NOT NULL,
  release_date DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Planned'
);

CREATE TABLE IF NOT EXISTS release_notes (
  id TEXT PRIMARY KEY,
  release_id TEXT UNIQUE NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS sprints (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATETIME NOT NULL,
  end_date DATETIME NOT NULL,
  goal TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Planned'
);

CREATE TABLE IF NOT EXISTS backlogs (
  id TEXT PRIMARY KEY,
  project_id TEXT UNIQUE NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS epics (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  progress INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Draft'
);

CREATE TABLE IF NOT EXISTS features (
  id TEXT PRIMARY KEY,
  epic_id TEXT NOT NULL REFERENCES epics(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  value_score INTEGER DEFAULT 5,
  complexity_score INTEGER DEFAULT 5,
  impact TEXT DEFAULT 'Medium',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Draft'
);

CREATE TABLE IF NOT EXISTS user_stories (
  id TEXT PRIMARY KEY,
  feature_id TEXT NOT NULL REFERENCES features(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  acceptance_criteria TEXT,
  story_points INTEGER DEFAULT 3,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Draft'
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  story_id TEXT REFERENCES user_stories(id) ON DELETE CASCADE,
  sprint_id TEXT REFERENCES sprints(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  points INTEGER DEFAULT 3,
  assignee TEXT,
  reporter TEXT DEFAULT 'PMAgent',
  due_date DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Draft'
);

CREATE TABLE IF NOT EXISTS subtasks (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_completed INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS task_checklists (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  item_text TEXT NOT NULL,
  is_checked INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS task_dependencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  dependency_type TEXT DEFAULT 'blocks',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  UNIQUE(task_id, depends_on_task_id)
);

CREATE TABLE IF NOT EXISTS task_links (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  linked_task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  link_type TEXT DEFAULT 'relates',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  UNIQUE(task_id, linked_task_id)
);

CREATE TABLE IF NOT EXISTS decisions (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  context TEXT NOT NULL,
  decision TEXT NOT NULL,
  status TEXT DEFAULT 'Proposed',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS personas (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  demographics TEXT,
  goals TEXT,
  pain_points TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS value_streams (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  lead_time_target_mins INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS KPIs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  metric_unit TEXT NOT NULL,
  target_value REAL NOT NULL,
  current_value REAL DEFAULT 0.0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS approvals_history (
  id TEXT PRIMARY KEY,
  approval_request_id TEXT NOT NULL, -- Soft linked to approval queue
  approver_id TEXT NOT NULL REFERENCES users(id),
  action TEXT NOT NULL, -- Approved, Rejected
  reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS time_trackings (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hours_logged REAL NOT NULL,
  work_date DATETIME NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1
);

-- ============================================================================
-- MODULE 3: KNOWLEDGE MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS document_folders (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id TEXT REFERENCES document_folders(id) ON DELETE CASCADE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  folder_id TEXT REFERENCES document_folders(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT,
  doc_type TEXT DEFAULT 'wiki', -- wiki, prd, brd, architecture, meeting-note, sop
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Draft'
);

CREATE TABLE IF NOT EXISTS document_versions (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  change_summary TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS document_reviews (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  reviewer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comments TEXT,
  approved INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS document_links (
  id TEXT PRIMARY KEY,
  source_document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  target_document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  link_type TEXT DEFAULT 'references',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  UNIQUE(source_document_id, target_document_id)
);

-- ============================================================================
-- MODULE 4: AI INTEGRATION LAYER
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_providers (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  api_base_url TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS ai_models (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL REFERENCES ai_providers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'chat',
  speed TEXT DEFAULT 'balanced',
  cost_per_1k_prompt REAL DEFAULT 0.0,
  cost_per_1k_completion REAL DEFAULT 0.0,
  context_length INTEGER DEFAULT 4096,
  quality_score REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS provider_configurations (
  id TEXT PRIMARY KEY,
  provider_id TEXT UNIQUE NOT NULL REFERENCES ai_providers(id) ON DELETE CASCADE,
  encrypted_api_key TEXT,
  api_endpoint TEXT,
  timeout_ms INTEGER DEFAULT 10000,
  rate_limit_rpm INTEGER DEFAULT 60,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS prompt_categories (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS prompt_templates (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES prompt_categories(id),
  name TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  default_variables TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  UNIQUE(category_id, name)
);

CREATE TABLE IF NOT EXISTS prompt_versions (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL REFERENCES prompt_templates(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  UNIQUE(template_id, version_number)
);

CREATE TABLE IF NOT EXISTS prompt_executions (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL REFERENCES prompt_templates(id),
  tokens_used INTEGER,
  latency_ms INTEGER,
  success INTEGER DEFAULT 1,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS ai_conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS ai_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- system, user, assistant
  content TEXT NOT NULL,
  tokens INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS conversation_context (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL, -- task, document, repository
  source_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS token_usage_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE SET NULL,
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  agent_id TEXT,
  provider_id TEXT REFERENCES ai_providers(id),
  model_id TEXT REFERENCES ai_models(id),
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  estimated_cost REAL DEFAULT 0.0,
  latency_ms INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS model_routing_rules (
  id TEXT PRIMARY KEY,
  agent_id TEXT UNIQUE NOT NULL,
  model_id TEXT NOT NULL REFERENCES ai_models(id),
  reasoning TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS memory_records (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  memory_key TEXT NOT NULL,
  memory_value TEXT NOT NULL,
  memory_type TEXT DEFAULT 'long-term', -- long-term, short-term
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  UNIQUE(workspace_id, memory_key)
);

-- ============================================================================
-- MODULE 5: AI AGENT FRAMEWORK
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_roles (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS ai_agents (
  id TEXT PRIMARY KEY,
  role_id TEXT NOT NULL REFERENCES agent_roles(id),
  name TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'Idle', -- Idle, Planning, Executing, Blocked, Failed
  current_task TEXT,
  cpu INTEGER DEFAULT 0,
  ram TEXT DEFAULT '0.5GB',
  tokens TEXT DEFAULT '0K',
  eta TEXT DEFAULT 'Done',
  health TEXT DEFAULT 'Healthy',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS skill_categories (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS skill_registry (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES skill_categories(id),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  version_code TEXT NOT NULL,
  prompt_template TEXT,
  guardrails TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS agent_skills (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  skill_id TEXT NOT NULL REFERENCES skill_registry(id) ON DELETE CASCADE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  UNIQUE(agent_id, skill_id)
);

CREATE TABLE IF NOT EXISTS agent_assignments (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  UNIQUE(agent_id, task_id)
);

CREATE TABLE IF NOT EXISTS agent_work_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id TEXT UNIQUE NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  priority INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Pending', -- Pending, Processing, Completed, Failed
  retry_count INTEGER DEFAULT 0,
  last_error TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agent_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id TEXT NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
  log_level TEXT DEFAULT 'INFO', -- INFO, WARN, ERROR
  message TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- MODULE 6: WORKFLOW ENGINE
-- ============================================================================

CREATE TABLE IF NOT EXISTS workflow_definitions (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS workflow_states (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL REFERENCES workflow_definitions(id) ON DELETE CASCADE,
  state_name TEXT NOT NULL,
  is_initial INTEGER DEFAULT 0,
  is_final INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  UNIQUE(workflow_id, state_name)
);

CREATE TABLE IF NOT EXISTS workflow_transitions (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL REFERENCES workflow_definitions(id) ON DELETE CASCADE,
  from_state_id TEXT NOT NULL REFERENCES workflow_states(id),
  to_state_id TEXT NOT NULL REFERENCES workflow_states(id),
  transition_name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS workflow_instances (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL REFERENCES workflow_definitions(id) ON DELETE CASCADE,
  current_state_id TEXT NOT NULL REFERENCES workflow_states(id),
  target_type TEXT NOT NULL, -- Task, Story, Release
  target_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS event_types (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS event_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type_id TEXT NOT NULL REFERENCES event_types(id),
  payload TEXT NOT NULL, -- JSON
  correlation_id TEXT,
  processed INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS event_subscribers (
  id TEXT PRIMARY KEY,
  event_type_id TEXT NOT NULL REFERENCES event_types(id) ON DELETE CASCADE,
  endpoint_url TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS approval_rules (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL, -- Project, Epic, Story, Task
  risk_level TEXT NOT NULL, -- Low, Medium, High, Critical
  requires_manual_approval INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS approval_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_type TEXT NOT NULL, -- Project, Epic, Story, Task
  item_id TEXT NOT NULL,
  status TEXT DEFAULT 'Pending', -- Pending, Approved, Rejected
  risk_level TEXT DEFAULT 'Medium',
  confidence_score REAL DEFAULT 0.8,
  reasoning TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- MODULE 7: INTEGRATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS integrations_configs (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL, -- github, figma, slack, devops
  config_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS webhooks (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  target_url TEXT NOT NULL,
  secret_token TEXT,
  events_subscribed TEXT, -- Comma separated event names
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS webhook_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  webhook_id TEXT NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  payload TEXT,
  response_status_code INTEGER,
  response_body TEXT,
  latency_ms INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS oauth_connections (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_name TEXT NOT NULL, -- github, google, slack
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  UNIQUE(user_id, provider_name)
);

CREATE TABLE IF NOT EXISTS mcp_servers (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  server_name TEXT NOT NULL,
  transport_type TEXT DEFAULT 'sse', -- sse, stdio
  connection_url TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Active'
);

-- ============================================================================
-- MODULE 8: DEVELOPMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS repositories (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  clone_url TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS branches (
  id TEXT PRIMARY KEY,
  repository_id TEXT NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_default INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  UNIQUE(repository_id, name)
);

CREATE TABLE IF NOT EXISTS commits (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  sha TEXT NOT NULL,
  message TEXT NOT NULL,
  author_name TEXT,
  authored_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  UNIQUE(branch_id, sha)
);

CREATE TABLE IF NOT EXISTS pull_requests (
  id TEXT PRIMARY KEY,
  repository_id TEXT NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  pr_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  source_branch TEXT NOT NULL,
  target_branch TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Open'
);

CREATE TABLE IF NOT EXISTS code_reviews (
  id TEXT PRIMARY KEY,
  pull_request_id TEXT NOT NULL REFERENCES pull_requests(id) ON DELETE CASCADE,
  reviewer_id TEXT NOT NULL REFERENCES users(id),
  findings TEXT,
  status TEXT DEFAULT 'Pending', -- Pending, Approved, ChangesRequested
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS review_comments (
  id TEXT PRIMARY KEY,
  code_review_id TEXT NOT NULL REFERENCES code_reviews(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  line_number INTEGER,
  comment_text TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS builds (
  id TEXT PRIMARY KEY,
  repository_id TEXT NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  commit_sha TEXT NOT NULL,
  build_number INTEGER NOT NULL,
  log_output TEXT,
  duration_seconds INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Pending'
);

CREATE TABLE IF NOT EXISTS deployment_environments (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- Production, Staging, QA
  url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Active',
  UNIQUE(project_id, name)
);

CREATE TABLE IF NOT EXISTS deployments (
  id TEXT PRIMARY KEY,
  environment_id TEXT NOT NULL REFERENCES deployment_environments(id) ON DELETE CASCADE,
  build_id TEXT NOT NULL REFERENCES builds(id),
  deployment_number INTEGER NOT NULL,
  log_output TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Pending'
);

CREATE TABLE IF NOT EXISTS rollback_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  environment_id TEXT NOT NULL REFERENCES deployment_environments(id) ON DELETE CASCADE,
  from_deployment_id TEXT NOT NULL REFERENCES deployments(id),
  to_deployment_id TEXT NOT NULL REFERENCES deployments(id),
  reason TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS test_suites (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS test_cases (
  id TEXT PRIMARY KEY,
  test_suite_id TEXT NOT NULL REFERENCES test_suites(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  steps TEXT NOT NULL,
  expected_result TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS testing_sessions (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tester_id TEXT REFERENCES users(id),
  run_by_agent_id TEXT REFERENCES ai_agents(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'In Progress'
);

CREATE TABLE IF NOT EXISTS bug_reports (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  steps_to_reproduce TEXT,
  severity TEXT DEFAULT 'Medium', -- Low, Medium, High, Critical
  assignee_id TEXT REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Open'
);

CREATE TABLE IF NOT EXISTS incidents (
  id TEXT PRIMARY KEY,
  environment_id TEXT NOT NULL REFERENCES deployment_environments(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT DEFAULT 'High', -- Medium, High, Critical
  resolved_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Triggered'
);

-- ============================================================================
-- MODULE 9: SECURITY EXTENSIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS security_policies (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rules_json TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Active',
  UNIQUE(organization_id, name)
);

CREATE TABLE IF NOT EXISTS secrets_vault (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  secret_key TEXT NOT NULL,
  encrypted_secret_value TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  UNIQUE(workspace_id, secret_key)
);

CREATE TABLE IF NOT EXISTS certificates (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS security_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL, -- LoginFail, PrivilegeEscalation, LeakDetected
  severity TEXT DEFAULT 'Medium',
  description TEXT NOT NULL,
  ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS security_findings (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_path TEXT,
  line_number INTEGER,
  rule_id TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT DEFAULT 'Low', -- Low, Medium, High
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS vulnerabilities (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  cve_id TEXT,
  package_name TEXT NOT NULL,
  vulnerable_version TEXT NOT NULL,
  patched_version TEXT,
  severity TEXT NOT NULL, -- Low, Medium, High, Critical
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS compliance_frameworks (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- SOC2, ISO27001, GDPR
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS access_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- MODULE 10: ANALYTICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS dashboards (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id TEXT PRIMARY KEY,
  dashboard_id TEXT NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  widget_type TEXT NOT NULL, -- BarChart, Table, MetricCard
  query_config_json TEXT NOT NULL,
  grid_layout_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS charts_configs (
  id TEXT PRIMARY KEY,
  widget_id TEXT UNIQUE NOT NULL REFERENCES dashboard_widgets(id) ON DELETE CASCADE,
  chart_type TEXT NOT NULL, -- Line, Bar, Pie, Radar
  x_axis_key TEXT,
  y_axis_key TEXT,
  colors_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  report_type TEXT NOT NULL, -- Velocity, Burndown, CostEstimate
  scheduled_cron TEXT,
  recipients_emails TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS metric_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL, -- open_bugs, completed_points, daily_costs
  metric_value REAL NOT NULL,
  snapshot_date DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS kpi_definitions (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  formula TEXT,
  target_value REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS usage_statistics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
  active_users_count INTEGER DEFAULT 0,
  total_actions_logged INTEGER DEFAULT 0,
  logged_date DATE DEFAULT (date('now'))
);

CREATE TABLE IF NOT EXISTS project_metrics (
  id TEXT PRIMARY KEY,
  project_id TEXT UNIQUE NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  cycle_time_days REAL DEFAULT 0.0,
  lead_time_days REAL DEFAULT 0.0,
  defect_density REAL DEFAULT 0.0,
  sprint_predictability_rate REAL DEFAULT 0.0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agent_performance_metrics (
  id TEXT PRIMARY KEY,
  agent_id TEXT UNIQUE NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  accuracy_rate REAL DEFAULT 0.0,
  completion_rate REAL DEFAULT 0.0,
  avg_execution_latency_ms INTEGER DEFAULT 0,
  tokens_consumed_count INTEGER DEFAULT 0,
  cost_incurred_usd REAL DEFAULT 0.0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- MODULE 11: SEARCH INDEX
-- ============================================================================

CREATE TABLE IF NOT EXISTS global_search_index (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL, -- Task, Epic, Document, PRD
  target_id TEXT NOT NULL,
  search_title TEXT NOT NULL,
  search_body TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS search_histories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  query_text TEXT NOT NULL,
  clicked_item_type TEXT,
  clicked_item_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS saved_searches (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  query_params_json TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS search_filters (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filter_config_json TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS document_index (
  id TEXT PRIMARY KEY,
  document_id TEXT UNIQUE NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  indexed_text TEXT NOT NULL,
  vector_id TEXT, -- References vectorDB if needed later
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- MODULE 12: COMMUNICATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS chats (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS chat_channels (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_private INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  UNIQUE(workspace_id, name)
);

CREATE TABLE IF NOT EXISTS chat_threads (
  id TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  chat_id TEXT REFERENCES chats(id) ON DELETE CASCADE,
  channel_id TEXT REFERENCES chat_channels(id) ON DELETE CASCADE,
  thread_id TEXT REFERENCES chat_threads(id) ON DELETE CASCADE,
  sender_type TEXT DEFAULT 'user', -- user, agent
  sender_id TEXT NOT NULL, -- user_id or agent_id
  message_text TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS chat_mentions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id TEXT NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  mentioned_user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  mentioned_agent_id TEXT REFERENCES ai_agents(id) ON DELETE CASCADE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_reactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id TEXT NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(message_id, user_id, emoji)
);

CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS email_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  success INTEGER DEFAULT 0,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- MODULE 13: NOTIFICATION ENGINE
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_rules (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  trigger_event_type TEXT NOT NULL, -- TaskCompleted, BuildFailed
  action_type TEXT NOT NULL, -- Email, Push, Slack
  recipient_role_id TEXT REFERENCES roles(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS notification_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- Info, Success, Warning, Error
  message TEXT NOT NULL,
  payload_json TEXT,
  is_processed INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notification_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notification_preferences (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- TaskAssigned, BuildStatus
  channel TEXT NOT NULL, -- Email, In-App, Slack
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1
);

-- ============================================================================
-- MODULE 14: FILE SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS storage_providers (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL, -- Local, S3, GCS
  config_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  storage_provider_id TEXT NOT NULL REFERENCES storage_providers(id),
  name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  storage_key TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS file_versions (
  id TEXT PRIMARY KEY,
  file_id TEXT NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  size_bytes INTEGER NOT NULL,
  storage_key TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS file_uploads (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  upload_progress REAL DEFAULT 0.0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Uploading'
);

CREATE TABLE IF NOT EXISTS file_downloads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_id TEXT NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS media_library (
  id TEXT PRIMARY KEY,
  file_id TEXT UNIQUE NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  width INTEGER,
  height INTEGER,
  aspect_ratio REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1
);

-- ============================================================================
-- MODULE 15: BILLING, SUBSCRIPTIONS & MARKETPLACE
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL, -- Free, Pro, Enterprise
  price_monthly_usd REAL NOT NULL,
  seat_limit INTEGER NOT NULL,
  token_limit_monthly INTEGER NOT NULL,
  features_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS billing_accounts (
  id TEXT PRIMARY KEY,
  organization_id TEXT UNIQUE NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subscription_plan_id TEXT NOT NULL REFERENCES subscription_plans(id),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  billing_email TEXT NOT NULL,
  trial_ends_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  billing_account_id TEXT NOT NULL REFERENCES billing_accounts(id) ON DELETE CASCADE,
  amount_due REAL NOT NULL,
  amount_paid REAL DEFAULT 0.0,
  stripe_invoice_id TEXT,
  period_start DATETIME NOT NULL,
  period_end DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Unpaid'
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount REAL NOT NULL,
  payment_method TEXT NOT NULL, -- CreditCard, WireTransfer
  stripe_charge_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Succeeded'
);

CREATE TABLE IF NOT EXISTS usage_limits (
  id TEXT PRIMARY KEY,
  billing_account_id TEXT NOT NULL REFERENCES billing_accounts(id) ON DELETE CASCADE,
  limit_name TEXT NOT NULL, -- tokens_used, active_users, files_gbs
  max_value REAL NOT NULL,
  current_value REAL DEFAULT 0.0,
  reset_date DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  UNIQUE(billing_account_id, limit_name)
);

CREATE TABLE IF NOT EXISTS marketplace_items (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  item_type TEXT NOT NULL, -- plugin, agent, skill, workflow
  publisher_name TEXT NOT NULL,
  price_usd REAL DEFAULT 0.0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS marketplace_reviews (
  id TEXT PRIMARY KEY,
  marketplace_item_id TEXT NOT NULL REFERENCES marketplace_items(id) ON DELETE CASCADE,
  reviewer_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating_score INTEGER NOT NULL, -- 1 to 5
  review_text TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  UNIQUE(marketplace_item_id, reviewer_user_id)
);

CREATE TABLE IF NOT EXISTS marketplace_plugins (
  id TEXT PRIMARY KEY,
  marketplace_item_id TEXT UNIQUE NOT NULL REFERENCES marketplace_items(id) ON DELETE CASCADE,
  version_code TEXT NOT NULL,
  download_url TEXT NOT NULL,
  entry_point_file TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS enterprise_sso_configs (
  id TEXT PRIMARY KEY,
  organization_id TEXT UNIQUE NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  idp_entity_id TEXT NOT NULL,
  sso_login_url TEXT NOT NULL,
  certificate_fingerprint TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  deleted_at DATETIME,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Active'
);

-- ============================================================================
-- INDEXES FOR SCALE & SPEED PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_workspace_organization ON workspaces(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_story ON tasks(story_id);
CREATE INDEX IF NOT EXISTS idx_tasks_sprint ON tasks(sprint_id);
CREATE INDEX IF NOT EXISTS idx_epics_project ON epics(project_id);
CREATE INDEX IF NOT EXISTS idx_features_epic ON features(epic_id);
CREATE INDEX IF NOT EXISTS idx_stories_feature ON user_stories(feature_id);
CREATE INDEX IF NOT EXISTS idx_documents_workspace ON documents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_documents_folder ON documents(folder_id);
CREATE INDEX IF NOT EXISTS idx_token_usage_workspace ON token_usage_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_token_usage_project ON token_usage_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_agent ON agent_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_queue_status ON agent_work_queue(status);
CREATE INDEX IF NOT EXISTS idx_event_queue_processed ON event_queue(processed);
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat ON chat_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel ON chat_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread ON chat_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_processed ON notification_queue(is_processed);
CREATE INDEX IF NOT EXISTS idx_notification_history_user ON notification_history(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_files_workspace ON files(workspace_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_user ON access_logs(user_id);
