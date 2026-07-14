import { BaseAgent } from "./BaseAgent.js";
import { dbAll, dbGet, dbRun } from "../db/database.js";
import { eventBus } from "./EventBus.js";

class AgentRegistry {
  constructor() {
    this.agents = {};
    this.registerAgents();
  }

  registerAgents() {
    // 1. PM Agent
    this.agents["PM Agent"] = new BaseAgent({
      id: "pm-agent",
      name: "PM Agent",
      role: "Product Manager",
      mission: "Convert ideas into executable product plans.",
      skills: ["prd-scoping", "rice-prioritization"],
      guardrails: ["code", "deploy", "database schema", "Express route"],
      approvalRules: "Medium Risk"
    });

    // 2. Research Agent
    this.agents["Research Agent"] = new BaseAgent({
      id: "research-agent",
      name: "Research Agent",
      role: "Research Scientist",
      mission: "Collect competitor, API, and technology best practice details.",
      skills: ["tech-evaluation"],
      guardrails: ["deploy", "write code"],
      approvalRules: "Low Risk"
    });

    // 3. Architecture Agent
    this.agents["Architecture Agent"] = new BaseAgent({
      id: "arch-agent",
      name: "Architecture Agent",
      role: "Software Architect",
      mission: "Design system schema topologies and modular data flows.",
      skills: ["system-design", "tech-evaluation"],
      guardrails: ["deploy", "implement code"],
      approvalRules: "High Risk"
    });

    // 4. UI/UX Agent
    this.agents["UI Agent"] = new BaseAgent({
      id: "ui-agent",
      name: "UI Agent",
      role: "Product Designer",
      mission: "Design wireframe components conforming to style tokens.",
      skills: ["design-tokens"],
      guardrails: ["backend logic", "database schema", "API routing"],
      approvalRules: "Medium Risk"
    });

    // 5. Frontend Agent
    this.agents["Frontend Agent"] = new BaseAgent({
      id: "fe-agent",
      name: "Frontend Agent",
      role: "Frontend Developer",
      mission: "Implement responsive, accessible UI layouts using CSS variables.",
      skills: ["css-variables", "code-refactor"],
      guardrails: ["backend API", "database schema", "deploy"],
      approvalRules: "Medium Risk"
    });

    // 6. Backend Agent
    this.agents["Backend Agent"] = new BaseAgent({
      id: "be-agent",
      name: "Backend Agent",
      role: "Backend Developer",
      mission: "Develop REST APIs and core business logic services.",
      skills: ["rest-apis", "code-refactor"],
      guardrails: ["styling CSS", "deploy", "design layouts"],
      approvalRules: "Medium Risk"
    });

    // 7. Database Agent
    this.agents["Database Agent"] = new BaseAgent({
      id: "db-agent",
      name: "Database Agent",
      role: "Database Engineer",
      mission: "Manage data schemas, query indexing, and migrations safely.",
      skills: ["sql-indexing"],
      guardrails: ["delete database", "deploy"],
      approvalRules: "High Risk"
    });

    // 8. QA Agent
    this.agents["QA Agent"] = new BaseAgent({
      id: "qa-agent",
      name: "QA Agent",
      role: "QA Engineer",
      mission: "Protect software quality by running regression test suites.",
      skills: ["cypress-tests"],
      guardrails: ["deploy", "approve failing checks"],
      approvalRules: "Medium Risk"
    });

    // 9. Security Agent
    this.agents["Security Agent"] = new BaseAgent({
      id: "sec-agent",
      name: "Security Agent",
      role: "Security Auditor",
      mission: "Scan code repositories for compliance and credential exposures.",
      skills: ["owasp-scans"],
      guardrails: ["deploy", "write CSS", "write frontend pages"],
      approvalRules: "High Risk"
    });

    // 10. DevOps Agent
    this.agents["DevOps Agent"] = new BaseAgent({
      id: "devops-agent",
      name: "DevOps Agent",
      role: "DevOps Engineer",
      mission: "Execute pipeline container actions and check health indicators.",
      skills: ["cicd-pipelines"],
      guardrails: ["write code", "edit database schema"],
      approvalRules: "Critical"
    });

    // 11. Documentation Agent
    this.agents["Documentation Agent"] = new BaseAgent({
      id: "doc-agent",
      name: "Documentation Agent",
      role: "Technical Writer",
      mission: "Maintain API documentations and retrospective wikis.",
      skills: ["code-refactor"],
      guardrails: ["delete wiki", "deploy"],
      approvalRules: "Low Risk"
    });

    // 12. Developer Agent
    this.agents["Developer Agent"] = new BaseAgent({
      id: "dev-agent",
      name: "Developer Agent",
      role: "Developer Coordinator",
      mission: "Coordinate implementation tasks and refactor code modules.",
      skills: ["code-refactor", "rest-apis", "css-variables"],
      guardrails: ["deploy", "merge without review"],
      approvalRules: "Medium Risk"
    });
  }

