import { initDatabase, dbGet } from "./db/database.js";
import { encrypt, decrypt } from "./services/CryptoService.js";
import { AIService } from "./services/AIService.js";
import { TokenManager } from "./services/TokenManager.js";

async function runVerification() {
  console.log("=== ProductOS AI Layer Validation ===");

  try {
    // 1. Validate DB schemas creation
    await initDatabase();
    console.log("✅ SQLite Database initialized and seeded successfully.");

    // 2. Validate API key encryption
    const testKey = "sk-proj-test123456789";
    const encrypted = encrypt(testKey);
    const decrypted = decrypt(encrypted);
    if (decrypted === testKey) {
      console.log("✅ Cryptographic AES-256-GCM encryption verified.");
    } else {
      throw new Error("Encryption check failed: decrypted output does not match original key.");
    }

    // 3. Validate AI Service orchestration (resolves mock prompt in sandbox)
    const result = await AIService.generateCompletion({
      promptTemplateId: "pm-prd-writer",
      variables: { featureName: "Offline database sync", context: "IndexedDB partitioning" },
      agentId: "PM Agent",
      workspaceId: "workspace-1",
      projectId: "project-1"
    });

    if (result.success && result.text.includes("Sandbox")) {
      console.log("✅ AI Service completion gateway sandbox routing verified.");
      console.log(`💬 Sample Output: "${result.text}"`);
    } else {
      throw new Error("AI Service Sandbox execution failed.");
    }

    // 4. Validate Token & Cost logging
    const log = await dbGet(`SELECT COUNT(*) as count FROM ai_requests_log`);
    const usage = await TokenManager.getUsageAnalytics();
    if (log.count > 0 && usage.requestCount > 0) {
      console.log(`✅ Token usage analytics metrics logged (Total requests: ${usage.requestCount}, cost: $${usage.totalCost}).`);
    } else {
      throw new Error("No requests found in DB logger.");
    }

    console.log("=====================================");
    console.log("🎉 ALL CORE AI GATEWAY SERVICES VERIFIED successfully.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Validation Failed:", err.message);
    process.exit(1);
  }
}

runVerification();
