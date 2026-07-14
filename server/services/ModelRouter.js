import { dbGet, dbAll } from "../db/database.js";

export class ModelRouter {
  // Select the appropriate model based on routing criteria
  static async route(params = {}) {
    const { 
      agentId = null, 
      preference = null, // 'fast', 'cost-effective', 'high-quality'
      taskType = "chat"  // chat, generate, embedding
    } = params;

    // 1. Check if there is an Agent-specific routing rule in the database
    if (agentId) {
      const rule = await dbGet(`
        SELECT m.* FROM model_routing_rules r
        JOIN models m ON r.model_id = m.id
        WHERE r.agent_id = ?
      `, [agentId]);
      
      if (rule) {
        return rule;
      }
    }

    // 2. Query models of the correct task type
    const models = await dbAll(`SELECT * FROM models WHERE type = ?`, [taskType]);
    if (models.length === 0) {
      throw new Error(`No models configured for task type: ${taskType}`);
    }

    // 3. Fallback based on preferences
    if (preference === "fast") {
      // Find models labeled fast
      const fastModels = models.filter(m => m.speed === "fast");
      if (fastModels.length > 0) return fastModels[0];
    } else if (preference === "cost-effective") {
      // Find cheapest model
      return models.reduce((prev, curr) => 
        (curr.cost_per_1k_prompt < prev.cost_per_1k_prompt) ? curr : prev
      , models[0]);
    } else if (preference === "high-quality") {
      // Find highest quality score
      return models.reduce((prev, curr) => 
        (curr.quality_score > prev.quality_score) ? curr : prev
      , models[0]);
    }

    // 4. Ultimate default fallback (first active model in DB, typically deepseek-chat)
    return models[0];
  }

  // Get active model list
  static async getActiveModels() {
    return await dbAll(`
      SELECT m.*, p.name as provider_name FROM models m
      JOIN providers p ON m.provider_id = p.id
      WHERE p.status = 'Active'
    `);
  }
}
