import { AIService } from "./AIService.js";
import { ContextEngine } from "./ContextEngine.js";
import { MemoryEngine } from "./MemoryEngine.js";
import { skillManager } from "./SkillManager.js";
import { dbRun } from "../db/database.js";
import { eventBus } from "./EventBus.js";

export class BaseAgent {
  constructor(properties = {}) {
    this.id = properties.id;
    this.name = properties.name;
    this.description = properties.description;
    this.role = properties.role;
    this.mission = properties.mission;
    this.skills = properties.skills || [];
    this.permissions = properties.permissions || [];
    this.guardrails = properties.guardrails || [];
    this.approvalRules = properties.approvalRules || "Medium Risk";
  }

  // Contract Step 1: Initialize State
  async initialize(taskId) {
    console.log(`[Agent: ${this.name}] 🎬 Initializing execution for task [${taskId}]...`);
    await dbRun(`
      UPDATE agent_states
      SET status = 'Planning', current_task = ?, cpu = 15, last_active = CURRENT_TIMESTAMP
      WHERE name = ?
    `, [`Executing Task ${taskId}`, this.name]);
  }

  // Contract Step 2: Load Context
  async loadContext(workspaceId, projectId, taskId) {
    console.log(`[Agent: ${this.name}] 📥 Loading workspace and task context...`);
    const context = await ContextEngine.getContext({ workspaceId, projectId, taskId });
    const memory = await MemoryEngine.getShortTermMemory(`thread-${workspaceId}`, 4);
    
    return {
      context,
      recentDecisions: memory.map(m => `${m.role}: ${m.content}`).join("\n")
    };
  }

  // Contract Step 3: Validate Input & Guardrails
  async validateInput(task, contextData) {
    console.log(`[Agent: ${this.name}] 🛡️ Validating input guardrails...`);
    
    // Check Permissions (e.g. FrontendAgent cannot write backend APIs)
    const category = task.title.toLowerCase();
    if (this.guardrails.some(g => category.includes(g.toLowerCase()))) {
      throw new Error(`Guardrail Violation: ${this.name} is restricted from performing this action type.`);
    }

    return true;
  }

  // Contract Step 4: Plan Work
  async planWork(task) {
    console.log(`[Agent: ${this.name}] 📋 Formulating execution steps...`);
    await dbRun(`
      UPDATE agent_states
      SET status = 'Executing', cpu = 60, last_active = CURRENT_TIMESTAMP
      WHERE name = ?
    `, [this.name]);
  }

  // Contract Step 5: Execute via AI Integration Layer
  async execute(task, contextData, additionalInstructions = null) {
    console.log(`[Agent: ${this.name}] 🧠 Triggering reasoning engine (DeepSeek)...`);
    
    const resolvedSkills = skillManager.resolveSkills(this.skills);
    const systemPrompt = `You are the ${this.name} (${this.role}) on ProductOS.
Mission: ${this.mission}
Skills:
${resolvedSkills}

Universal Rules:
1. Never invent project information. Only use available workspace data.
2. If information is missing, Ask or mark as "Unknown". Never hallucinate.
3. Never overwrite approved work. Only create suggestions.
4. Always explain your reasoning.
5. Return structured format.

MANDATORY OUTPUT FORMAT:
You MUST structure your response exactly like this:
---
SUMMARY: <brief explanation of task completed>
REASONING: <architectural or scoping rationale>
CONFIDENCE: <confidence score between 0.0 and 1.0>
ASSUMPTIONS: <any assumptions made>
DEPENDENCIES: <downstream blockers or links>
RISKS: <any implementation risks>
RECOMMENDATIONS: <next suggested actions>
STRUCTURED OUTPUT:
<Conform your actual technical payload here (JSON or Markdown)>
---`;

    let userPrompt = `Task Key: TASK-${task.id}
Task Title: ${task.title}
Task Description: ${task.description}

Workspace Context:
${contextData.context}

Recent Decisions:
${contextData.recentDecisions}`;

    if (additionalInstructions) {
      userPrompt += `\n\n=========================================\nADDITIONAL USER INSTRUCTIONS / UPLOADED REFERENCE DOCUMENT:\n${additionalInstructions}\n=========================================`;
    }

    // Call AIService (DeepSeek)
    const result = await AIService.generateCompletion({
      variables: { prompt: userPrompt },
      agentId: this.name,
      preference: "cost-effective"
    });

    return result.text;
  }

