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

  // ─── Orchestrator: Project Initiation ─────────────────────────────
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

  async approveAll(projectId) {
    const res = await fetch(`${BASE_URL}/api/orchestrator/approve-all/${encodeURIComponent(projectId)}`, {
      method: "POST",
    });
    if (!res.ok) throw new Error((await res.json()).error || "Bulk approval failed");
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

  // ─── Workspace: Projects ──────────────────────────────────────────
  async getProjects() {
    const res = await fetch(`${BASE_URL}/api/orchestrator/projects`);
    return res.json();
  },

  async getProjectFull(projectId) {
    const res = await fetch(`${BASE_URL}/api/orchestrator/project/${encodeURIComponent(projectId)}/full`);
    if (!res.ok) throw new Error((await res.json()).error || "Failed to load project");
    return res.json();
  },

  // ─── Workspace: Epics / Features / Stories ────────────────────────
  async getEpics(projectId = null) {
    const url = projectId
      ? `${BASE_URL}/api/orchestrator/epics?projectId=${encodeURIComponent(projectId)}`
      : `${BASE_URL}/api/orchestrator/epics`;
    const res = await fetch(url);
    return res.json();
  },

  async getFeatures(epicId = null) {
    const url = epicId
      ? `${BASE_URL}/api/orchestrator/features?epicId=${encodeURIComponent(epicId)}`
      : `${BASE_URL}/api/orchestrator/features`;
    const res = await fetch(url);
    return res.json();
  },

  async getStories(featureId = null) {
    const url = featureId
      ? `${BASE_URL}/api/orchestrator/stories?featureId=${encodeURIComponent(featureId)}`
      : `${BASE_URL}/api/orchestrator/stories`;
    const res = await fetch(url);
    return res.json();
  },

  // ─── Workspace: Documents ─────────────────────────────────────────
  async getDocuments(projectId = null, linkedItemId = null) {
    let url = `${BASE_URL}/api/orchestrator/documents`;
    const params = [];
    if (projectId) params.push(`projectId=${encodeURIComponent(projectId)}`);
    if (linkedItemId) params.push(`linkedItemId=${encodeURIComponent(linkedItemId)}`);
    if (params.length) url += `?${params.join("&")}`;
    const res = await fetch(url);
    return res.json();
  },

  // ─── Workspace: Tasks ─────────────────────────────────────────────
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

  // ─── Agent Assignment & Execution ─────────────────────────────────
  async assignTaskAgent(taskId, agentName) {
    const res = await fetch(`${BASE_URL}/api/orchestrator/tasks/${encodeURIComponent(taskId)}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentName }),
    });
    if (!res.ok) throw new Error((await res.json()).error || "Assignment failed");
    return res.json();
  },

  async executeTask(taskId, agentName = null, additionalInstructions = null) {
    const res = await fetch(`${BASE_URL}/api/orchestrator/tasks/${encodeURIComponent(taskId)}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentName, additionalInstructions }),
    });
    if (!res.ok) throw new Error((await res.json()).error || "Execution failed");
    return res.json();
  },

  async getTaskOutput(taskId) {
    const res = await fetch(`${BASE_URL}/api/orchestrator/tasks/${encodeURIComponent(taskId)}/output`);
    return res.json();
  },

  // ─── Collaborative Updates & Deletions ────────────────────────────
  async deleteProject(projectId) {
    const res = await fetch(`${BASE_URL}/api/orchestrator/projects/${encodeURIComponent(projectId)}`, {
      method: "DELETE"
    });
    if (!res.ok) throw new Error((await res.json()).error || "Project deletion failed");
    return res.json();
  },

  async updateProject(projectId, data) {
    const res = await fetch(`${BASE_URL}/api/orchestrator/projects/${encodeURIComponent(projectId)}/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json()).error || "Project update failed");
    return res.json();
  },

  async updateEpic(epicId, data) {
    const res = await fetch(`${BASE_URL}/api/orchestrator/epics/${encodeURIComponent(epicId)}/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json()).error || "Epic update failed");
    return res.json();
  },

  async updateFeature(featId, data) {
    const res = await fetch(`${BASE_URL}/api/orchestrator/features/${encodeURIComponent(featId)}/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json()).error || "Feature update failed");
    return res.json();
  },

  async updateStory(storyId, data) {
    const res = await fetch(`${BASE_URL}/api/orchestrator/stories/${encodeURIComponent(storyId)}/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json()).error || "Story update failed");
    return res.json();
  },

  async updateTask(taskId, data) {
    const res = await fetch(`${BASE_URL}/api/orchestrator/tasks/${encodeURIComponent(taskId)}/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json()).error || "Task update failed");
    return res.json();
  },

  async createDocument(docData) {
    const res = await fetch(`${BASE_URL}/api/orchestrator/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(docData),
    });
    if (!res.ok) throw new Error((await res.json()).error || "Failed to create document");
    return res.json();
  },

  async updateDocument(docId, data) {
    const res = await fetch(`${BASE_URL}/api/orchestrator/documents/${encodeURIComponent(docId)}/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json()).error || "Failed to update document");
    return res.json();
  },

  async deleteDocument(docId) {
    const res = await fetch(`${BASE_URL}/api/orchestrator/documents/${encodeURIComponent(docId)}`, {
      method: "DELETE"
    });
    if (!res.ok) throw new Error((await res.json()).error || "Failed to delete document");
    return res.json();
  },
};

export default api;
