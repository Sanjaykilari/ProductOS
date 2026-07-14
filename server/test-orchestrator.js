import { initDatabase, dbGet, dbAll } from "./db/database.js";
import { orchestrator } from "./services/Orchestrator.js";
import { eventBus } from "./services/EventBus.js";

async function testOrchestrator() {
  console.log("=== ProductOS Orchestrator Integration Test ===");

  try {
    // 1. Initialize and Seed SQLite database
    await initDatabase();

    // 2. Fetch the blocked task: 'task-hover-tooltip'
    const initialBlocked = await dbGet(`SELECT status FROM tasks WHERE id = 'task-hover-tooltip'`);
    console.log(`🔍 Initial state of 'task-hover-tooltip': [${initialBlocked.status}]`);

    // 3. Approve parent task: 'task-svg-bars'
    console.log("👉 Approving blocker task: 'task-svg-bars'...");
    await orchestrator.approveArtifact("Task", "task-svg-bars");

    // 4. Wait for event loop to process the queue (simulation takes ~4.6s)
    console.log("⏳ Awaiting Event Bus propagation & QueueManager processing...");
    await new Promise(r => setTimeout(r, 5500));

    // 5. Verify the states
    const finalParent = await dbGet(`SELECT status FROM tasks WHERE id = 'task-svg-bars'`);
    const finalBlocked = await dbGet(`SELECT status FROM tasks WHERE id = 'task-hover-tooltip'`);
    const finalStory = await dbGet(`SELECT status, dod FROM stories WHERE id = 'story-chart-interaction'`);

    console.log(`📊 Final state of 'task-svg-bars': [${finalParent.status}]`);
    console.log(`📊 Final state of 'task-hover-tooltip': [${finalBlocked.status}]`);
    console.log(`📊 Final state of User Story: [${finalStory.status}] | DoD: [${finalStory.dod}]`);

    if (finalParent.status === "Completed" && finalBlocked.status === "Completed") {
      console.log("✅ SUCCESS: Event Bus successfully unblocked and executed downstream task.");
    } else {
      throw new Error(`Orchestration logic failed. Expected Completed/Completed, got [${finalParent.status}]/[${finalBlocked.status}].`);
    }

    if (finalStory.status === "Completed" && finalStory.dod === "Passed") {
      console.log("✅ SUCCESS: Completeness gates automatically finalized User Story.");
    } else {
      throw new Error(`Completeness gates failed. Expected story status Completed, got [${finalStory.status}].`);
    }

    console.log("=================================================");
    console.log("🎉 ORCHESTRATION ENGINE & BUSINESS RULES VERIFIED.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Orchestrator Test Failed:", err.message);
    process.exit(1);
  }
}

testOrchestrator();
