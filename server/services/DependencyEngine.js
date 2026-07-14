import { dbAll, dbGet } from "../db/database.js";

export class DependencyEngine {
  // Check if a task has active, uncompleted blockers
  static async hasActiveBlockers(taskId) {
    const blockers = await dbAll(`
      SELECT t.* FROM task_dependencies d
      JOIN tasks t ON d.depends_on_task_id = t.id
      WHERE d.task_id = ?
    `, [taskId]);

    // A blocker is active if its status is NOT 'Done' and NOT 'Completed'
    const activeBlockers = blockers.filter(t => t.status !== "Done" && t.status !== "Completed");
    return activeBlockers.length > 0;
  }

  // Detect circular dependency loops (DFS algorithm)
  // Returns true if circular dependency detected, false otherwise.
  static async detectCircularDependency(taskId, dependsOnTaskId) {
    const visited = new Set();

    // Helper DFS function
    const dfs = async (currentId) => {
      if (currentId === taskId) {
        return true; // We looped back to the source task!
      }
      if (visited.has(currentId)) {
        return false;
      }
      visited.add(currentId);

      // Fetch what currentId depends on
      const deps = await dbAll(`
        SELECT depends_on_task_id FROM task_dependencies
        WHERE task_id = ?
      `, [currentId]);

      for (const dep of deps) {
        if (await dfs(dep.depends_on_task_id)) {
          return true;
        }
      }
      return false;
    };

    // Start DFS search from dependsOnTaskId
    return await dfs(dependsOnTaskId);
  }
}
