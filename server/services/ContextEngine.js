export class ContextEngine {
  // Aggregate metadata for workspace or project
  static async getContext(params = {}) {
    const { 
      workspaceId = "default-workspace",
      projectId = "core-os-project",
      sprintId = "sprint-4",
      taskId = null 
    } = params;

    const sections = [];

    // Core Business rules / guidelines context
    sections.push(`[Business Rules]
- Platform: ProductOS
- Standards: 8px grid alignment, round borders (12-16px).
- Styling: Custom CSS variables for theme stability. No unvalidated inline styles.`);

    // Active workspace context
    sections.push(`[Workspace State]
- Workspace: ${workspaceId}
- Current Active Sprint: ${sprintId} (due in 5 days)
- Stack: React + Vite + Vanilla CSS`);

    // Target task context
    if (taskId) {
      sections.push(`[Task context - ID: TASK-${taskId}]
- Subtasks checklist completeness: 1/3 completed.
- Assigned Employee: DevAgent
- Target definition of done: unit tests pass 80% coverage check.`);
    }

    // Join sections as markdown output
    return sections.join("\n\n");
  }
}
