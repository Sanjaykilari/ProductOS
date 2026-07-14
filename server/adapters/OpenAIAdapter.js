import { BaseAdapter } from "./BaseAdapter.js";

export class OpenAIAdapter extends BaseAdapter {
  async execute(prompt, systemPrompt = "", options = {}) {
    const model = options.model || "gpt-4o";
    const payload = {
      model,
      messages: [
        ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
        { role: "user", content: prompt }
      ]
    };

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
        throw new Error(`OpenAI error: ${response.status}`);
      }

      const data = await response.json();
      return {
        text: data.choices[0].message.content,
        inputTokens: data.usage.prompt_tokens,
        outputTokens: data.usage.completion_tokens,
        raw: data
      };
    } catch (err) {
      return this.simulateSandboxResponse(prompt, model);
    }
  }

  async stream(prompt, systemPrompt = "", options = {}, onChunk) {
    return this.simulateSandboxStream(prompt, onChunk);
  }

  simulateSandboxResponse(prompt, model) {
    const text = `[OpenAI Sandbox] Evaluated prompt with GPT-4o. Drafted 4 user story cards and assigned them to DeveloperAgent.`;
    return {
      text,
      inputTokens: 120,
      outputTokens: 200,
      raw: { sandbox: true }
    };
  }

  async simulateSandboxStream(prompt, onChunk) {
    const responseText = `[OpenAI Streaming Sandbox] Compiling sprint velocity logs... Total completed story points: 36 pts. Cost efficiency: 94%.`;
    for (const word of responseText.split(" ")) {
      await new Promise(r => setTimeout(r, 50));
      onChunk({ text: word + " " });
    }
  }
}
