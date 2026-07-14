import { dbRun, dbAll, dbGet } from "../db/database.js";
import { agentFramework } from "./AgentFramework.js";
import { eventBus } from "./EventBus.js";

class QueueManager {
  constructor() {
    this.simulateNextFail = false;
    this.isProcessing = false;
  }

  // Push task to execution queue
  async enqueueTask(taskId, agentId, priority = 1) {
    console.log(`[QueueManager] Enqueuing task [${taskId}] for agent [${agentId}]`);
    try {
      await dbRun(`
        INSERT OR REPLACE INTO execution_queue (task_id, agent_id, priority, status, retry_count)
        VALUES (?, ?, ?, 'Pending', 0)
      `, [taskId, agentId, priority]);
      
      // Notify bus
      eventBus.publish("QueueJobAdded", { taskId, agentId });
      
      // Attempt immediate processing
      this.triggerProcessing();
    } catch (err) {
      console.error("[QueueManager] Failed to enqueue task", err);
    }
  }

  // Set next job failure simulation
  setSimulateFail(flag) {
    this.simulateNextFail = flag;
    console.log(`[QueueManager] Simulation fail toggle set to: ${flag}`);
  }

  // Async loop trigger
  triggerProcessing() {
    if (this.isProcessing) return;
    this.isProcessing = true;
    
    // Run async loop
    setImmediate(async () => {
      try {
        await this.processQueue();
      } catch (err) {
        console.error("[QueueManager] Queue loop exception", err);
      } finally {
        this.isProcessing = false;
      }
    });
  }

  // Process all pending jobs sequentially
  async processQueue() {
    let job = await this.getNextJob();
    
    while (job) {
      console.log(`[QueueManager] Processing job ID: ${job.id} | Task: ${job.task_id}`);
      
      // 1. Update queue status
      await dbRun(`
        UPDATE execution_queue 
        SET status = 'Processing', updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, [job.id]);

      // 2. Fetch full task details
      const task = await dbGet(`SELECT * FROM tasks WHERE id = ?`, [job.task_id]);
      
      try {
        // 3. Move task state to Planning/Executing
        await dbRun(`UPDATE tasks SET status = 'Executing' WHERE id = ?`, [job.task_id]);
        
        // Publish status event
        eventBus.publish("TaskStatusChanged", { taskId: job.task_id, status: "Executing" });

        // Determine if we should simulate failure
        const shouldFail = this.simulateNextFail;
        if (shouldFail) {
          this.simulateNextFail = false; // Reset toggle
        }

        // 4. Run Agent Execution
        await agentFramework.runAgentTask(job.agent_id, task, shouldFail);

        // 5. Complete queue item & task
        await dbRun(`
          UPDATE execution_queue 
          SET status = 'Completed', updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `, [job.id]);

        await dbRun(`UPDATE tasks SET status = 'Completed' WHERE id = ?`, [job.task_id]);
        
        // Publish event
        await eventBus.publish("TaskCompleted", { taskId: job.task_id, agentId: job.agent_id });
        await eventBus.publish("TaskStatusChanged", { taskId: job.task_id, status: "Completed" });

      } catch (err) {
        // 6. Handle failure, retry
        const retryCount = job.retry_count + 1;
        const maxRetries = 2;

        if (retryCount <= maxRetries) {
          console.warn(`[QueueManager] Job ${job.id} failed, enqueuing retry #${retryCount}. Error: ${err.message}`);
          await dbRun(`
            UPDATE execution_queue 
            SET status = 'Pending', retry_count = ?, last_error = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `, [retryCount, err.message, job.id]);
          
          await dbRun(`UPDATE tasks SET status = 'Assigned' WHERE id = ?`, [job.task_id]);
          eventBus.publish("TaskStatusChanged", { taskId: job.task_id, status: "Assigned" });
        } else {
          console.error(`[QueueManager] Job ${job.id} permanently failed after ${retryCount} retries.`);
          await dbRun(`
            UPDATE execution_queue 
            SET status = 'Failed', last_error = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `, [err.message, job.id]);
          
          await dbRun(`UPDATE tasks SET status = 'Failed' WHERE id = ?`, [job.task_id]);
          eventBus.publish("TaskStatusChanged", { taskId: job.task_id, status: "Failed" });
        }
      }

      // Check next job
      job = await this.getNextJob();
    }
  }

  // Fetch highest priority pending job
  async getNextJob() {
    return await dbGet(`
      SELECT * FROM execution_queue 
      WHERE status = 'Pending' 
      ORDER BY priority DESC, created_at ASC 
      LIMIT 1
    `);
  }
}

export const queueManager = new QueueManager();
export default queueManager;