  // Get active agents state from database
  async getAgentStates() {
    return await dbAll(`SELECT * FROM agent_states`);
  }

  // Execute a task by its ID — loads task from DB and runs the full agent contract
  async executeTaskById(taskId, agentName) {
    const task = await dbGet(`SELECT * FROM tasks WHERE id = ?`, [taskId]);
    if (!task) throw new Error(`Task [${taskId}] not found in database.`);

    // Ensure agent assignment
    if (agentName) {
      await dbRun(`UPDATE tasks SET assignee = ? WHERE id = ?`, [agentName, taskId]);
      try {
        await dbRun(`
          INSERT OR REPLACE INTO agent_task_assignments (task_id, agent_name, status)
          VALUES (?, ?, 'Executing')
        `, [taskId, agentName]);
      } catch (e) { /* ignore duplicate */ }
    }

    const effectiveAgent = agentName || task.assignee || "Developer Agent";

    // Update status to Executing
    await dbRun(`UPDATE tasks SET status = 'Executing' WHERE id = ?`, [taskId]);
    eventBus.publish("TaskStatusChanged", { taskId, status: "Executing" });

    // Run the agent task
    await this.runAgentTask(effectiveAgent, { ...task, id: taskId });

    // Mark completed
    await dbRun(`UPDATE tasks SET status = 'Completed' WHERE id = ?`, [taskId]);
    eventBus.publish("TaskCompleted", { taskId, agentId: effectiveAgent });
    eventBus.publish("TaskStatusChanged", { taskId, status: "Completed" });

    // Return the output
    const output = await dbGet(`SELECT * FROM agent_outputs WHERE task_id = ? ORDER BY created_at DESC LIMIT 1`, [taskId]);
    return { taskId, agentName: effectiveAgent, output };
  }

  // Execute an AI employee agent task conforming to contract
  async runAgentTask(agentName, task, simulateFailure = false) {
    const agent = this.agents[agentName];
    if (!agent) {
      throw new Error(`Agent [${agentName}] is not registered in framework.`);
    }

    const workspaceId = "workspace-1";
    // Try to resolve the project ID from the task hierarchy
    let projectId = "proj-analytics";
    try {
      if (task.story_id) {
        const story = await dbGet(`SELECT feature_id FROM stories WHERE id = ?`, [task.story_id]);
        if (story) {
          const feat = await dbGet(`SELECT epic_id FROM features WHERE id = ?`, [story.feature_id]);
          if (feat) {
            const epic = await dbGet(`SELECT project_id FROM epics WHERE id = ?`, [feat.epic_id]);
            if (epic) projectId = epic.project_id;
          }
        }
      }
    } catch (e) { /* use default */ }

    try {
      // 1. Initialize State
      await agent.initialize(task.id);

      // 2. Load Context
      const context = await agent.loadContext(workspaceId, projectId, task.id);

      // 3. Validate Inputs & Guardrails
      await agent.validateInput(task, context);

      // 4. Plan Work
      await agent.planWork(task);
      await new Promise(r => setTimeout(r, 600));

      // 5. Execute reasoning via AIService (triggers real DeepSeek API call)
      const rawResponse = await agent.execute(task, context);

      // 6. Validate Output compliance
      const parsedResult = agent.validateOutput(rawResponse);

      if (simulateFailure) {
        throw new Error("Forced simulated execution error.");
      }

      // 7. Request approval
      await agent.requestApproval(parsedResult, task);

      // 8. Complete execution and record logs
      await agent.complete(task, parsedResult);

    } catch (err) {
      console.error(`[AgentFramework] Fatal exception during ${agentName} execution:`, err.message);
      await agent.complete(task, { structuredOutput: `Execution error: ${err.message}` });
      
      await dbRun(`
        UPDATE agent_states
        SET status = 'Failed', cpu = 0, last_active = CURRENT_TIMESTAMP
        WHERE name = ?
      `, [agentName]);

      eventBus.publish("AgentFailed", { agentName, taskId: task.id, error: err.message });
      throw err;
    }
  }
}

export const agentFramework = new AgentRegistry();
export default agentFramework;
