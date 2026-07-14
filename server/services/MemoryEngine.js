import { dbRun, dbAll, dbGet } from "../db/database.js";

export class MemoryEngine {
  // --- Short-term Memory (Conversation thread history) ---
  
  static async getShortTermMemory(conversationId, limit = 10) {
    if (!conversationId) return [];
    try {
      // Ensure conversation exists
      await dbRun(`INSERT OR IGNORE INTO conversations (id) VALUES (?)`, [conversationId]);
      
      const messages = await dbAll(`
        SELECT role, content FROM conversation_messages 
        WHERE conversation_id = ? 
        ORDER BY created_at ASC 
        LIMIT ?
      `, [conversationId, limit]);
      
      return messages;
    } catch (err) {
      console.error("[MemoryEngine] Failed to get short-term memory", err);
      return [];
    }
  }

  static async saveMessage(conversationId, role, content, tokens = 0) {
    if (!conversationId) return;
    try {
      await dbRun(`
        INSERT INTO conversation_messages (conversation_id, role, content, tokens)
        VALUES (?, ?, ?, ?)
      `, [conversationId, role, content, tokens]);
    } catch (err) {
      console.error("[MemoryEngine] Failed to save conversation message", err);
    }
  }

  // --- Long-term Memory (Key-Value preference logs) ---

  static async getLongTermMemory(key) {
    try {
      const row = await dbGet(`SELECT value FROM memory WHERE key = ?`, [key]);
      return row ? JSON.parse(row.value) : null;
    } catch (err) {
      console.error("[MemoryEngine] Failed to get long-term memory variable", err);
      return null;
    }
  }

  static async saveLongTermMemory(key, value, type = "long-term") {
    try {
      const valStr = JSON.stringify(value);
      await dbRun(`
        INSERT INTO memory (id, key, value, type)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
      `, [key, key, valStr, type]);
    } catch (err) {
      console.error("[MemoryEngine] Failed to store long-term memory", err);
    }
  }
}
