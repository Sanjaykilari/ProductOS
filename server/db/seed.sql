-- ============================================================================
-- PRODUCTOS ENTERPRISE LOOKUPS SEED DATA
-- Target Database: SQLite (MVP) / Standard ANSI SQL (PostgreSQL Ready)
-- ============================================================================

-- 1. Currencies
INSERT OR IGNORE INTO currencies (id, name, code, symbol) VALUES
('curr-usd', 'US Dollar', 'USD', '$'),
('curr-eur', 'Euro', 'EUR', '€'),
('curr-gbp', 'British Pound', 'GBP', '£'),
('curr-jpy', 'Japanese Yen', 'JPY', '¥');

-- 2. Countries
INSERT OR IGNORE INTO countries (id, name, iso_code_2, iso_code_3, phone_code, currency_id) VALUES
('cntry-us', 'United States', 'US', 'USA', '1', 'curr-usd'),
('cntry-gb', 'United Kingdom', 'GB', 'GBR', '44', 'curr-gbp'),
('cntry-fr', 'France', 'FR', 'FRA', '33', 'curr-eur'),
('cntry-jp', 'Japan', 'JP', 'JPN', '81', 'curr-jpy');

-- 3. Languages
INSERT OR IGNORE INTO languages (id, name, code) VALUES
('lang-en', 'English', 'en'),
('lang-es', 'Spanish', 'es'),
('lang-fr', 'French', 'fr'),
('lang-de', 'German', 'de');

-- 4. Time Zones
INSERT OR IGNORE INTO time_zones (id, name, utc_offset) VALUES
('tz-utc', 'UTC', '+00:00'),
('tz-est', 'US/Eastern', '-05:00'),
('tz-pst', 'US/Pacific', '-08:00'),
('tz-lon', 'Europe/London', '+00:00'),
('tz-tok', 'Asia/Tokyo', '+09:00');

-- 5. Themes
INSERT OR IGNORE INTO themes (id, name, css_class, is_dark) VALUES
('theme-dark', 'ProductOS Premium Dark', 'dark', 1),
('theme-light', 'ProductOS Clean Light', 'light', 0),
('theme-glass', 'Glassmorphism Blur', 'glass', 1);

-- 6. Agent Roles
INSERT OR IGNORE INTO agent_roles (id, name, description) VALUES
('ar-pm', 'Product Manager', 'Translates user vision into epics, stories, and prioritizing models.'),
('ar-arch', 'Software Architect', 'Designs system components, database schemas, and microservice graphs.'),
('ar-dev', 'Software Engineer', 'Generates clean, modular frontend/backend source code and completes refactoring.'),
('ar-qa', 'QA Specialist', 'Automates cypress testing suites and reviews definition-of-done criteria.'),
('ar-sec', 'Security Auditor', 'Scans packages for OWASP concerns and audits branch authorization scopes.'),
('ar-devops', 'DevOps Specialist', 'Configures CI/CD action triggers, manages dockers, and handles rollbacks.');

-- 7. Skill Categories
INSERT OR IGNORE INTO skill_categories (id, name, description) VALUES
('sc-business', 'Business & Product Strategy', 'Requirements engineering, PRD writing, scoring, prioritization.'),
('sc-tech', 'Technical Architecture', 'API generation, code refactoring, database design, Docker pipeline scripts.'),
('sc-security', 'Security & Compliance', 'Static security scans, zero-trust credential audits.');

-- 8. Subscription Plans
INSERT OR IGNORE INTO subscription_plans (id, name, price_monthly_usd, seat_limit, token_limit_monthly, features_json) VALUES
('plan-free', 'Free Sandbox Plan', 0.0, 1, 100000, '{"api_access": false, "mcp_servers": 0}'),
('plan-pro', 'Professional Team Plan', 29.0, 10, 5000000, '{"api_access": true, "mcp_servers": 5}'),
('plan-ent', 'Enterprise Custom Plan', 199.0, 9999, 100000000, '{"api_access": true, "mcp_servers": 999}');

-- 9. Storage Providers
INSERT OR IGNORE INTO storage_providers (id, name, config_json) VALUES
('sp-local', 'Local FS Storage', '{"base_path": "./storage/local"}'),
('sp-s3', 'AWS S3 Vault', '{"bucket": "productos-vault", "region": "us-east-1"}');
