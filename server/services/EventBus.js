import { EventEmitter } from "events";
import { dbRun, dbAll } from "../db/database.js";
import crypto from "crypto";

class EventBus extends EventEmitter {
  constructor() {
    super();
    // Increase limit for multiple agent subscriptions
    this.setMaxListeners(50);
  }

  // Publish event and log to SQLite audit logs
  async publish(eventType, payload = {}, correlationId = null) {
    const cid = correlationId || crypto.randomUUID();
    const payloadStr = JSON.stringify(payload);
    
    console.log(`[EventBus] 📢 Event: ${eventType} | Correlation: ${cid}`);

    try {
      // Log to DB first
      await dbRun(`
        INSERT INTO events_log (event_type, payload, correlation_id)
        VALUES (?, ?, ?)
      `, [eventType, payloadStr, cid]);
    } catch (err) {
      console.error("[EventBus] Failed to log event to DB", err);
    }

    // Emit event asynchronously
    setImmediate(() => {
      this.emit(eventType, payload, cid);
    });

    return cid;
  }

  // Subscribe helper
  subscribe(eventType, listener) {
    this.on(eventType, listener);
    return () => this.off(eventType, listener);
  }
}

export const eventBus = new EventBus();
export default eventBus;
