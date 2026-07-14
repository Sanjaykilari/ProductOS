import { PromptEngine } from "./PromptEngine.js";
import { ContextEngine } from "./ContextEngine.js";
import { MemoryEngine } from "./MemoryEngine.js";
import { ModelRouter } from "./ModelRouter.js";
import { providerManager } from "./ProviderManager.js";
import { TokenManager } from "./TokenManager.js";
import { dbRun } from "../db/database.js";

export class AIService {
  static async generateCompletion(params = {}) {
    const {
      promptTemplateId,
      variables = {},
      agentId = "General Assistant",
      conversationId = null,
      workspaceId = "default-workspace",
      projectId = "core-project",
      userId = "sanjay",
      preference = "cost-effective",
      maxRetries = 2
    } = params;

    const startTime = Date.now();

    // 1. Compile System/User Prompt templates
    let systemPrompt = "You are a helpful AI Assistant on ProductOS.";
    let compiledUserPrompt = "";
    
    if (promptTemplateId) {
      try {
        const promptData = await PromptEngine.getPrompt(promptTemplateId, variables);
        systemPrompt = promptData.systemPrompt;
        compiledUserPrompt = promptData.userPrompt;
      } catch (err) {
        console.warn(`[AIService] Failed loading template '${promptTemplateId}', using variables directly.`, err.message);
        compiledUserPrompt = variables.prompt || JSON.stringify(variables);
      }
    } else {
      compiledUserPrompt = variables.prompt || "Hello!";
    }

    // 2. Inject Active Workspace Context
    const activeContext = await ContextEngine.getContext({ workspaceId, projectId });
    systemPrompt += `\n\nActive System Context:\n${activeContext}`;

    // 3. Inject Short-term Memory (Chat history)
    let chatHistoryStr = "";
    if (conversationId) {
      const history = await MemoryEngine.getShortTermMemory(conversationId, 6);
      if (history.length > 0) {
        chatHistoryStr = history.map(h => `${h.role.toUpperCase()}: ${h.content}`).join("\n");
        systemPrompt += `\n\nRecent Conversation History:\n${chatHistoryStr}`;
      }
      
      // Save User Message to history
      await MemoryEngine.saveMessage(conversationId, "user", compiledUserPrompt);
    }

    // 4. Resolve routing to best Model & Provider
    const model = await ModelRouter.route({ agentId, preference, taskType: "chat" });
    const providerId = model.provider_id;

    let attempts = 0;
    let completionResult = null;
    let errorToLog = null;

    while (attempts <= maxRetries && !completionResult) {
      attempts++;
      try {
        const adapter = await providerManager.getAdapter(providerId);
        
        // Execute request
        completionResult = await adapter.execute(compiledUserPrompt, systemPrompt, {
          model: model.id,
          temperature: 0.7
        });
      } catch (err) {
        errorToLog = err;
        console.warn(`[AIService] Attempt ${attempts} failed for model ${model.id}: ${err.message}`);
        if (attempts > maxRetries) {
          // Log fail metrics
          await dbRun(`
            INSERT INTO error_logs (provider_id, model_id, error_message, stack_trace)
            VALUES (?, ?, ?, ?)
          `, [providerId, model.id, err.message, err.stack]);
        }
      }
    }

    const latencyMs = Date.now() - startTime;

    // 5. Finalize output & Log parameters
    if (completionResult) {
      // Save Assistant response in Short-term memory
      if (conversationId) {
        await MemoryEngine.saveMessage(conversationId, "assistant", completionResult.text);
      }

      // Log Usage
      await TokenManager.logRequest({
        userId,
        workspaceId,
        projectId,
        agentId,
        providerId,
        modelId: model.id,
        prompt: compiledUserPrompt,
        completion: completionResult.text,
        inputTokens: completionResult.inputTokens,
        outputTokens: completionResult.outputTokens,
        latencyMs,
        statusCode: 200
      });

      return {
        text: completionResult.text,
        modelId: model.id,
        providerId,
        latencyMs,
        success: true
      };
    } else {
      // Handle fatal failure gracefully
      const failMsg = `AI service failed to resolve request after ${attempts} attempts. Err: ${errorToLog?.message || "Unknown error"}`;
      
      await TokenManager.logRequest({
        userId,
        workspaceId,
        projectId,
        agentId,
        providerId,
        modelId: model.id,
        prompt: compiledUserPrompt,
        completion: failMsg,
        latencyMs,
        statusCode: 500,
        errorMessage: failMsg
      });

      return {
        text: "I apologize, but the ProductOS AI service is currently facing latency issues. Our QA and DevOps agents have been alerted.",
        modelId: model.id,
        providerId,
        latencyMs,
        success: false
      };
    }
  }

  // SSE completions streaming — with full workspace context + conversation history
  static async streamCompletion(params = {}, onChunk, onEnd) {
    const {
      prompt,
      agentId = "PM Agent",
      conversationId = null,
      workspaceId = "workspace-1",
      projectId = "proj-analytics"
    } = params;

    const startTime = Date.now();
    const model = await ModelRouter.route({ agentId, taskType: "chat" });
    const providerId = model.provider_id;

    // Build rich system prompt with workspace context
    const activeContext = await ContextEngine.getContext({ workspaceId, projectId });
    let enrichedSystem = `You are ${agentId} on ProductOS — an AI-native product management platform.
You are a senior specialist. Be concise, technical, and precise.

ProductOS Workspace Context:
${activeContext}

Rules:
- Never hallucinate project data. Only reference what is in context.
- If unsure, say "I don't have enough context on this yet."
- Format responses with markdown where helpful (bullet points, code blocks).
- Be direct and actionable. Suggest next steps.`;

    // Inject conversation history
    if (conversationId) {
      try {
        const history = await MemoryEngine.getShortTermMemory(conversationId, 8);
        if (history.length > 0) {
          enrichedSystem += `\n\nRecent Conversation:\n${history.map(h => `${h.role.toUpperCase()}: ${h.content}`).join("\n")}`;
        }
        // Save user message
        await MemoryEngine.saveMessage(conversationId, "user", prompt);
      } catch (e) { /* non-fatal */ }
    }

    try {
      const adapter = await providerManager.getAdapter(providerId);
      let accumulatedText = "";

      await adapter.stream(prompt, enrichedSystem, { model: model.id }, (chunk) => {
        accumulatedText += chunk.text;
        onChunk(chunk);
      });

      // Save assistant reply to history
      if (conversationId) {
        try { await MemoryEngine.saveMessage(conversationId, "assistant", accumulatedText); } catch (e) {}
      }

      const latencyMs = Date.now() - startTime;
      await TokenManager.logRequest({
        userId: "sanjay", workspaceId, projectId, agentId,
        providerId, modelId: model.id, prompt,
        completion: accumulatedText, latencyMs, statusCode: 200
      });

      if (onEnd) onEnd({ text: accumulatedText });
    } catch (err) {
      console.error("[AIService Stream] Stream exception", err);
      if (onEnd) onEnd({ error: err.message, text: `Error: ${err.message}` });
    }
  }
}
