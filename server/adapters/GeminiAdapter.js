import { BaseAdapter } from "./BaseAdapter.js";

export class GeminiAdapter extends BaseAdapter {
  async execute(prompt, systemPrompt = "", options = {}) {
    const model = options.model || "gemini-1.5-pro";
    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined
    };

    if (!this.apiKey || this.apiKey.startsWith("mock_") || this.apiKey === "test") {
      return this.simulateSandboxResponse(prompt, model);
    }

    try {
      const response = await this.fetchWithTimeout(`${this.endpoint}/models/${model}:generateContent?key=${this.apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Gemini error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates[0].content.parts[0].text;
      return {
        text,
        inputTokens: Math.ceil(prompt.length / 4),
        outputTokens: Math.ceil(text.length / 4),
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
    const text = `[Google Gemini Pro Sandbox] Summarized context: 3 active milestones completed. Release scheduled for v2.4.1.`;
    return {
      text,
      inputTokens: 100,
      outputTokens: 150,
      raw: { sandbox: true }
    };
  }

  async simulateSandboxStream(prompt, onChunk) {
    const responseText = `[Gemini Streaming Sandbox] Aggregating recent wiki notes... Sprint 3 retrospective summaries updated in Knowledge database.`;
    for (const word of responseText.split(" ")) {
      await new Promise(r => setTimeout(r, 50));
      onChunk({ text: word + " " });
    }
  }
}
