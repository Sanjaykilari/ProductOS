export class BaseAdapter {
  constructor(config = {}) {
    this.apiKey = config.apiKey;
    this.endpoint = config.endpoint;
    this.timeoutMs = config.timeoutMs || 10000;
  }

  // Execute request (promise-based)
  async execute(prompt, systemPrompt = "", options = {}) {
    throw new Error("execute() method not implemented");
  }

  // Stream request (generator or event stream emitter)
  async stream(prompt, systemPrompt = "", options = {}, onChunk) {
    throw new Error("stream() method not implemented");
  }

  // Handle common API timeout wrapper
  async fetchWithTimeout(url, fetchOptions = {}) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), this.timeoutMs);
    
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal
      });
      clearTimeout(id);
      return response;
    } catch (err) {
      clearTimeout(id);
      if (err.name === "AbortError") {
        throw new Error(`API Request timed out after ${this.timeoutMs}ms`);
      }
      throw err;
    }
  }
}
