import express from "express";
import { AIService } from "../services/AIService.js";
import { ModelRouter } from "../services/ModelRouter.js";
import { TokenManager } from "../services/TokenManager.js";
import { PromptEngine } from "../services/PromptEngine.js";
import { ContextEngine } from "../services/ContextEngine.js";
import { MemoryEngine } from "../services/MemoryEngine.js";
import { dbAll, dbGet } from "../db/database.js";

const router = express.Router();

// 1. POST /api/ai/chat
router.post("/chat", async (req, res) => {
  try {
    const { prompt, conversationId, agentId, workspaceId, projectId } = req.body;
    const result = await AIService.generateCompletion({
      variables: { prompt },
      conversationId,
      agentId,
      workspaceId,
      projectId
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. POST /api/ai/generate
router.post("/generate", async (req, res) => {
  try {
    const { promptTemplateId, variables, agentId, workspaceId, projectId } = req.body;
    const result = await AIService.generateCompletion({
      promptTemplateId,
      variables,
      agentId,
      workspaceId,
      projectId
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. POST /api/ai/stream (SSE Stream)
router.post("/stream", async (req, res) => {
  const { prompt, agentId, conversationId } = req.body;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    await AIService.streamCompletion(
      { prompt, agentId, conversationId },
      (chunk) => {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      },
      (endData) => {
        res.write(`data: ${JSON.stringify({ done: true, text: endData.text })}\n\n`);
        res.end();
      }
    );
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

// 4. GET /api/ai/models
router.get("/models", async (req, res) => {
  try {
    const models = await ModelRouter.getActiveModels();
    res.json(models);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. GET /api/ai/providers
router.get("/providers", async (req, res) => {
  try {
    const providers = await dbAll(`
      SELECT p.*, pc.api_endpoint, pc.timeout_ms, pc.rate_limit_rpm 
      FROM providers p
      LEFT JOIN provider_config pc ON p.id = pc.provider_id
    `);
    res.json(providers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. POST /api/ai/prompts
router.post("/prompts", async (req, res) => {
  try {
    const { id, category, name, systemPrompt, defaultVariables } = req.body;
    await PromptEngine.createTemplate(id, category, name, systemPrompt, defaultVariables);
    res.json({ success: true, message: `Prompt template '${id}' registered successfully.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. POST /api/ai/context
router.post("/context", async (req, res) => {
  try {
    const { workspaceId, projectId, sprintId, taskId } = req.body;
    const context = await ContextEngine.getContext({ workspaceId, projectId, sprintId, taskId });
    res.json({ context });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. POST /api/ai/memory
router.post("/memory", async (req, res) => {
  try {
    const { action, key, value, type } = req.body;
    if (action === "save") {
      await MemoryEngine.saveLongTermMemory(key, value, type);
      res.json({ success: true, message: `Saved variable key '${key}' to long-term memory.` });
    } else {
      const val = await MemoryEngine.getLongTermMemory(key);
      res.json({ key, value: val });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. GET /api/ai/usage
router.get("/usage", async (req, res) => {
  try {
    const usage = await TokenManager.getUsageAnalytics();
    res.json(usage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 10. GET /api/ai/history
router.get("/history", async (req, res) => {
  try {
    const { conversationId } = req.query;
    if (!conversationId) {
      // Return list of conversations
      const threads = await dbAll(`SELECT * FROM conversations ORDER BY created_at DESC`);
      res.json(threads);
    } else {
      // Return messages in a conversation
      const messages = await dbAll(`
        SELECT * FROM conversation_messages 
        WHERE conversation_id = ? 
        ORDER BY created_at ASC
      `, [conversationId]);
      res.json(messages);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
