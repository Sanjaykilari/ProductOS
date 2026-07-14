import { dbRun, dbAll, dbGet } from "../db/database.js";
import { eventBus } from "./EventBus.js";
import { queueManager } from "./QueueManager.js";
import { BusinessRulesEngine } from "./BusinessRulesEngine.js";
import { AIService } from "./AIService.js";

class Orchestrator {
  constructor() {
    this.registerSubscribers();
  }

  // Subscribe orchestrator callbacks to EventBus events
  registerSubscribers() {
    // 1. Hook on Task Approved
    eventBus.subscribe("TaskApproved", async ({ taskId }) => {
      console.log(`[Orchestrator] TaskApproved received for: ${taskId}`);
      
      const task = await dbGet(`SELECT * FROM tasks WHERE id = ?`, [taskId]);
      if (!task) return;

      const ruleCheck = await BusinessRulesEngine.canExecuteTask(task);
      if (ruleCheck.allowed) {
        // Enqueue task for active agent
        const assignee = task.assignee || "Developer Agent";
        const priority = task.points || 1;
        
        await dbRun(`UPDATE tasks SET status = 'Assigned' WHERE id = ?`, [taskId]);
        await eventBus.publish("TaskStatusChanged", { taskId, status: "Assigned" });
        
        await queueManager.enqueueTask(taskId, assignee, priority);
      } else {
        console.log(`[Orchestrator] Task [${taskId}] remains blocked. Reason: ${ruleCheck.reason}`);
        await dbRun(`UPDATE tasks SET status = 'Assigned' WHERE id = ?`, [taskId]);
        await eventBus.publish("TaskStatusChanged", { taskId, status: "Assigned" });
        
        // Notify blocker state
        await dbRun(`
          INSERT INTO notifications (type, message)
          VALUES ('Warning', 'Task ${taskId} is blocked by pending requirements.')
        `);
      }
    });

    // 2. Hook on Task Completed
    eventBus.subscribe("TaskCompleted", async ({ taskId }) => {
      console.log(`[Orchestrator] TaskCompleted received for: ${taskId}`);

      // Locate downstream blocked tasks
      const dependents = await dbAll(`
        SELECT task_id FROM task_dependencies WHERE depends_on_task_id = ?
      `, [taskId]);

      for (const dep of dependents) {
        // Check if all blockers for downstream task are resolved
        const stillBlocked = await BusinessRulesEngine.canExecuteTask({ id: dep.task_id, status: "Approved" });
        if (stillBlocked.allowed) {
          console.log(`[Orchestrator] Unblocking downstream task [${dep.task_id}] automatically.`);
          // Trigger queue dispatch
          await eventBus.publish("TaskApproved", { taskId: dep.task_id });
        }
      }

      // Check completeness for story
      const task = await dbGet(`SELECT * FROM tasks WHERE id = ?`, [taskId]);
      if (task && task.story_id) {
        const storyCheck = await BusinessRulesEngine.canCompleteParent("Story", task.story_id);
        if (storyCheck.allowed) {
          console.log(`[Orchestrator] Completing User Story [${task.story_id}] automatically.`);
          await dbRun(`UPDATE stories SET status = 'Completed', dod = 'Passed' WHERE id = ?`, [task.story_id]);
          await eventBus.publish("StoryCompleted", { storyId: task.story_id });

          // Propagate features
          const story = await dbGet(`SELECT * FROM stories WHERE id = ?`, [task.story_id]);
          if (story && story.feature_id) {
            const featCheck = await BusinessRulesEngine.canCompleteParent("Feature", story.feature_id);
            if (featCheck.allowed) {
              await dbRun(`UPDATE features SET status = 'Completed' WHERE id = ?`, [story.feature_id]);
              await eventBus.publish("FeatureCompleted", { featureId: story.feature_id });

              // Propagate Epics
              const feat = await dbGet(`SELECT * FROM features WHERE id = ?`, [story.feature_id]);
              if (feat && feat.epic_id) {
                const epicCheck = await BusinessRulesEngine.canCompleteParent("Epic", feat.epic_id);
                if (epicCheck.allowed) {
                  await dbRun(`UPDATE epics SET status = 'Completed' WHERE id = ?`, [feat.epic_id]);
                  await eventBus.publish("EpicCompleted", { epicId: feat.epic_id });
                }
              }
            }
          }
        }
      }
    });

    // 3. Hook on Agent Failures
    eventBus.subscribe("AgentFailed", async ({ agentName, taskId }) => {
      await dbRun(`
        INSERT INTO notifications (type, message)
        VALUES ('Error', 'Agent ${agentName} failed during task execution. Retry scheduled.')
      `);
    });
  }

