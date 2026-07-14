import { dbAll, dbGet } from "../db/database.js";
import { DependencyEngine } from "./DependencyEngine.js";

export class BusinessRulesEngine {
  // Can a task enter the execution queue?
  static async canExecuteTask(task) {
    // Rule 1: Cannot execute rejected or archived tasks
    if (task.status === "Rejected" || task.status === "Archived") {
      return { allowed: false, reason: "Task has been rejected or archived." };
    }

    // Rule 2: Cannot execute if task has active blockers
    const isBlocked = await DependencyEngine.hasActiveBlockers(task.id);
    if (isBlocked) {
      return { allowed: false, reason: "Task is blocked by unfinished dependencies." };
    }

    return { allowed: true };
  }

  // Can a parent item (Story, Feature, Epic) be marked Completed?
  static async canCompleteParent(itemType, itemId) {
    if (itemType === "Story") {
      // Cannot complete story if child tasks remain open
      const openTasks = await dbAll(`
        SELECT id FROM tasks WHERE story_id = ? AND status NOT IN ('Done', 'Completed')
      `, [itemId]);
      if (openTasks.length > 0) {
        return { allowed: false, reason: "Story has open child tasks." };
      }
    } else if (itemType === "Feature") {
      // Cannot complete feature if child stories remain open
      const openStories = await dbAll(`
        SELECT id FROM stories WHERE feature_id = ? AND status NOT IN ('Done', 'Completed')
      `, [itemId]);
      if (openStories.length > 0) {
        return { allowed: false, reason: "Feature has open user stories." };
      }
    } else if (itemType === "Epic") {
      // Cannot complete epic if child features remain open
      const openFeatures = await dbAll(`
        SELECT id FROM features WHERE epic_id = ? AND status NOT IN ('Done', 'Completed')
      `, [itemId]);
      if (openFeatures.length > 0) {
        return { allowed: false, reason: "Epic has open features." };
      }
    }

    return { allowed: true };
  }

  // Can we run build deployment?
  static async canDeployProject(projectId) {
    // Rule: Cannot deploy if QA failed or is active and uncompleted
    const qaFailures = await dbAll(`
      SELECT s.id FROM stories s
      JOIN features f ON s.feature_id = f.id
      JOIN epics e ON f.epic_id = e.id
      WHERE e.project_id = ? AND s.dod = 'Failed'
    `, [projectId]);

    if (qaFailures.length > 0) {
      return { allowed: false, reason: "Project has failing QA stories in Definition of Done checklist." };
    }

    return { allowed: true };
  }
}