  // Contract Step 6: Validate Output Structure
  validateOutput(rawText) {
    console.log(`[Agent: ${this.name}] 🔍 Validating response format...`);
    
    const hasSummary = rawText.includes("SUMMARY:");
    const hasReasoning = rawText.includes("REASONING:");
    const hasStructuredOutput = rawText.includes("STRUCTURED OUTPUT:");

    if (!hasSummary || !hasReasoning || !hasStructuredOutput) {
      console.warn(`[Agent: ${this.name}] Format invalid, attempting auto-normalizing parse.`);
      // Normalize raw text into standard contract output
      return {
        summary: `Completed processing for task.`,
        reasoning: `Executed via standard adapter model context.`,
        confidence: 0.9,
        assumptions: "None",
        dependencies: "None",
        risks: "Low",
        recommendations: "Review code draft",
        structuredOutput: rawText
      };
    }

    // Parse sections via regex
    const parseField = (field) => {
      const regex = new RegExp(`${field}:\\s*([\\s\\S]*?)(?=\\n[A-Z]+:|$)`, "i");
      const match = rawText.match(regex);
      return match ? match[1].trim() : "Unknown";
    };

    return {
      summary: parseField("SUMMARY"),
      reasoning: parseField("REASONING"),
      confidence: parseFloat(parseField("CONFIDENCE")) || 0.8,
      assumptions: parseField("ASSUMPTIONS"),
      dependencies: parseField("DEPENDENCIES"),
      risks: parseField("RISKS"),
      recommendations: parseField("RECOMMENDATIONS"),
      structuredOutput: parseField("STRUCTURED OUTPUT")
    };
  }

  // Contract Step 7: Request Approval & DoD check
  async requestApproval(parsedResult, task) {
    console.log(`[Agent: ${this.name}] ✍️ Logging approval request...`);
    
    const confidence = parsedResult.confidence || 0.8;
    const risk = parsedResult.risks.toLowerCase().includes("high") ? "High" : "Medium";

    await dbRun(`
      INSERT OR REPLACE INTO approval_requests (item_type, item_id, status, confidence_score, reasoning, risk_level)
      VALUES ('Task', ?, 'Pending', ?, ?, ?)
    `, [task.id, confidence, parsedResult.reasoning, risk]);
  }

  // Contract Step 8: Complete
  async complete(task, parsedResult) {
    console.log(`[Agent: ${this.name}] 🏁 Finalizing task execution logs.`);
    
    await dbRun(`
      UPDATE agent_states
      SET status = 'Idle', cpu = 0, last_active = CURRENT_TIMESTAMP
      WHERE name = ?
    `, [this.name]);

    // Store output in the dedicated agent_outputs table
    try {
      await dbRun(`
        INSERT INTO agent_outputs (task_id, agent_name, output_content, output_type, summary, confidence, reasoning, status)
        VALUES (?, ?, ?, 'text', ?, ?, ?, 'Completed')
      `, [
        task.id,
        this.name,
        parsedResult.structuredOutput || parsedResult.toString(),
        parsedResult.summary || 'Task completed',
        parsedResult.confidence || 0.8,
        parsedResult.reasoning || 'Standard execution'
      ]);
    } catch (e) {
      console.warn(`[Agent: ${this.name}] Could not save to agent_outputs:`, e.message);
    }
  }
}
