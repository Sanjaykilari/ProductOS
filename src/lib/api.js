/**
 * ProductOS API Client — single source of truth for all backend calls
 */

const BASE_URL = "http://localhost:5001";

export const api = {
  // ─── AI Chat ──────────────────────────────────────────────────────
  async chat({ prompt, agentId = "PM Agent", workspaceId = "workspace-1", projectId = null, conversationId = null }) {
    const res = await fetch(`${BASE_URL}/api/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, agentId, workspaceId, projectId, conversationId }),
    });
    if (!res.ok) throw new Error((await res.json()).error || "AI request failed");
    return res.json();
  },

  // ─── Streaming Chat (SSE) ─────────────────────────────────────────
  streamChat({ prompt, agentId = "PM Agent", conversationId = null }, onChunk, onDone, onError) {
    fetch(`${BASE_URL}/api/ai/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, agentId, conversationId }),
    }).then(async (res) => {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.error) { onError?.(data.error); return; }
            if (data.done) { onDone?.(data.text); return; }
            onChunk?.(data.chunk || "");
          } catch (e) { /* ignore parse err */ }
        }
      }
    }).catch(onError);
  },

  // ─── Orchestrator ──────────────────────────────────────────────────
  async initiateProject(idea) {
    const res = await fetch(`${BASE_URL}/api/orchestrator/initiate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idea }),
    });
    if (!res.ok) throw new Error((await res.json()).error || "Initiation failed");
    return res.json();
  },

  async approveArtifact(itemType, itemId) {
    const res = await fetch(`${BASE_URL}/api/orchestrator/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemType, itemId }),
    });
    if (!res.ok) throw new Error((await res.json()).error || "Approval failed");
    return res.json();
  },

  async getTelemetry() {
    const res = await fetch(`${BASE_URL}/api/orchestrator/telemetry`);
    return res.json();
  },

  async getAgentStates() {
    const res = await fetch(`${BASE_URL}/api/orchestrator/agent-states`);
    return res.json();
  },

  async getNotifications() {
    const res = await fetch(`${BASE_URL}/api/orchestrator/notifications`);
    return res.json();
  },

  async markNotificationsRead() {
    await fetch(`${BASE_URL}/api/orchestrator/notifications/read`, { method: "POST" });
  },

  // ─── AI models / usage ────────────────────────────────────────────
  async getModels() {
    const res = await fetch(`${BASE_URL}/api/ai/models`);
    return res.json();
  },

  async getUsage() {
    const res = await fetch(`${BASE_URL}/api/ai/usage`);
    return res.json();
  },

  // ─── Developer tools ──────────────────────────────────────────────
  async resetWorkspace() {
    const res = await fetch(`${BASE_URL}/api/developer/reset`, { method: "POST" });
    return res.json();
  },

  async getEvents() {
    const res = await fetch(`${BASE_URL}/api/developer/events`);
    return res.json();
  },

  // ─── Workspace Projects / Tasks ───────────────────────────────────
  async getProjects() {
    const res = await fetch(`${BASE_URL}/api/orchestrator/projects`);
    return res.json();
  },

  async getTasks(projectId = null) {
    const url = projectId 
      ? `${BASE_URL}/api/orchestrator/tasks?projectId=${encodeURIComponent(projectId)}`
      : `${BASE_URL}/api/orchestrator/tasks`;
    const res = await fetch(url);
    return res.json();
  },

  async createTask(taskData) {
    const res = await fetch(`${BASE_URL}/api/orchestrator/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskData),
    });
    if (!res.ok) throw new Error((await res.json()).error || "Failed to create task");
    return res.json();
  },

  async updateTaskStatus(taskId, status) {
    const res = await fetch(`${BASE_URL}/api/orchestrator/tasks/update-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, status }),
    });
    if (!res.ok) throw new Error((await res.json()).error || "Failed to update status");
    return res.json();
  },
};

export default api;
