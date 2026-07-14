import { dbGet, dbRun, dbAll } from "../db/database.js";

export class PromptEngine {
  // Retrieve a prompt template by ID and replace variables
  static async getPrompt(templateId, variables = {}, versionOverride = null) {
    // 1. Fetch template metadata
    const template = await dbGet(`SELECT * FROM prompt_templates WHERE id = ?`, [templateId]);
    if (!template) {
      throw new Error(`Prompt template '${templateId}' not found`);
    }

    // 2. Fetch appropriate version content
    let versionRow;
    if (versionOverride) {
      versionRow = await dbGet(`
        SELECT content FROM prompt_versions 
        WHERE template_id = ? AND version = ?
      `, [templateId, versionOverride]);
    } else {
      // Fetch latest version
      versionRow = await dbGet(`
        SELECT content FROM prompt_versions 
        WHERE template_id = ? 
        ORDER BY version DESC LIMIT 1
      `, [templateId]);
    }

    if (!versionRow) {
      throw new Error(`No version content found for template '${templateId}'`);
    }

    let compiledPrompt = versionRow.content;

    // 3. Replace double curly placeholders
    Object.entries(variables).forEach(([key, val]) => {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g");
      compiledPrompt = compiledPrompt.replace(regex, val || "");
    });

    return {
      templateId,
      systemPrompt: template.system_prompt,
      userPrompt: compiledPrompt,
      category: template.category
    };
  }

  // Create new template
  static async createTemplate(id, category, name, systemPrompt, defaultVars = []) {
    await dbRun(`
      INSERT OR REPLACE INTO prompt_templates (id, category, name, system_prompt, default_variables)
      VALUES (?, ?, ?, ?, ?)
    `, [id, category, name, systemPrompt, JSON.stringify(defaultVars)]);

    // Save first version
    await dbRun(`
      INSERT INTO prompt_versions (template_id, version, content)
      VALUES (?, ?, ?)
    `, [id, 1, systemPrompt]);
  }

  // List all templates
  static async listTemplates() {
    return await dbAll(`SELECT * FROM prompt_templates`);
  }
}