  // Generate workspace components from text idea
  async initiateProjectFromIdea(ideaText) {
    console.log(`[Orchestrator] Generating workspace roadmap from: "${ideaText}"`);

    // System prompt requesting structured JSON output
    const prompt = `Convert this product idea into a complete Agile backlog mapping.
Idea: "${ideaText}"

Response MUST be a single JSON object matching this structure:
{
  "project": { "title": "...", "description": "...", "tech_stack": "...", "timeline": "..." },
  "epics": [ { "id": "EPIC-1", "title": "...", "description": "..." } ],
  "features": [ { "id": "FEAT-1", "epic_id": "EPIC-1", "title": "...", "description": "..." } ],
  "stories": [ { "id": "STORY-1", "feature_id": "FEAT-1", "title": "...", "template": "..." } ],
  "tasks": [ { "id": "TASK-1", "story_id": "STORY-1", "title": "...", "description": "...", "assignee": "Developer Agent", "points": 3 } ],
  "dependencies": [ { "task_id": "TASK-2", "depends_on_task_id": "TASK-1" } ]
}`;

    // Call AIService in generate mode
    const result = await AIService.generateCompletion({
      variables: { prompt },
      agentId: "PM Agent",
      preference: "cost-effective"
    });

    // If sandbox fallbacks are active, result is returned as text
    let jsonPlan;
    try {
      jsonPlan = JSON.parse(result.text);
    } catch (e) {
      console.warn("[Orchestrator] AI output was not valid JSON, parsing with sandbox defaults.");
      // Seeding sandbox default project template
      jsonPlan = this.getSandboxProjectPlan(ideaText);
    }

    const projectId = `proj-${Date.now()}`;
    const project = jsonPlan.project;

    // Map epics, features, stories, tasks, and dependencies to project-unique IDs to avoid constraint collisions
    const epics = (jsonPlan.epics || []).map(epic => ({
      ...epic,
      id: `${epic.id}-${projectId}`
    }));

    const features = (jsonPlan.features || []).map(feat => ({
      ...feat,
      id: `${feat.id}-${projectId}`,
      epic_id: `${feat.epic_id}-${projectId}`
    }));

    const stories = (jsonPlan.stories || []).map(story => ({
      ...story,
      id: `${story.id}-${projectId}`,
      feature_id: `${story.feature_id}-${projectId}`
    }));

    const tasks = (jsonPlan.tasks || []).map(task => ({
      ...task,
      id: `${task.id}-${projectId}`,
      story_id: `${task.story_id}-${projectId}`
    }));

    const dependencies = (jsonPlan.dependencies || []).map(dep => ({
      ...dep,
      task_id: `${dep.task_id}-${projectId}`,
      depends_on_task_id: `${dep.depends_on_task_id}-${projectId}`
    }));

    // 1. Insert Project (Draft status)
    await dbRun(`
      INSERT INTO projects (id, title, description, vision, goals, tech_stack, status)
      VALUES (?, ?, ?, ?, ?, ?, 'Draft')
    `, [projectId, project.title, project.description, ideaText, "Identify beta deployment target", project.tech_stack]);

    await dbRun(`
      INSERT INTO approval_requests (item_type, item_id, status, confidence_score, reasoning)
      VALUES ('Project', ?, 'Pending', 0.94, 'Complete project roadmap generated by PM Agent')
    `, [projectId]);

    // 2. Insert Epics
    for (const epic of epics) {
      await dbRun(`
        INSERT INTO epics (id, project_id, title, description, status)
        VALUES (?, ?, ?, ?, 'Draft')
      `, [epic.id, projectId, epic.title, epic.description]);
      
      await dbRun(`
        INSERT INTO approval_requests (item_type, item_id, status)
        VALUES ('Epic', ?, 'Pending')
      `, [epic.id]);
    }

    // 3. Insert Features
    for (const feat of features) {
      await dbRun(`
        INSERT INTO features (id, epic_id, title, description, status)
        VALUES (?, ?, ?, ?, 'Draft')
      `, [feat.id, feat.epic_id, feat.title, feat.description]);

      await dbRun(`
        INSERT INTO approval_requests (item_type, item_id, status)
        VALUES ('Feature', ?, 'Pending')
      `, [feat.id]);
    }

    // 4. Insert Stories
    for (const story of stories) {
      await dbRun(`
        INSERT INTO stories (id, feature_id, title, template, status)
        VALUES (?, ?, ?, ?, 'Draft')
      `, [story.id, story.feature_id, story.title, story.template]);

      await dbRun(`
        INSERT INTO approval_requests (item_type, item_id, status)
        VALUES ('Story', ?, 'Pending')
      `, [story.id]);
    }

    // 5. Insert Tasks
    for (const task of tasks) {
      await dbRun(`
        INSERT INTO tasks (id, story_id, title, description, status, assignee, points)
        VALUES (?, ?, ?, ?, 'Draft', ?, ?)
      `, [task.id, task.story_id, task.title, task.description, task.assignee, task.points]);

      await dbRun(`
        INSERT INTO approval_requests (item_type, item_id, status)
        VALUES ('Task', ?, 'Pending')
      `, [task.id]);
    }

    // 6. Insert Dependencies
    for (const dep of dependencies) {
      try {
        await dbRun(`
          INSERT OR IGNORE INTO task_dependencies (task_id, depends_on_task_id)
          VALUES (?, ?)
        `, [dep.task_id, dep.depends_on_task_id]);
      } catch (e) {
        console.error("[Orchestrator] Blocked dependency seed", e);
      }
    }

    // Publish event
    await eventBus.publish("ProjectCreated", { projectId, title: project.title });
    
    await dbRun(`
      INSERT INTO notifications (type, message)
      VALUES ('Info', 'Roadmap drafted for project: ${project.title}. Awaiting user approvals.')
    `);

    return { projectId, title: project.title, structure: jsonPlan };
  }

