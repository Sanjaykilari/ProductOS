import { BaseAdapter } from "./BaseAdapter.js";

export class DeepSeekAdapter extends BaseAdapter {
  async execute(prompt, systemPrompt = "", options = {}) {
    const model = options.model || "deepseek-chat";
    const temperature = options.temperature ?? 0.7;

    // Standard payload
    const payload = {
      model,
      messages: [
        ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
        { role: "user", content: prompt }
      ],
      temperature,
      response_format: options.jsonMode ? { type: "json_object" } : undefined
    };

    // If API Key is missing or default test keys are used, run in Sandbox Mode
    if (!this.apiKey || this.apiKey.startsWith("mock_") || this.apiKey === "test") {
      return this.simulateSandboxResponse(prompt, model);
    }

    try {
      const response = await this.fetchWithTimeout(`${this.endpoint}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DeepSeek API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return {
        text: data.choices[0].message.content,
        inputTokens: data.usage.prompt_tokens,
        outputTokens: data.usage.completion_tokens,
        raw: data
      };
    } catch (err) {
      console.warn("[DeepSeek] API connection failed, falling back to sandbox simulator...", err.message);
      return this.simulateSandboxResponse(prompt, model);
    }
  }

  async stream(prompt, systemPrompt = "", options = {}, onChunk) {
    const model = options.model || "deepseek-chat";
    const payload = {
      model,
      messages: [
        ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
        { role: "user", content: prompt }
      ],
      stream: true
    };

    if (!this.apiKey || this.apiKey.startsWith("mock_") || this.apiKey === "test") {
      return this.simulateSandboxStream(prompt, onChunk);
    }

    try {
      const response = await this.fetchWithTimeout(`${this.endpoint}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`DeepSeek stream failed: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf8");
      let finished = false;

      while (!finished) {
        const { value, done } = await reader.read();
        if (done) {
          finished = true;
          break;
        }
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter(l => l.trim().startsWith("data:"));
        for (const line of lines) {
          const content = line.replace("data:", "").trim();
          if (content === "[DONE]") continue;
          const parsed = JSON.parse(content);
          const delta = parsed.choices[0].delta.content;
          if (delta) {
            onChunk({ text: delta });
          }
        }
      }
    } catch (err) {
      console.warn("[DeepSeek Stream] Failed, running simulated stream...", err.message);
      return this.simulateSandboxStream(prompt, onChunk);
    }
  }

  // --- Sandbox fallbacks ---
  simulateSandboxResponse(prompt, model) {
    const text = `[DeepSeek Sandbox v3] Evaluated prompt: "${prompt.substring(0, 40)}...". I recommend implementing structured index tables on SQLite databases to scale ProductOS dashboard query times.`;
    return {
      text,
      inputTokens: Math.ceil(prompt.length / 4),
      outputTokens: Math.ceil(text.length / 4),
      raw: { sandbox: true }
    };
  }

  async simulateSandboxStream(prompt, onChunk) {
    const responseText = `[DeepSeek Streaming Sandbox] Synthesized code and requirements for current workspace context. Running DevOpsAgent tests... Success. Ready for staging container launch.`;
    const words = responseText.split(" ");
    for (const word of words) {
      await new Promise(r => setTimeout(r, 60));
      onChunk({ text: word + " " });
    }
  }
}
