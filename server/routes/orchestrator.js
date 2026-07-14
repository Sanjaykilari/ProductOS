import express from "express";
import { orchestrator } from "../services/Orchestrator.js";
import { agentFramework } from "../services/AgentFramework.js";
import { eventBus } from "../services/EventBus.js";
import { dbAll, dbGet, dbRun } from "../db/database.js";

const router = express.Router();

// 1. POST /api/orchestrator/initiate
router.post("/initiate", async (req, res) => {
  try {
    const { idea } = req.body;
    if (!idea) {
      return res.status(400).json({ error: "Missing idea parameter" });
    }
    const result = await orchestrator.initiateProjectFromIdea(idea);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. POST /api/orchestrator/approve
router.post("/approve", async (req, res) => {
  try {
    const { itemType, itemId } = req.body;
    if (!itemType || !itemId) {
      return res.status(400).json({ error: "Missing itemType or itemId" });
    }
    const result = await orchestrator.approveArtifact(itemType, itemId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. GET /api/orchestrator/telemetry
router.get("/telemetry", async (req, res) => {
  try {
    const projects = await dbAll(`SELECT * FROM projects`);
    const epics = await dbAll(`SELECT * FROM epics`);
    const features = await dbAll(`SELECT * FROM features`);
    const tasks = await dbAll(`SELECT * FROM tasks`);
    const queue = await dbAll(`SELECT * FROM execution_queue`);
    const alerts = await dbAll(`SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10`);

    // Calculations
    const taskCount = tasks.length;
    const completedTasks = tasks.filter(t => t.status === "Completed" || t.status === "Done").length;
    const activeTasks = tasks.filter(t => t.status === "Executing").length;
    const blockedTasks = tasks.filter(t => t.status === "Assigned").length;

    const completionRate = taskCount > 0 ? Math.round((completedTasks / taskCount) * 100) : 0;
    
    // Workload calculation
    const workloadGroup = await dbAll(`
      SELECT assignee, COUNT(*) as count FROM tasks 
      WHERE status NOT IN ('Completed', 'Done')
      GROUP BY assignee
    `);

    res.json({
      projectCount: projects.length,
      epicCount: epics.length,
      featureCount: features.length,
      taskCount,
      completedTasks,
      activeTasks,
      blockedTasks,
      completionRate,
      workloads: workloadGroup,
      queueStatus: queue.map(q => ({ taskId: q.task_id, status: q.status, agentId: q.agent_id })),
      notifications: alerts
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. GET /api/orchestrator/notifications
router.get("/notifications", async (req, res) => {
  try {
    const alerts = await dbAll(`SELECT * FROM notifications ORDER BY created_at DESC`);
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. POST /api/orchestrator/notifications/read
router.post("/notifications/read", async (req, res) => {
  try {
    await dbRun(`UPDATE notifications SET read = 1`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. GET /api/orchestrator/agent-states
router.get("/agent-states", async (req, res) => {
  try {
    const agents = await agentFramework.getAgentStates();
    res.json(agents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. GET /api/orchestrator/projects
router.get("/projects", async (req, res) => {
  try {
    const projects = await dbAll(`SELECT * FROM projects ORDER BY created_at DESC`);
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. GET /api/orchestrator/tasks
router.get("/tasks", async (req, res) => {
  try {
    const { projectId } = req.query;
    let query = `SELECT * FROM tasks`;
    const params = [];
    if (projectId) {
      query = `
        SELECT t.*, s.title as story_title, f.title as feature_title, e.title as epic_title
        FROM tasks t
        LEFT JOIN stories s ON t.story_id = s.id
        LEFT JOIN features f ON s.feature_id = f.id
        LEFT JOIN epics e ON f.epic_id = e.id
        WHERE e.project_id = ? OR t.story_id IS NULL
      `;
      params.push(projectId);
    }
    const tasks = await dbAll(query, params);
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. POST /api/orchestrator/tasks
router.post("/tasks", async (req, res) => {
  try {
    const { title, description, points, assignee, status = "Draft" } = req.body;
    const id = `task-${Date.now()}`;
    await dbRun(`
      INSERT INTO tasks (id, title, description, points, assignee, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, title, description, points || 3, assignee || "Developer Agent", status]);
    
    await dbRun(`
      INSERT OR IGNORE INTO approval_requests (item_type, item_id, status)
      VALUES ('Task', ?, 'Pending')
    `, [id]);

    res.json({ id, title, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 10. POST /api/orchestrator/tasks/update-status
router.post("/tasks/update-status", async (req, res) => {
  try {
    const { taskId, status } = req.body;
    await dbRun(`UPDATE tasks SET status = ? WHERE id = ?`, [status, taskId]);
    
    if (status === "Approved" || status === "Completed") {
      await dbRun(`UPDATE approval_requests SET status = 'Approved' WHERE item_type = 'Task' AND item_id = ?`, [taskId]);
      if (status === "Approved") {
        await eventBus.publish("TaskApproved", { taskId });
      }
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