  // Core Approval Interface
  async approveArtifact(itemType, itemId) {
    console.log(`[Orchestrator] Approving artifact: ${itemType} | ID: ${itemId}`);
    
    // 1. Update approval request
    await dbRun(`
      UPDATE approval_requests SET status = 'Approved'
      WHERE item_type = ? AND item_id = ?
    `, [itemType, itemId]);

    // 2. Update actual item status
    let tableName = "tasks";
    if (itemType === "Project") tableName = "projects";
    else if (itemType === "Epic") tableName = "epics";
    else if (itemType === "Feature") tableName = "features";
    else if (itemType === "Story") tableName = "stories";

    await dbRun(`
      UPDATE ${tableName} SET status = 'Approved' WHERE id = ?
    `, [itemId]);

    // 3. Trigger events
    if (itemType === "Task") {
      await eventBus.publish("TaskApproved", { taskId: itemId });
    }

    return { success: true, status: "Approved" };
  }

  // Get Default project layout if AI parsing fails
  getSandboxProjectPlan(idea) {
    return {
      project: { title: "AI-Drafted: " + idea, description: "Workspace roadmap generated for idea.", tech_stack: "React + SQLite", timeline: "4 Weeks" },
      epics: [ { id: "epic-sandbox-1", title: "Core Gateway Setup", description: "Implement routes and base adapters." } ],
      features: [ { id: "feat-sandbox-1", epic_id: "epic-sandbox-1", title: "API controller routes", description: "Expose REST endpoints." } ],
      stories: [ { id: "story-sandbox-1", feature_id: "feat-sandbox-1", title: "Post chat completion", template: "As a client, I want to fetch completions." } ],
      tasks: [
        { id: "task-sandbox-1", story_id: "story-sandbox-1", title: "Write express routes", description: "Route mappings.", assignee: "Developer Agent", points: 3 },
        { id: "task-sandbox-2", story_id: "story-sandbox-1", title: "Run security checks", description: "Scans.", assignee: "Security Agent", points: 2 }
      ],
      dependencies: [ { task_id: "task-sandbox-2", depends_on_task_id: "task-sandbox-1" } ]
    };
  }
}

export const orchestrator = new Orchestrator();
export default orchestrator;
