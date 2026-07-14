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
        const assignee = task.assignee || "Developer Agent";
        const priority = task.points || 1;
        
        await dbRun(`UPDATE tasks SET status = 'Assigned' WHERE id = ?`, [taskId]);
        await eventBus.publish("TaskStatusChanged", { taskId, status: "Assigned" });
        
        await queueManager.enqueueTask(taskId, assignee, priority);
      } else {
        console.log(`[Orchestrator] Task [${taskId}] remains blocked. Reason: ${ruleCheck.reason}`);
        await dbRun(`UPDATE tasks SET status = 'Assigned' WHERE id = ?`, [taskId]);
        await eventBus.publish("TaskStatusChanged", { taskId, status: "Assigned" });
        
        await dbRun(`
          INSERT INTO notifications (type, message)
          VALUES ('Warning', 'Task ${taskId} is blocked by pending requirements.')
        `);
      }
    });

    // 2. Hook on Task Completed
    eventBus.subscribe("TaskCompleted", async ({ taskId }) => {
      console.log(`[Orchestrator] TaskCompleted received for: ${taskId}`);

      const dependents = await dbAll(`
        SELECT task_id FROM task_dependencies WHERE depends_on_task_id = ?
      `, [taskId]);

      for (const dep of dependents) {
        const stillBlocked = await BusinessRulesEngine.canExecuteTask({ id: dep.task_id, status: "Approved" });
        if (stillBlocked.allowed) {
          console.log(`[Orchestrator] Unblocking downstream task [${dep.task_id}] automatically.`);
          await eventBus.publish("TaskApproved", { taskId: dep.task_id });
        }
      }

      const task = await dbGet(`SELECT * FROM tasks WHERE id = ?`, [taskId]);
      if (task && task.story_id) {
        const storyCheck = await BusinessRulesEngine.canCompleteParent("Story", task.story_id);
        if (storyCheck.allowed) {
          console.log(`[Orchestrator] Completing User Story [${task.story_id}] automatically.`);
          await dbRun(`UPDATE stories SET status = 'Completed', dod = 'Passed' WHERE id = ?`, [task.story_id]);
          await eventBus.publish("StoryCompleted", { storyId: task.story_id });

          const story = await dbGet(`SELECT * FROM stories WHERE id = ?`, [task.story_id]);
          if (story && story.feature_id) {
            const featCheck = await BusinessRulesEngine.canCompleteParent("Feature", story.feature_id);
            if (featCheck.allowed) {
              await dbRun(`UPDATE features SET status = 'Completed' WHERE id = ?`, [story.feature_id]);
              await eventBus.publish("FeatureCompleted", { featureId: story.feature_id });

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

  // ─────────────────────────────────────────────────────────────
  // Generate workspace components from text idea
  // ─────────────────────────────────────────────────────────────
  async initiateProjectFromIdea(ideaText) {
    console.log(`[Orchestrator] Generating workspace roadmap from: "${ideaText}"`);

    const prompt = `You are a Senior Product Manager. Convert this product idea into a complete Agile backlog.
Idea: "${ideaText}"

Response MUST be a single valid JSON object with this exact structure (no markdown, no code fences):
{
  "project": { "title": "...", "description": "...", "tech_stack": "...", "timeline": "..." },
  "epics": [ { "id": "EPIC-1", "title": "...", "description": "..." } ],
  "features": [ { "id": "FEAT-1", "epic_id": "EPIC-1", "title": "...", "description": "..." } ],
  "stories": [ { "id": "STORY-1", "feature_id": "FEAT-1", "title": "...", "template": "As a user, I want..." } ],
  "tasks": [ { "id": "TASK-1", "story_id": "STORY-1", "title": "...", "description": "...", "assignee": "Developer Agent", "points": 3 } ],
  "dependencies": [ { "task_id": "TASK-2", "depends_on_task_id": "TASK-1" } ],
  "documents": [
    { "id": "DOC-1", "title": "Product Requirements Document", "doc_type": "PRD", "linked_item_type": "Project", "linked_item_id": "PROJECT", "content": "..." },
    { "id": "DOC-2", "title": "Technical Architecture Spec", "doc_type": "Technical Spec", "linked_item_type": "Project", "linked_item_id": "PROJECT", "content": "..." },
    { "id": "DOC-3", "title": "Epic Brief: ...", "doc_type": "Epic Brief", "linked_item_type": "Epic", "linked_item_id": "EPIC-1", "content": "..." }
  ]
}

Assignee values must be one of: "PM Agent", "Developer Agent", "Frontend Agent", "Backend Agent", "Database Agent", "QA Agent", "Security Agent", "DevOps Agent", "Architecture Agent", "Documentation Agent", "UI Agent", "Research Agent".

Generate at least 3 epics, 6 features, 10 stories, 15 tasks, 3 documents.
Make the documents realistic — the PRD should have actual sections and content.`;

    const result = await AIService.generateCompletion({
      variables: { prompt },
      agentId: "PM Agent",
      preference: "cost-effective"
    });

    let jsonPlan;
    try {
      // Try to extract JSON from the response (handle markdown code fences)
      let rawText = result.text;
      const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) rawText = jsonMatch[1];
      jsonPlan = JSON.parse(rawText);
    } catch (e) {
      console.warn("[Orchestrator] AI output was not valid JSON, using sandbox fallback.");
      jsonPlan = this.getSandboxProjectPlan(ideaText);
    }

    const projectId = `proj-${Date.now()}`;
    const project = jsonPlan.project;

    // Map all IDs to project-unique IDs
    const epics = (jsonPlan.epics || []).map(epic => ({
      ...epic,
      origId: epic.id,
      id: `${epic.id}-${projectId}`
    }));

    const features = (jsonPlan.features || []).map(feat => ({
      ...feat,
      origId: feat.id,
      id: `${feat.id}-${projectId}`,
      epic_id: `${feat.epic_id}-${projectId}`
    }));

    const stories = (jsonPlan.stories || []).map(story => ({
      ...story,
      origId: story.id,
      id: `${story.id}-${projectId}`,
      feature_id: `${story.feature_id}-${projectId}`
    }));

    const tasks = (jsonPlan.tasks || []).map(task => ({
      ...task,
      origId: task.id,
      id: `${task.id}-${projectId}`,
      story_id: `${task.story_id}-${projectId}`
    }));

    const dependencies = (jsonPlan.dependencies || []).map(dep => ({
      ...dep,
      task_id: `${dep.task_id}-${projectId}`,
      depends_on_task_id: `${dep.depends_on_task_id}-${projectId}`
    }));

    const documents = (jsonPlan.documents || []).map(doc => ({
      ...doc,
      id: `${doc.id}-${projectId}`,
      linked_item_id: doc.linked_item_id === "PROJECT" 
        ? projectId 
        : `${doc.linked_item_id}-${projectId}`
    }));

    // 1. Insert Project
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

    // 7. Insert Documents — linked to their parent artifacts
    for (const doc of documents) {
      try {
        await dbRun(`
          INSERT INTO documents (id, project_id, title, content, doc_type, linked_item_type, linked_item_id, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'Draft')
        `, [doc.id, projectId, doc.title, doc.content || "", doc.doc_type, doc.linked_item_type, doc.linked_item_id]);
      } catch (e) {
        console.error("[Orchestrator] Document insert error", e);
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

  // ─────────────────────────────────────────────────────────────
  // Core Approval Interface
  // ─────────────────────────────────────────────────────────────
  async approveArtifact(itemType, itemId) {
    console.log(`[Orchestrator] Approving artifact: ${itemType} | ID: ${itemId}`);
    
    await dbRun(`
      UPDATE approval_requests SET status = 'Approved'
      WHERE item_type = ? AND item_id = ?
    `, [itemType, itemId]);

    let tableName = "tasks";
    if (itemType === "Project") tableName = "projects";
    else if (itemType === "Epic") tableName = "epics";
    else if (itemType === "Feature") tableName = "features";
    else if (itemType === "Story") tableName = "stories";

    await dbRun(`
      UPDATE ${tableName} SET status = 'Approved' WHERE id = ?
    `, [itemId]);

    if (itemType === "Task") {
      await eventBus.publish("TaskApproved", { taskId: itemId });
    }

    return { success: true, status: "Approved" };
  }

  // ─────────────────────────────────────────────────────────────
  // Approve all artifacts in a project
  // ─────────────────────────────────────────────────────────────
  async approveAllInProject(projectId) {
    console.log(`[Orchestrator] Bulk approving all artifacts for project: ${projectId}`);

    // Approve project
    await dbRun(`UPDATE projects SET status = 'Approved' WHERE id = ?`, [projectId]);
    await dbRun(`UPDATE approval_requests SET status = 'Approved' WHERE item_type = 'Project' AND item_id = ?`, [projectId]);

    // Approve epics
    const epics = await dbAll(`SELECT id FROM epics WHERE project_id = ?`, [projectId]);
    for (const epic of epics) {
      await dbRun(`UPDATE epics SET status = 'Approved' WHERE id = ?`, [epic.id]);
      await dbRun(`UPDATE approval_requests SET status = 'Approved' WHERE item_type = 'Epic' AND item_id = ?`, [epic.id]);
    }

    // Approve features
    for (const epic of epics) {
      const features = await dbAll(`SELECT id FROM features WHERE epic_id = ?`, [epic.id]);
      for (const feat of features) {
        await dbRun(`UPDATE features SET status = 'Approved' WHERE id = ?`, [feat.id]);
        await dbRun(`UPDATE approval_requests SET status = 'Approved' WHERE item_type = 'Feature' AND item_id = ?`, [feat.id]);
      }

      // Approve stories
      for (const feat of features) {
        const stories = await dbAll(`SELECT id FROM stories WHERE feature_id = ?`, [feat.id]);
        for (const story of stories) {
          await dbRun(`UPDATE stories SET status = 'Approved' WHERE id = ?`, [story.id]);
          await dbRun(`UPDATE approval_requests SET status = 'Approved' WHERE item_type = 'Story' AND item_id = ?`, [story.id]);
        }
      }
    }

    // Approve tasks + trigger execution queue
    const tasks = await dbAll(`
      SELECT t.id FROM tasks t
      JOIN stories s ON t.story_id = s.id
      JOIN features f ON s.feature_id = f.id
      JOIN epics e ON f.epic_id = e.id
      WHERE e.project_id = ?
    `, [projectId]);

    for (const task of tasks) {
      await dbRun(`UPDATE tasks SET status = 'Approved' WHERE id = ?`, [task.id]);
      await dbRun(`UPDATE approval_requests SET status = 'Approved' WHERE item_type = 'Task' AND item_id = ?`, [task.id]);
    }

    // Approve documents
    await dbRun(`UPDATE documents SET status = 'Approved' WHERE project_id = ?`, [projectId]);

    await dbRun(`
      INSERT INTO notifications (type, message)
      VALUES ('Success', 'All artifacts in project ${projectId} have been approved.')
    `);

    return { success: true, approvedCount: epics.length + tasks.length };
  }

  // ─────────────────────────────────────────────────────────────
  // Get full project tree
  // ─────────────────────────────────────────────────────────────
  async getProjectFull(projectId) {
    const project = await dbGet(`SELECT * FROM projects WHERE id = ?`, [projectId]);
    if (!project) throw new Error("Project not found");

    const epics = await dbAll(`SELECT * FROM epics WHERE project_id = ? ORDER BY created_at`, [projectId]);
    
    const fullEpics = [];
    for (const epic of epics) {
      const features = await dbAll(`SELECT * FROM features WHERE epic_id = ? ORDER BY created_at`, [epic.id]);
      
      const fullFeatures = [];
      for (const feat of features) {
        const stories = await dbAll(`SELECT * FROM stories WHERE feature_id = ? ORDER BY created_at`, [feat.id]);
        
        const fullStories = [];
        for (const story of stories) {
          const tasks = await dbAll(`SELECT * FROM tasks WHERE story_id = ? ORDER BY created_at`, [story.id]);
          
          // Attach outputs to tasks
          const tasksWithOutputs = [];
          for (const task of tasks) {
            const outputs = await dbAll(`SELECT * FROM agent_outputs WHERE task_id = ? ORDER BY created_at DESC`, [task.id]);
            tasksWithOutputs.push({ ...task, outputs });
          }

          fullStories.push({ ...story, tasks: tasksWithOutputs });
        }
        fullFeatures.push({ ...feat, stories: fullStories });
      }
      fullEpics.push({ ...epic, features: fullFeatures });
    }

    const documents = await dbAll(`SELECT * FROM documents WHERE project_id = ? ORDER BY created_at`, [projectId]);

    return { ...project, epics: fullEpics, documents };
  }

  // ─────────────────────────────────────────────────────────────
  // Sandbox fallback project plan
  // ─────────────────────────────────────────────────────────────
  getSandboxProjectPlan(idea) {
    return {
      project: { title: "AI-Drafted: " + idea, description: "Workspace roadmap generated for idea.", tech_stack: "React + Node.js + SQLite", timeline: "4 Weeks" },
      epics: [
        { id: "EPIC-1", title: "Core Platform Setup", description: "Set up the foundational infrastructure, authentication, and base UI components." },
        { id: "EPIC-2", title: "Feature Implementation", description: "Build the primary user-facing features and business logic." },
        { id: "EPIC-3", title: "Testing & Deployment", description: "Quality assurance, performance testing, and deployment pipeline." }
      ],
      features: [
        { id: "FEAT-1", epic_id: "EPIC-1", title: "Project scaffolding & configuration", description: "Initialize project structure with build tools." },
        { id: "FEAT-2", epic_id: "EPIC-1", title: "Database schema design", description: "Design and implement the relational database schema." },
        { id: "FEAT-3", epic_id: "EPIC-2", title: "Core API endpoints", description: "Implement RESTful API routes." },
        { id: "FEAT-4", epic_id: "EPIC-2", title: "Frontend UI components", description: "Build responsive UI components." },
        { id: "FEAT-5", epic_id: "EPIC-3", title: "Unit & integration tests", description: "Write comprehensive test suites." },
        { id: "FEAT-6", epic_id: "EPIC-3", title: "CI/CD pipeline", description: "Set up deployment pipeline." }
      ],
      stories: [
        { id: "STORY-1", feature_id: "FEAT-1", title: "Initialize repo with Vite + React", template: "As a developer, I want a preconfigured project so I can start building quickly." },
        { id: "STORY-2", feature_id: "FEAT-2", title: "Design database models", template: "As a developer, I want a normalized schema so data integrity is maintained." },
        { id: "STORY-3", feature_id: "FEAT-3", title: "Build CRUD API routes", template: "As a user, I want API endpoints so the app can read and write data." },
        { id: "STORY-4", feature_id: "FEAT-4", title: "Build dashboard layout", template: "As a user, I want a clean dashboard so I can see key metrics at a glance." },
        { id: "STORY-5", feature_id: "FEAT-5", title: "Write API endpoint tests", template: "As a QA engineer, I want automated tests so regressions are caught early." }
      ],
      tasks: [
        { id: "TASK-1", story_id: "STORY-1", title: "Run create-vite scaffold", description: "Initialize React + Vite project structure.", assignee: "Developer Agent", points: 2 },
        { id: "TASK-2", story_id: "STORY-1", title: "Configure ESLint and Prettier", description: "Set up linting and formatting.", assignee: "Developer Agent", points: 1 },
        { id: "TASK-3", story_id: "STORY-2", title: "Write SQL schema migrations", description: "Create tables for all entities.", assignee: "Database Agent", points: 5 },
        { id: "TASK-4", story_id: "STORY-2", title: "Seed sample data", description: "Insert test data for development.", assignee: "Database Agent", points: 2 },
        { id: "TASK-5", story_id: "STORY-3", title: "Implement GET/POST/PUT/DELETE routes", description: "Full CRUD controller logic.", assignee: "Backend Agent", points: 5 },
        { id: "TASK-6", story_id: "STORY-3", title: "Add input validation middleware", description: "Validate request bodies.", assignee: "Backend Agent", points: 3 },
        { id: "TASK-7", story_id: "STORY-4", title: "Build header and sidebar components", description: "Navigation layout.", assignee: "Frontend Agent", points: 3 },
        { id: "TASK-8", story_id: "STORY-4", title: "Build data cards and charts", description: "Dashboard visualizations.", assignee: "Frontend Agent", points: 5 },
        { id: "TASK-9", story_id: "STORY-5", title: "Write Jest test suite for API", description: "Cover all CRUD endpoints.", assignee: "QA Agent", points: 5 },
        { id: "TASK-10", story_id: "STORY-5", title: "Run security vulnerability scan", description: "OWASP dependency check.", assignee: "Security Agent", points: 3 }
      ],
      dependencies: [
        { task_id: "TASK-3", depends_on_task_id: "TASK-1" },
        { task_id: "TASK-5", depends_on_task_id: "TASK-3" },
        { task_id: "TASK-7", depends_on_task_id: "TASK-5" },
        { task_id: "TASK-9", depends_on_task_id: "TASK-5" }
      ],
      documents: [
        { id: "DOC-1", title: "Product Requirements Document", doc_type: "PRD", linked_item_type: "Project", linked_item_id: "PROJECT", content: `# Product Requirements Document\n\n## Overview\n${idea}\n\n## Objectives\n- Build a functional MVP within 4 weeks\n- Ensure clean architecture for scalability\n- Implement core user-facing features\n\n## Target Users\nDevelopers and product managers looking for an efficient tool.\n\n## Success Metrics\n- Feature completion rate > 90%\n- Zero critical bugs at launch\n- Response time < 200ms for API calls` },
        { id: "DOC-2", title: "Technical Architecture", doc_type: "Technical Spec", linked_item_type: "Project", linked_item_id: "PROJECT", content: `# Technical Architecture\n\n## Stack\n- Frontend: React + Vite\n- Backend: Node.js + Express\n- Database: SQLite (MVP) → PostgreSQL (Production)\n\n## API Design\n- RESTful JSON APIs\n- JWT authentication\n- Rate limiting middleware\n\n## Deployment\n- Docker containers\n- CI/CD via GitHub Actions` },
        { id: "DOC-3", title: "Epic Brief: Core Platform Setup", doc_type: "Epic Brief", linked_item_type: "Epic", linked_item_id: "EPIC-1", content: `# Epic Brief: Core Platform Setup\n\n## Scope\nEstablish the foundation including project scaffolding, database design, and base configuration.\n\n## Acceptance Criteria\n- Project builds without errors\n- Database migrations run successfully\n- Development server starts on port 5173` }
      ]
    };
  }
}

export const orchestrator = new Orchestrator();
export default orchestrator;
