import { dbRun, dbAll, dbGet } from "../db/database.js";

export class TokenManager {
  // Estimate tokens for the MVP (words * 1.35 is a standard fast approximation)
  static estimateTokens(text) {
    if (!text) return 0;
    const words = text.trim().split(/\s+/).length;
    return Math.ceil(words * 1.35);
  }

  // Calculate costs based on model query pricing
  static calculateCost(model, promptTokens, completionTokens) {
    const promptCost = (promptTokens / 1000) * (model.cost_per_1k_prompt || 0);
    const completionCost = (completionTokens / 1000) * (model.cost_per_1k_completion || 0);
    return promptCost + completionCost;
  }

  // Log completion metrics into the database
  static async logRequest({
    userId = "sanjay",
    workspaceId = "workspace-1",
    projectId = "project-1",
    agentId = "General Agent",
    providerId,
    modelId,
    prompt,
    completion,
    inputTokens = 0,
    outputTokens = 0,
    latencyMs = 0,
    statusCode = 200,
    errorMessage = null
  }) {
    // If tokens aren't provided, estimate them
    const estimatedInput = inputTokens || this.estimateTokens(prompt);
    const estimatedOutput = outputTokens || this.estimateTokens(completion);

    // Fetch model pricing structure
    let cost = 0.0;
    try {
      const model = await dbGet(`SELECT * FROM models WHERE id = ?`, [modelId]);
      if (model) {
        cost = this.calculateCost(model, estimatedInput, estimatedOutput);
      }
    } catch (e) {
      console.error("[TokenManager] Failed to fetch model for cost calculation", e);
    }

    try {
      await dbRun(`
        INSERT INTO ai_requests_log (
          user_id, workspace_id, project_id, agent_id, provider_id, model_id,
          prompt, completion, input_tokens, output_tokens, cost, latency_ms,
          status_code, error_message
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userId, workspaceId, projectId, agentId, providerId, modelId,
        prompt, completion, estimatedInput, estimatedOutput, cost, latencyMs,
        statusCode, errorMessage
      ]);
    } catch (err) {
      console.error("[TokenManager] Failed to log AI request metrics", err);
    }
  }

  // Fetch Usage Telemetry
  static async getUsageAnalytics() {
    const totalRequests = await dbGet(`SELECT COUNT(*) as count FROM ai_requests_log`);
    const successRate = await dbGet(`
      SELECT 
        (COUNT(CASE WHEN status_code = 200 THEN 1 END) * 100.0) / COUNT(*) as rate 
      FROM ai_requests_log
    `);
    const totalTokens = await dbGet(`SELECT SUM(input_tokens + output_tokens) as total FROM ai_requests_log`);
    const totalCost = await dbGet(`SELECT SUM(cost) as cost FROM ai_requests_log`);
    const avgLatency = await dbGet(`SELECT AVG(latency_ms) as latency FROM ai_requests_log`);

    // Group costs by Agent
    const agentBreakdown = await dbAll(`
      SELECT agent_id, COUNT(*) as count, SUM(cost) as cost, SUM(input_tokens + output_tokens) as tokens
      FROM ai_requests_log
      GROUP BY agent_id
    `);

    // Group costs by Provider
    const providerBreakdown = await dbAll(`
      SELECT provider_id, COUNT(*) as count, SUM(cost) as cost
      FROM ai_requests_log
      GROUP BY provider_id
    `);

    return {
      requestCount: totalRequests.count || 0,
      successRate: Math.round(successRate.rate || 100),
      totalTokens: totalTokens.total || 0,
      totalCost: Number((totalCost.cost || 0).toFixed(4)),
      avgLatencyMs: Math.round(avgLatency.latency || 0),
      agents: agentBreakdown,
      providers: providerBreakdown
    };
  }
}
