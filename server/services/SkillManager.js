class SkillRegistry {
  constructor() {
    this.skills = {};
    this.registerPMSkills();
    this.registerResearchSkills();
    this.registerArchitectureSkills();
    this.registerUISkills();
    this.registerFrontendSkills();
    this.registerBackendSkills();
    this.registerDatabaseSkills();
    this.registerQASkills();
    this.registerDevOpsSkills();
    this.registerSecuritySkills();
    this.registerDocumentationSkills();
    this.registerDeveloperSkills();
    this.registerCrossAgentSkills();
  }

  register(skill) {
    this.skills[skill.id] = {
      version: "1.0.0",
      status: "Active",
      confidenceThreshold: 0.8,
      approvalRequired: true,
      retryStrategy: "Exponential backoff (max 3 retries)",
      ...skill
    };
  }

  // 1. PM Agent Skills
  registerPMSkills() {
    this.register({
      id: "prd-generator",
      name: "PRD Generator",
      category: "Business",
      agent: ["PM Agent"],
      description: "Drafts detailed Product Requirement Documents including user stories, acceptance criteria, and metric definitions.",
      requiredContext: ["Workspace idea", "Competitor trends"],
      requiredInputs: ["Feature title", "Target audience"],
      expectedOutputs: ["Markdown formatted PRD section"],
      promptTemplate: "Analyze the feature scope and define the target outcomes, success metrics, and epic breakdown.",
      guardrails: ["Cannot create code", "Cannot define DB schema directly"],
      tools: ["Notion API", "Workspace Docs Search"]
    });

    this.register({
      id: "prioritization-rice",
      name: "RICE Prioritization",
      category: "Business",
      agent: ["PM Agent"],
      description: "Calculates RICE priority scores (Reach * Impact * Confidence / Effort).",
      requiredContext: ["Feature backlog list"],
      requiredInputs: ["Feature data metrics"],
      expectedOutputs: ["Prioritization matrix with score values"],
      promptTemplate: "Review feature complexity and reach indices to output a sorted priority backlog table.",
      guardrails: ["Requires user confidence validation"],
      tools: ["Backlog Manager"]
    });
  }

  // 2. Research Agent Skills
  registerResearchSkills() {
    this.register({
      id: "competitor-analysis",
      name: "Competitor Analysis",
      category: "Technical",
      agent: ["Research Agent"],
      description: "Gathers API designs and competitor feature catalogs from public endpoints and docs.",
      requiredContext: ["Market definition"],
      requiredInputs: ["Competitor names"],
      expectedOutputs: ["Citations list", "SWOT matrix comparison"],
      promptTemplate: "Search and evaluate pricing, features, and public documentation of listed competitor products.",
      guardrails: ["Never fabricate research. Cite actual URLs only."],
      tools: ["Google Search API", "Browser Scraper"]
    });
  }

  // 3. Architecture Agent Skills
  registerArchitectureSkills() {
    this.register({
      id: "system-design",
      name: "System Design",
      category: "Technical",
      agent: ["Architecture Agent"],
      description: "Formulates system topology, microservice schemas, and API request charts.",
      requiredContext: ["PRD specifications"],
      requiredInputs: ["Scale requirements", "Tech stack restrictions"],
      expectedOutputs: ["Mermaid flowchart markdown", "High-level design docs"],
      promptTemplate: "Design structural modular boundaries, message queues, and API gateways for system components.",
      guardrails: ["Cannot implement source code", "Explain architectural trade-offs explicitly"],
      tools: ["Diagram Exporter"]
    });
  }

  // 4. UI/UX Agent Skills
  registerUISkills() {
    this.register({
      id: "design-systems",
      name: "Design Systems",
      category: "Design",
      agent: ["UI Agent"],
      description: "Generates color palettes, spacing tokens, and accessibility contrast standards.",
      requiredContext: ["Styling requirements"],
      requiredInputs: ["Target contrast ratio", "Brand accent colors"],
      expectedOutputs: ["CSS variables dictionary", "WCAG contrast checks"],
      promptTemplate: "Output a clean, semantic design token map following an 8px spacing layout scale.",
      guardrails: ["Must align strictly to WCAG accessibility guidelines"],
      tools: ["Contrast Checker"]
    });
  }

  // 5. Frontend Agent Skills
  registerFrontendSkills() {
    this.register({
      id: "react-components",
      name: "React Layout Compilation",
      category: "Technical",
      agent: ["Frontend Agent"],
      description: "Builds functional React interfaces wired to style variables.",
      requiredContext: ["Design tokens", "UX wireframes"],
      requiredInputs: ["Component mock layouts", "State triggers"],
      expectedOutputs: ["JSX Code block", "Inline CSS styling map"],
      promptTemplate: "Generate clean React code conforming to modern hooks guidelines and responsive grids.",
      guardrails: ["Never write database migration scripts", "Never modify backend routes directly"],
      tools: ["Linter", "CSS Grid Compiler"]
    });
  }

  // 6. Backend Agent Skills
  registerBackendSkills() {
    this.register({
      id: "rest-apis",
      name: "REST APIs Development",
      category: "Technical",
      agent: ["Backend Agent", "Developer Agent"],
      description: "Develops secure, validated REST API endpoints using Express.js.",
      requiredContext: ["Architecture data designs", "API paths list"],
      requiredInputs: ["Endpoint path", "Input JSON validation schema"],
      expectedOutputs: ["Javascript Express controller code"],
      promptTemplate: "Write route controllers, validation check blocks, and standard database query mounts.",
      guardrails: ["Do not output CSS variables", "Validate all parameters using sanitizer checks"],
      tools: ["Express API Generator"]
    });
  }

  // 7. Database Agent Skills
  registerDatabaseSkills() {
    this.register({
      id: "database-design",
      name: "Database Design & Migrations",
      category: "Technical",
      agent: ["Database Agent"],
      description: "Formulates relational schemas, indexes, and database migrations.",
      requiredContext: ["ER Diagrams"],
      requiredInputs: ["Table fields", "Query pattern metrics"],
      expectedOutputs: ["SQL DDL statement", "Migration plan"],
      promptTemplate: "Structure SQL table migrations, foreign keys, cascade deletes, and B-Tree indexes.",
      guardrails: ["Never delete production database data", "Must perform query index optimization scans"],
      tools: ["SQLite Schema Analyzer"]
    });
  }

  // 8. QA Agent Skills
  registerQASkills() {
    this.register({
      id: "cypress-automation",
      name: "Cypress Testing Suite",
      category: "Technical",
      agent: ["QA Agent"],
      description: "Drafts Cypress and Playwright integration scripts matching DoD metrics.",
      requiredContext: ["User stories and acceptance criteria"],
      requiredInputs: ["Component selectors", "User actions stream"],
      expectedOutputs: ["Cypress js test script"],
      promptTemplate: "Formulate end-to-end integration assertions simulating user browser clicks and network responses.",
      guardrails: ["Cannot approve builds if test coverage drops below 80%"],
      tools: ["Test Runner Sim"]
    });
  }

  // 9. DevOps Agent Skills
  registerDevOpsSkills() {
    this.register({
      id: "cicd-pipelines",
      name: "CI/CD Pipeline Setup",
      category: "Technical",
      agent: ["DevOps Agent"],
      description: "Configures GitHub Action flows, container setups, and auto-rollback hooks.",
      requiredContext: ["Deployment parameters"],
      requiredInputs: ["Staging ports", "Secrets key names"],
      expectedOutputs: ["GitHub Action YAML config"],
      promptTemplate: "Generate containerization build tasks and health check targets.",
      guardrails: ["Cannot execute deploy script without explicit user approval"],
      tools: ["GitHub Actions Validator"]
    });
  }

  // 10. Security Agent Skills
  registerSecuritySkills() {
    this.register({
      id: "owasp-scans",
      name: "OWASP Vulnerability Audit",
      category: "Security",
      agent: ["Security Agent"],
      description: "Audits repository codes for credentials leaks, SQL injection, and authorization bounds.",
      requiredContext: ["Coding standards"],
      requiredInputs: ["Source code lines"],
      expectedOutputs: ["Security audit checklist", "Vulnerability flags"],
      promptTemplate: "Audit codebase to detect authorization issues, secrets leakage, or SQL parameterization gaps.",
      guardrails: ["Must flag insecure implementations immediately"],
      tools: ["Static Analysis Scanner"]
    });
  }

  // 11. Documentation Agent Skills
  registerDocumentationSkills() {
    this.register({
      id: "api-documentation",
      name: "API Spec Writer",
      category: "Technical",
      agent: ["Documentation Agent"],
      description: "Creates clean OpenAPI, Markdown documents, and release changelogs.",
      requiredContext: ["Express controller code"],
      requiredInputs: ["REST API route metadata"],
      expectedOutputs: ["OpenAPI YAML specification", "Changelog updates"],
      promptTemplate: "Summarize controller paths, parameters, schemas, and return code status values.",
      guardrails: ["Never delete approved documentation wikis"],
      tools: ["Swagger YAML compiler"]
    });
  }

  // 12. Developer Agent Skills
  registerDeveloperSkills() {
    this.register({
      id: "code-refactor",
      name: "Code Refactoring",
      category: "Technical",
      agent: ["Developer Agent"],
      description: "Optimizes modular files, removes dead imports, and improves algorithm efficiency.",
      requiredContext: ["Active codebase folder"],
      requiredInputs: ["Refactor target code block"],
      expectedOutputs: ["Optimized source code"],
      promptTemplate: "Refactor this code to clean up imports, eliminate dead modules, and follow SOLID principles.",
      guardrails: ["Cannot execute deploy pipelines", "Must generate unit test alongside change"],
      tools: ["Linter", "Code Quality Analyzer"]
    });
  }

  // 13. Universal Cross-Agent Skills
  registerCrossAgentSkills() {
    this.register({
      id: "chain-of-thought",
      name: "Chain of Thought Reasoner",
      category: "Technical",
      agent: ["PM Agent", "Developer Agent", "Architecture Agent", "QA Agent", "Security Agent", "DevOps Agent", "Database Agent", "UI Agent", "Frontend Agent", "Backend Agent", "Research Agent", "Documentation Agent", "Business Analyst Agent"],
      description: "Executes step-by-step logic checking and self-review before yielding final answers.",
      requiredContext: ["Workspace Context"],
      requiredInputs: ["Prompt query"],
      expectedOutputs: ["Internal logic analysis", "Conforming answer"],
      promptTemplate: "Explain your reasoning step-by-step. Conduct a self-review of your assumptions before creating output.",
      guardrails: ["Always show confidence metrics"],
      tools: ["Reasoning Tracer"]
    });
  }

  // Resolves a list of modular skills to inject detailed prompts and validations
  resolveSkills(skillsList = []) {
    const activeSkills = skillsList.map(id => this.skills[id]).filter(Boolean);
    if (activeSkills.length === 0) {
      return "- **General Capability**: Standard workplace agent execution model.";
    }

    return activeSkills.map(sk => {
      return `### Skill: ${sk.name} (v${sk.version})
- **Description**: ${sk.description}
- **Required Context**: ${sk.requiredContext.join(", ")}
- **Guardrails**: ${sk.guardrails.join(", ")}
- **Required Tools**: ${sk.tools.join(", ")}`;
    }).join("\n\n");
  }
}

export const skillManager = new SkillRegistry();
export default skillManager;
