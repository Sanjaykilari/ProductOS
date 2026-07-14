import { dbGet } from "../db/database.js";
import { decrypt } from "./CryptoService.js";
import { DeepSeekAdapter } from "../adapters/DeepSeekAdapter.js";
import { OpenAIAdapter } from "../adapters/OpenAIAdapter.js";
import { AnthropicAdapter } from "../adapters/AnthropicAdapter.js";
import { GeminiAdapter } from "../adapters/GeminiAdapter.js";

class ProviderManager {
  constructor() {
    this.adapters = {};
  }

  // Instantiate and return the adapter for the selected provider
  async getAdapter(providerId) {
    if (this.adapters[providerId]) {
      return this.adapters[providerId];
    }

    // 1. Fetch credentials and config from SQLite
    const config = await dbGet(`
      SELECT pc.*, p.name FROM provider_config pc
      JOIN providers p ON pc.provider_id = p.id
      WHERE pc.provider_id = ?
    `, [providerId]);

    if (!config) {
      throw new Error(`No configuration found in database for provider: ${providerId}`);
    }

    // 2. Decrypt API Key
    let decryptedKey = null;
    if (config.encrypted_api_key) {
      try {
        decryptedKey = decrypt(config.encrypted_api_key);
      } catch (err) {
        console.error(`[ProviderManager] Failed decrypting API key for ${providerId}, running in sandbox mode.`, err);
      }
    } else {
      // Fallback: check environment variable (e.g., DEEPSEEK_API_KEY)
      const envKeyName = `${providerId.toUpperCase()}_API_KEY`;
      decryptedKey = process.env[envKeyName] || "test";
    }

    // 3. Resolve base configuration details
    const adapterConfig = {
      apiKey: decryptedKey,
      endpoint: config.api_endpoint,
      timeoutMs: config.timeout_ms || 10000
    };

    // 4. Factory resolve
    let adapterInstance;
    switch (providerId) {
      case "deepseek":
        adapterInstance = new DeepSeekAdapter(adapterConfig);
        break;
      case "openai":
        adapterInstance = new OpenAIAdapter(adapterConfig);
        break;
      case "anthropic":
        adapterInstance = new AnthropicAdapter(adapterConfig);
        break;
      case "gemini":
        adapterInstance = new GeminiAdapter(adapterConfig);
        break;
      default:
        throw new Error(`Unsupported provider adapter: ${providerId}`);
    }

    // Cache and return
    this.adapters[providerId] = adapterInstance;
    return adapterInstance;
  }

  // Clear cache if API key config updates
  clearCache(providerId) {
    delete this.adapters[providerId];
  }
}

export const providerManager = new ProviderManager();
export default providerManager;
