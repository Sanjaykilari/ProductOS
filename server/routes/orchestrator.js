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
    const documents = await dbAll(`SELECT * FROM documents`);

    const taskCount = tasks.length;
    const completedTasks = tasks.filter(t => t.status === "Completed" || t.status === "Done").length;
    const activeTasks = tasks.filter(t => t.status === "Executing").length;
    const blockedTasks = tasks.filter(t => t.status === "Assigned").length;
    const completionRate = taskCount > 0 ? Math.round((completedTasks / taskCount) * 100) : 0;
    
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
      documentCount: documents.length,
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

// 8. GET /api/orchestrator/epics
router.get("/epics", async (req, res) => {
  try {
    const { projectId } = req.query;
    let epics;
    if (projectId) {
      epics = await dbAll(`SELECT * FROM epics WHERE project_id = ? ORDER BY created_at`, [projectId]);
    } else {
      epics = await dbAll(`SELECT * FROM epics ORDER BY created_at DESC`);
    }
    res.json(epics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. GET /api/orchestrator/features
router.get("/features", async (req, res) => {
  try {
    const { epicId } = req.query;
    let features;
    if (epicId) {
      features = await dbAll(`SELECT * FROM features WHERE epic_id = ? ORDER BY created_at`, [epicId]);
    } else {
      features = await dbAll(`SELECT * FROM features ORDER BY created_at DESC`);
    }
    res.json(features);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 10. GET /api/orchestrator/stories
router.get("/stories", async (req, res) => {
  try {
    const { featureId } = req.query;
    let stories;
    if (featureId) {
      stories = await dbAll(`SELECT * FROM stories WHERE feature_id = ? ORDER BY created_at`, [featureId]);
    } else {
      stories = await dbAll(`SELECT * FROM stories ORDER BY created_at DESC`);
    }
    res.json(stories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 11. GET /api/orchestrator/documents
router.get("/documents", async (req, res) => {
  try {
    const { projectId, linkedItemId } = req.query;
    let docs;
    if (linkedItemId) {
      docs = await dbAll(`SELECT * FROM documents WHERE linked_item_id = ? ORDER BY created_at`, [linkedItemId]);
    } else if (projectId) {
      docs = await dbAll(`SELECT * FROM documents WHERE project_id = ? ORDER BY created_at`, [projectId]);
    } else {
      docs = await dbAll(`SELECT * FROM documents ORDER BY created_at DESC`);
    }
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 12. GET /api/orchestrator/tasks
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

// 13. POST /api/orchestrator/tasks
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

// 14. POST /api/orchestrator/tasks/update-status
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

// 15. POST /api/orchestrator/tasks/:id/assign — assign agent to task
router.post("/tasks/:id/assign", async (req, res) => {
  try {
    const { id } = req.params;
    const { agentName } = req.body;
    if (!agentName) return res.status(400).json({ error: "Missing agentName" });

    await dbRun(`UPDATE tasks SET assignee = ? WHERE id = ?`, [agentName, id]);
    try {
      await dbRun(`
        INSERT OR REPLACE INTO agent_task_assignments (task_id, agent_name, status)
        VALUES (?, ?, 'Assigned')
      `, [id, agentName]);
    } catch (e) { /* ignore */ }

    res.json({ success: true, taskId: id, agentName });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 16. POST /api/orchestrator/tasks/:id/execute — trigger agent execution
router.post("/tasks/:id/execute", async (req, res) => {
  try {
    const { id } = req.params;
    const { agentName, additionalInstructions } = req.body; // accept additionalInstructions override

    const result = await agentFramework.executeTaskById(id, agentName || null, additionalInstructions || null);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 17. GET /api/orchestrator/tasks/:id/output — get agent output for task
router.get("/tasks/:id/output", async (req, res) => {
  try {
    const { id } = req.params;
    const outputs = await dbAll(`SELECT * FROM agent_outputs WHERE task_id = ? ORDER BY created_at DESC`, [id]);
    res.json(outputs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 18. GET /api/orchestrator/project/:id/full — full project tree
router.get("/project/:id/full", async (req, res) => {
  try {
    const { id } = req.params;
    const fullProject = await orchestrator.getProjectFull(id);
    res.json(fullProject);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 19. POST /api/orchestrator/approve-all/:projectId — bulk approve
router.post("/approve-all/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    const result = await orchestrator.approveAllInProject(projectId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 20. DELETE /api/orchestrator/projects/:id — delete project and children
router.delete("/projects/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Cascading delete using transactions or queries
    await dbRun(`DELETE FROM projects WHERE id = ?`, [id]);
    
    const epics = await dbAll(`SELECT id FROM epics WHERE project_id = ?`, [id]);
    for (const epic of epics) {
      const features = await dbAll(`SELECT id FROM features WHERE epic_id = ?`, [epic.id]);
      for (const feat of features) {
        const stories = await dbAll(`SELECT id FROM stories WHERE feature_id = ?`, [feat.id]);
        for (const story of stories) {
          await dbRun(`DELETE FROM tasks WHERE story_id = ?`, [story.id]);
        }
        await dbRun(`DELETE FROM stories WHERE feature_id = ?`, [feat.id]);
      }
      await dbRun(`DELETE FROM features WHERE epic_id = ?`, [epic.id]);
    }
    await dbRun(`DELETE FROM epics WHERE project_id = ?`, [id]);
    await dbRun(`DELETE FROM documents WHERE project_id = ?`, [id]);

    await dbRun(`
      INSERT INTO notifications (type, message)
      VALUES ('Warning', 'Project ${id} has been deleted.')
    `);

    res.json({ success: true, message: `Project ${id} deleted.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 21. POST /api/orchestrator/projects/:id/update — human update project details
router.post("/projects/:id/update", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, vision, goals, tech_stack } = req.body;
    await dbRun(`
      UPDATE projects 
      SET title = ?, description = ?, vision = ?, goals = ?, tech_stack = ?
      WHERE id = ?
    `, [title, description, vision, goals, tech_stack, id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 22. POST /api/orchestrator/epics/:id/update — human update epic details
router.post("/epics/:id/update", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    await dbRun(`UPDATE epics SET title = ?, description = ? WHERE id = ?`, [title, description, id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 23. POST /api/orchestrator/features/:id/update — human update feature details
router.post("/features/:id/update", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    await dbRun(`UPDATE features SET title = ?, description = ? WHERE id = ?`, [title, description, id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 24. POST /api/orchestrator/stories/:id/update — human update story details
router.post("/stories/:id/update", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, template } = req.body;
    await dbRun(`UPDATE stories SET title = ?, template = ? WHERE id = ?`, [title, template, id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 25. POST /api/orchestrator/tasks/:id/update — human update task details
router.post("/tasks/:id/update", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, assignee, points, status } = req.body;
    await dbRun(`
      UPDATE tasks 
      SET title = ?, description = ?, assignee = ?, points = ?, status = ?
      WHERE id = ?
    `, [title, description, assignee, points, status, id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 26. POST /api/orchestrator/documents — human create custom document
router.post("/documents", async (req, res) => {
  try {
    const { projectId, title, content, docType, linkedItemType, linkedItemId } = req.body;
    const id = `doc-${Date.now()}`;
    await dbRun(`
      INSERT INTO documents (id, project_id, title, content, doc_type, linked_item_type, linked_item_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Approved')
    `, [id, projectId, title, content, docType || 'General', linkedItemType || null, linkedItemId || null]);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 27. POST /api/orchestrator/documents/:id/update — human edit/save document content
router.post("/documents/:id/update", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    await dbRun(`UPDATE documents SET title = ?, content = ? WHERE id = ?`, [title, content, id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 28. DELETE /api/orchestrator/documents/:id — human delete document
router.delete("/documents/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await dbRun(`DELETE FROM documents WHERE id = ?`, [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
