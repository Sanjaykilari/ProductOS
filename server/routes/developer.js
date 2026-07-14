import express from "express";
import { dbRun, dbAll, initDatabase } from "../db/database.js";
import { queueManager } from "../services/QueueManager.js";

const router = express.Router();

// 1. POST /api/developer/reset
router.post("/reset", async (req, res) => {
  console.log("[Developer] Wiping and resetting workspace tables...");
  try {
    // Delete Agile structure tables
    await dbRun(`DELETE FROM projects`);
    await dbRun(`DELETE FROM epics`);
    await dbRun(`DELETE FROM features`);
    await dbRun(`DELETE FROM stories`);
    await dbRun(`DELETE FROM tasks`);
    await dbRun(`DELETE FROM task_dependencies`);
    await dbRun(`DELETE FROM agent_states`);
    await dbRun(`DELETE FROM execution_queue`);
    await dbRun(`DELETE FROM approval_requests`);
    await dbRun(`DELETE FROM events_log`);
    await dbRun(`DELETE FROM notifications`);

    // Re-seed DB defaults
    await initDatabase();
    res.json({ success: true, message: "Workspace reset and seeded with default project successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. POST /api/developer/simulate-fail
router.post("/simulate-fail", async (req, res) => {
  try {
    const { simulate } = req.body;
    queueManager.setSimulateFail(simulate ?? true);
    res.json({ success: true, simulateFailure: simulate ?? true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. GET /api/developer/events
router.get("/events", async (req, res) => {
  try {
    const events = await dbAll(`SELECT * FROM events_log ORDER BY created_at DESC`);
    res.json(events.map(e => ({
      id: e.id,
      eventType: e.event_type,
      payload: JSON.parse(e.payload),
      correlationId: e.correlation_id,
      createdAt: e.created_at
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
