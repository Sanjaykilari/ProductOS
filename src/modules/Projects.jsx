import React, { useState, useEffect } from "react";
import {
  Folder, CheckCircle, RefreshCw, ThumbsUp, ChevronRight, ChevronDown,
  FileText, Layers, Code, Zap, Play, Eye, X, Clock, Bot, Shield,
  Cpu, Database, Bug, Rocket, BookOpen, Paintbrush, Search, Edit3, Trash2, Globe, Send, Plus
} from "lucide-react";
import api from "../lib/api";

const AGENT_LIST = [
  "PM Agent", "Developer Agent", "Frontend Agent", "Backend Agent",
  "Database Agent", "QA Agent", "Security Agent", "DevOps Agent",
  "Architecture Agent", "Documentation Agent", "UI Agent", "Research Agent"
];

const STATUS_COLORS = {
  "Draft": { bg: "#64748b22", color: "#94a3b8", border: "#64748b44" },
  "Approved": { bg: "#10b98122", color: "#10b981", border: "#10b98144" },
  "Assigned": { bg: "#f59e0b22", color: "#f59e0b", border: "#f59e0b44" },
  "Executing": { bg: "#6366f122", color: "#6366f1", border: "#6366f144" },
  "Completed": { bg: "#10b98122", color: "#10b981", border: "#10b98144" },
  "Failed": { bg: "#ef444422", color: "#ef4444", border: "#ef444444" },
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS["Draft"];
  return (
    <span style={{
      fontSize: "10px", fontWeight: "600", padding: "2px 8px",
      borderRadius: "999px", background: s.bg, color: s.color,
      border: `1px solid ${s.border}`
    }}>{status}</span>
  );
}

// Subcomponent to avoid React Hook Rules violation (Hooks in loops)
function ProjectTaskRow({ task, onExecute, onApprove, isExecuting, onStartEdit, onPreview }) {
  const [assignee, setAssignee] = useState(task.assignee || "Developer Agent");

  const handleAssign = async (agentName) => {
    setAssignee(agentName);
    try {
      await api.assignTaskAgent(task.id, agentName);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border-secondary)",
      borderRadius: "8px", padding: "10px 14px", marginBottom: "6px"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-primary)" }}>{task.title}</span>
            <StatusBadge status={task.status} />
          </div>
          {task.description && (
            <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "3px 0 0", lineHeight: "1.4" }}>
              {task.description}
            </p>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {/* Edit button */}
          <button onClick={() => onStartEdit("Task", task)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px" }}>
            <Edit3 size={11} />
          </button>

          {/* Assignee */}
          <select
            value={assignee}
            onChange={e => handleAssign(e.target.value)}
            style={{
              fontSize: "10px", padding: "4px 6px", borderRadius: "6px",
              background: "var(--bg-hover)", border: "1px solid var(--border-primary)",
              color: "var(--text-secondary)", cursor: "pointer", minWidth: "120px"
            }}
          >
            {AGENT_LIST.map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          {/* Approve */}
          {task.status === "Draft" && (
            <button onClick={() => onApprove(task.id)} className="btn btn-sm" style={{
              background: "#10b98122", border: "1px solid #10b98144", color: "#10b981",
              fontSize: "10px", padding: "4px 8px", borderRadius: "6px", cursor: "pointer",
              display: "flex", alignItems: "center", gap: "3px"
            }}>
              <ThumbsUp size={10} /> Approve
            </button>
          )}

          {/* Execute Task (triggers instructions modal override) */}
          {(task.status === "Approved" || task.status === "Assigned" || task.status === "Draft") && (
            <button
              onClick={() => onExecute(task, assignee)}
              disabled={isExecuting}
              className="btn btn-sm"
              style={{
                background: isExecuting ? "var(--bg-hover)" : "linear-gradient(135deg, #6366f1, #7c3aed)",
                border: "none", color: isExecuting ? "var(--text-muted)" : "#fff",
                fontSize: "10px", padding: "4px 10px", borderRadius: "6px",
                cursor: isExecuting ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: "3px"
              }}
            >
              {isExecuting ? <><RefreshCw size={10} style={{ animation: "spin 1s linear infinite" }} /> Running…</> : <><Play size={10} /> Execute</>}
            </button>
          )}

          {/* View Build (Browser Preview) & output */}
          {task.status === "Completed" && (
            <div style={{ display: "flex", gap: "4px" }}>
              <button onClick={() => onPreview(task)} className="btn btn-sm" style={{
                background: "linear-gradient(135deg, #3b82f61a, #2563eb1a)", border: "1px solid #2563eb44",
                color: "#2563eb", fontSize: "10px", padding: "4px 8px",
                borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "3px"
              }}>
                <Globe size={10} /> View Build
              </button>
              <button onClick={() => onPreview(task)} className="btn btn-sm" style={{
                background: "var(--bg-hover)", border: "1px solid var(--border-primary)",
                color: "var(--text-secondary)", fontSize: "10px", padding: "4px 8px",
                borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "3px"
              }}>
                <Eye size={10} /> Output
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Projects({ onNavigateToDoc }) {
  const [projects, setProjects] = useState([]);
  const [selectedProj, setSelectedProj] = useState(null);
  const [fullProject, setFullProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Expanded nodes state
  const [expandedEpics, setExpandedEpics] = useState({});
  const [expandedFeatures, setExpandedFeatures] = useState({});
  const [expandedStories, setExpandedStories] = useState({});

  // Editing state for Collaborative Backlog
  const [editingItem, setEditingItem] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPoints, setEditPoints] = useState(3);
  const [editAssignee, setEditAssignee] = useState("Developer Agent");
  const [editTemplate, setEditTemplate] = useState("");

  // Pre-execution instruction override modal
  const [overrideTask, setOverrideTask] = useState(null);
  const [additionalInstructions, setAdditionalInstructions] = useState("");

  // Simulated browser preview modal
  const [previewTask, setPreviewTask] = useState(null);
  const [previewOutput, setPreviewOutput] = useState("");
  const [previewTab, setPreviewTab] = useState("app");

  // Task execution loading states
  const [executingTasks, setExecutingTasks] = useState({});

  useEffect(() => { loadProjects(); }, []);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const list = await api.getProjects();
      setProjects(list);
      if (list.length > 0) {
        // Fallback to maintain selection if possible
        const target = selectedProj ? (list.find(p => p.id === selectedProj.id) || list[0]) : list[0];
        setSelectedProj(target);
        loadFullProject(target.id);
      } else {
        setSelectedProj(null);
        setFullProject(null);
      }
    } catch (err) {
      console.error("Failed to load projects", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFullProject = async (projectId) => {
    try {
      const full = await api.getProjectFull(projectId);
      setFullProject(full);
      // Auto-expand first epic
      if (full.epics?.length) {
        setExpandedEpics(prev => ({ ...prev, [full.epics[0].id]: true }));
      }
    } catch (err) {
      console.error("Failed to load full project", err);
    }
  };

  const selectProject = (proj) => {
    setSelectedProj(proj);
    setFullProject(null);
    loadFullProject(proj.id);
  };

  const handleApproveAll = async () => {
    if (!selectedProj) return;
    setIsApproving(true);
    try {
      await api.approveAll(selectedProj.id);
      await loadProjects();
      loadFullProject(selectedProj.id);
    } catch (err) {
      alert(`Approval failed: ${err.message}`);
    } finally {
      setIsApproving(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!selectedProj) return;
    if (!confirm(`⚠️ WARNING: Are you sure you want to delete "${selectedProj.title}"?\nThis will permanently delete all related Epics, Features, Stories, Tasks, and Documents.`)) return;
    setIsDeleting(true);
    try {
      await api.deleteProject(selectedProj.id);
      setSelectedProj(null);
      setFullProject(null);
      await loadProjects();
    } catch (err) {
      alert(`Deletion failed: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleApproveItem = async (itemType, itemId) => {
    try {
      await api.approveArtifact(itemType, itemId);
      loadFullProject(selectedProj.id);
    } catch (err) {
      alert(`Approval failed: ${err.message}`);
    }
  };

  const openExecuteOverride = (task, assignee) => {
    setOverrideTask({ ...task, assignee });
    setAdditionalInstructions("");
  };

  const handleExecuteWithInstructions = async () => {
    if (!overrideTask) return;
    const taskId = overrideTask.id;
    const assignee = overrideTask.assignee;
    
    setExecutingTasks(prev => ({ ...prev, [taskId]: true }));
    setOverrideTask(null);
    try {
      await api.executeTask(taskId, assignee, additionalInstructions || null);
      loadFullProject(selectedProj.id);
    } catch (err) {
      alert(`Agent execution failed: ${err.message}`);
    } finally {
      setExecutingTasks(prev => ({ ...prev, [taskId]: false }));
    }
  };

  const handleStartEdit = (type, item) => {
    setEditingItem({ type, id: item.id, item });
    setEditTitle(item.title || "");
    setEditDesc(item.description || "");
    setEditPoints(item.points || 3);
    setEditAssignee(item.assignee || "Developer Agent");
    setEditTemplate(item.template || "");
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    const { type, id } = editingItem;
    try {
      if (type === "Project") {
        await api.updateProject(id, { title: editTitle, description: editDesc, tech_stack: editingItem.item.tech_stack, vision: editingItem.item.vision, goals: editingItem.item.goals });
      } else if (type === "Epic") {
        await api.updateEpic(id, { title: editTitle, description: editDesc });
      } else if (type === "Feature") {
        await api.updateFeature(id, { title: editTitle, description: editDesc });
      } else if (type === "Story") {
        await api.updateStory(id, { title: editTitle, template: editTemplate });
      } else if (type === "Task") {
        await api.updateTask(id, { title: editTitle, description: editDesc, assignee: editAssignee, points: editPoints, status: editingItem.item.status });
      }
      setEditingItem(null);
      await loadProjects();
      loadFullProject(selectedProj.id);
    } catch (e) {
      alert("Update failed: " + e.message);
    }
  };

  const openPreview = (task) => {
    setPreviewTask(task);
    const output = task.outputs && task.outputs.length > 0 ? task.outputs[0].output_content : "";
    setPreviewOutput(output);
    setPreviewTab("app");
  };

  const toggleExpand = (map, setter, id) => {
    setter(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderPreviewCode = () => {
    if (!previewOutput) return "<p style='color:#ccc;text-align:center;margin-top:40px'>No app code found</p>";
    
    const htmlMatch = previewOutput.match(/```html\s*([\s\S]*?)```/i);
    const cssMatch = previewOutput.match(/```css\s*([\s\S]*?)```/i);
    const jsMatch = previewOutput.match(/```javascript\s*([\s\S]*?)```/i);

    if (htmlMatch) {
      let finalHtml = htmlMatch[1];
      if (cssMatch) {
        finalHtml = `<style>${cssMatch[1]}</style>` + finalHtml;
      }
      if (jsMatch) {
        finalHtml = finalHtml + `<script>${jsMatch[1]}</script>`;
      }
      return finalHtml;
    }

    return `
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f1f5f9; padding: 20px; }
            .card { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 20px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
            h2 { color: #818cf8; margin-top: 0; }
            pre { background: #0b0f19; padding: 12px; border-radius: 6px; overflow-x: auto; color: #38bdf8; font-size: 12px; }
            .badge { background: #10b98122; color: #10b981; border: 1px solid #10b98144; padding: 2px 8px; border-radius: 99px; font-size: 11px; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
              <h2>🤖 Completed App Module</h2>
              <span class="badge">Running in Sandbox</span>
            </div>
            <p><strong>Task Title:</strong> ${previewTask?.title}</p>
            <p><strong>Code / Output Review:</strong></p>
            <div style="font-size:12px; line-height:1.6; color:#94a3b8; background:#0f172a; padding:12px; border-radius:6px; border:1px solid #334155; white-space:pre-wrap;">${previewOutput}</div>
          </div>
        </body>
      </html>
    `;
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)", height: "100%" }}>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ marginBottom: "4px", fontSize: "22px" }}>Workspace Roadmap</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
            Review, edit, and approve backlogs. Assign AI Agents or trigger live sandboxed compilations.
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={loadProjects} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <RefreshCw size={12} />
          <span>Refresh</span>
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px", gap: "8px", color: "var(--text-secondary)" }}>
          <RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} />
          <span>Loading project directory...</span>
        </div>
      ) : projects.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
          No active projects. Head to the <strong>AI Command Room</strong> and ask the AI to "Build me a..." to generate one!
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: "var(--space-6)", flex: 1, minHeight: 0 }}>
          {/* Projects sidebar list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <h3 style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Projects</h3>
            {projects.map(p => (
              <div 
                key={p.id}
                onClick={() => selectProject(p)}
                className="card card-interactive"
                style={{ 
                  padding: "10px", cursor: "pointer",
                  border: selectedProj?.id === p.id ? "1.5px solid var(--primary-color)" : "1px solid var(--border-primary)",
                  background: selectedProj?.id === p.id ? "var(--bg-hover)" : "var(--bg-card)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                  <Folder size={13} style={{ color: "var(--primary-color)" }} />
                  <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</span>
                </div>
                <StatusBadge status={p.status} />
              </div>
            ))}
          </div>

          {/* Project Details + Tree */}
          {selectedProj && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Hero card */}
              <div className="card" style={{ borderLeft: `4px solid ${selectedProj.status === "Approved" ? "#10b981" : "var(--primary-color)"}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <h2 style={{ fontSize: "18px", fontWeight: "700" }}>{selectedProj.title}</h2>
                      <button onClick={() => handleStartEdit("Project", selectedProj)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
                        <Edit3 size={12} />
                      </button>
                    </div>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                      {selectedProj.tech_stack || "React + Node.js"} • {selectedProj.timeline || "4 Weeks"} •
                      {fullProject ? ` ${fullProject.epics?.length || 0} Epics • ${totalTasks} Tasks` : ""}
                      {fullProject?.documents?.length ? ` • ${fullProject.documents.length} Docs` : ""}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {selectedProj.status !== "Approved" && (
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={handleApproveAll}
                        disabled={isApproving}
                        style={{ display: "flex", alignItems: "center", gap: "6px" }}
                      >
                        <ThumbsUp size={12} />
                        <span>{isApproving ? "Approving…" : "Approve All"}</span>
                      </button>
                    )}
                    <button 
                      onClick={handleDeleteProject}
                      disabled={isDeleting}
                      style={{
                        background: "#ef444415", border: "1px solid #ef444444", color: "#ef4444",
                        padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "600",
                        cursor: "pointer", display: "flex", alignItems: "center", gap: "4px"
                      }}
                    >
                      <Trash2 size={12} />
                      <span>{isDeleting ? "Deleting..." : "Delete Project"}</span>
                    </button>
                  </div>
                </div>
                {selectedProj.vision && (
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "8px", lineHeight: "1.5" }}>
                    {selectedProj.vision}
                  </p>
                )}
              </div>

              {/* Documents */}
              {fullProject?.documents?.length > 0 && (
                <div>
                  <h3 style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>
                    📄 Generated Documentation
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {fullProject.documents.map(doc => (
                      <div key={doc.id} style={{
                        background: "var(--bg-hover)", border: "1px solid var(--border-secondary)",
                        borderRadius: "8px", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center"
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <FileText size={13} color="#a78bfa" />
                          <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-primary)" }}>{doc.title}</span>
                          <span style={{ fontSize: "9px", background: "var(--bg-active)", padding: "1px 5px", borderRadius: "4px", color: "var(--text-muted)" }}>{doc.doc_type}</span>
                        </div>
                        <button
                          onClick={() => onNavigateToDoc(doc.id)}
                          style={{
                            background: "none", border: "none", color: "var(--primary-color)",
                            fontSize: "11px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "2px"
                          }}
                        >
                          <span>Open in Wiki</span>
                          <ChevronRight size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Project Tree */}
              {fullProject?.epics?.length > 0 && (
                <div>
                  <h3 style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px" }}>
                    🏗️ Project Hierarchy & Execution Board
                  </h3>

                  {fullProject.epics.map(epic => (
                    <div key={epic.id} style={{ marginBottom: "8px" }}>
                      {/* Epic Row */}
                      <div
                        style={{
                          display: "flex", alignItems: "center", gap: "8px",
                          padding: "8px 12px", borderRadius: "8px",
                          background: "var(--bg-hover)", border: "1px solid var(--border-secondary)"
                        }}
                      >
                        <div onClick={() => toggleExpand(expandedEpics, setExpandedEpics, epic.id)} style={{ cursor: "pointer", display: "flex" }}>
                          {expandedEpics[epic.id] ? <ChevronDown size={14} color="var(--text-muted)" /> : <ChevronRight size={14} color="var(--text-muted)" />}
                        </div>
                        <Layers size={14} color="#6366f1" />
                        <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)", flex: 1 }}>
                          {epic.title}
                        </span>
                        <button onClick={() => handleStartEdit("Epic", epic)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px" }}>
                          <Edit3 size={11} />
                        </button>
                        <StatusBadge status={epic.status} />
                        {epic.status === "Draft" && (
                          <button onClick={() => handleApproveItem("Epic", epic.id)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#10b981", fontSize: "11px", fontWeight: "600" }}>
                            Approve
                          </button>
                        )}
                      </div>

                      {/* Features under Epic */}
                      {expandedEpics[epic.id] && epic.features?.map(feat => (
                        <div key={feat.id} style={{ marginLeft: "24px", marginTop: "4px" }}>
                          <div
                            style={{
                              display: "flex", alignItems: "center", gap: "8px",
                              padding: "6px 12px", borderRadius: "6px",
                              background: "var(--bg-card)", border: "1px solid var(--border-secondary)"
                            }}
                          >
                            <div onClick={() => toggleExpand(expandedFeatures, setExpandedFeatures, feat.id)} style={{ cursor: "pointer", display: "flex" }}>
                              {expandedFeatures[feat.id] ? <ChevronDown size={12} color="var(--text-muted)" /> : <ChevronRight size={12} color="var(--text-muted)" />}
                            </div>
                            <Code size={12} color="#10b981" />
                            <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-primary)", flex: 1 }}>
                              {feat.title}
                            </span>
                            <button onClick={() => handleStartEdit("Feature", feat)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px" }}>
                              <Edit3 size={11} />
                            </button>
                            <StatusBadge status={feat.status} />
                          </div>

                          {/* Stories under Feature */}
                          {expandedFeatures[feat.id] && feat.stories?.map(story => (
                            <div key={story.id} style={{ marginLeft: "24px", marginTop: "4px" }}>
                              <div
                                style={{
                                  display: "flex", alignItems: "center", gap: "8px",
                                  padding: "5px 10px", borderRadius: "6px",
                                  color: "var(--text-secondary)"
                                }}
                              >
                                <div onClick={() => toggleExpand(expandedStories, setExpandedStories, story.id)} style={{ cursor: "pointer", display: "flex" }}>
                                  {expandedStories[story.id] ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                                </div>
                                <FileText size={11} color="#f59e0b" />
                                <span style={{ fontSize: "11px", fontWeight: "600", flex: 1 }}>{story.title}</span>
                                <button onClick={() => handleStartEdit("Story", story)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px" }}>
                                  <Edit3 size={10} />
                                </button>
                                <StatusBadge status={story.status} />
                              </div>

                              {/* Tasks under Story */}
                              {expandedStories[story.id] && (
                                <div style={{ marginLeft: "24px", marginTop: "4px" }}>
                                  {story.tasks?.map(task => (
                                    <ProjectTaskRow
                                      key={task.id}
                                      task={task}
                                      onExecute={openExecuteOverride}
                                      onApprove={(id) => handleApproveItem("Task", id)}
                                      onPreview={openPreview}
                                      onStartEdit={handleStartEdit}
                                      isExecuting={!!executingTasks[task.id]}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── Pre-execution Instruction Drawer / Overlay ─── */}
      {overrideTask && (
        <div className="modal-backdrop" onClick={() => setOverrideTask(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: "550px" }}>
            <div className="modal-header">
              <h3 style={{ fontSize: "14px", fontWeight: "700" }}>Configure Task Execution & Instructions</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setOverrideTask(null)}>✕</button>
            </div>
            <div style={{ padding: "16px 0", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ background: "var(--bg-hover)", padding: "10px", borderRadius: "6px", border: "1px solid var(--border-secondary)" }}>
                <span style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase" }}>Target Task</span>
                <div style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-primary)", marginTop: "2px" }}>{overrideTask.title}</div>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>Assigned to: <strong style={{ color: "var(--primary-color)" }}>{overrideTask.assignee}</strong></div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Custom Instruction Override / Reference Spec</span>
                  <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>(Optional)</span>
                </label>
                <textarea
                  className="textarea"
                  rows={6}
                  placeholder="Paste special requirements, API credentials, or code styling overrides here. The agent will inject this into its context prior to execution."
                  value={additionalInstructions}
                  onChange={e => setAdditionalInstructions(e.target.value)}
                  style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}
                />
              </div>

              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "10px" }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setOverrideTask(null)}>Cancel</button>
                <button onClick={handleExecuteWithInstructions} className="btn btn-primary btn-sm" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Play size={12} />
                  <span>Start AI Agent Compile</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Collaborative Item Editing Modal ─── */}
      {editingItem && (
        <div className="modal-backdrop" onClick={() => setEditingItem(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: "500px" }}>
            <div className="modal-header">
              <h3 style={{ fontSize: "14px", fontWeight: "700" }}>Modify Backlog Node ({editingItem.type})</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditingItem(null)}>✕</button>
            </div>
            <div style={{ padding: "16px 0", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className="form-group">
                <label className="form-label">Title / Summary</label>
                <input 
                  type="text" 
                  className="input" 
                  value={editTitle} 
                  onChange={e => setEditTitle(e.target.value)}
                  required 
                />
              </div>

              {editingItem.type === "Story" ? (
                <div className="form-group">
                  <label className="form-label">User Journey Template</label>
                  <textarea 
                    className="textarea" 
                    rows={4}
                    value={editTemplate} 
                    onChange={e => setEditTemplate(e.target.value)} 
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">Description / Context Details</label>
                  <textarea 
                    className="textarea" 
                    rows={4}
                    value={editDesc} 
                    onChange={e => setEditDesc(e.target.value)} 
                  />
                </div>
              )}

              {editingItem.type === "Task" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="form-group">
                    <label className="form-label">Story Points</label>
                    <input 
                      type="number" 
                      className="input" 
                      value={editPoints} 
                      onChange={e => setEditPoints(parseInt(e.target.value) || 1)} 
                      min="1" 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Assignee</label>
                    <select className="select" value={editAssignee} onChange={e => setEditAssignee(e.target.value)}>
                      {AGENT_LIST.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "10px" }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setEditingItem(null)}>Cancel</button>
                <button onClick={handleSaveEdit} className="btn btn-primary btn-sm" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Save size={12} />
                  <span>Save Modifications</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Simulated Browser Preview Modal ─── */}
      {previewTask && (
        <div className="modal-backdrop" onClick={() => setPreviewTask(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: "800px", width: "90vw", height: "85vh", display: "flex", flexDirection: "column", padding: 0 }}>
            {/* Browser URL bar & navigation */}
            <div style={{
              background: "#1e293b", borderBottom: "1px solid #334155",
              padding: "10px 16px", display: "flex", alignItems: "center", gap: "14px",
              borderTopLeftRadius: "12px", borderTopRightRadius: "12px"
            }}>
              {/* Colored dots */}
              <div style={{ display: "flex", gap: "6px" }}>
                <div onClick={() => setPreviewTask(null)} style={{ width: "11px", height: "11px", borderRadius: "50%", background: "#ef4444", cursor: "pointer" }} />
                <div style={{ width: "11px", height: "11px", borderRadius: "50%", background: "#f59e0b" }} />
                <div style={{ width: "11px", height: "11px", borderRadius: "50%", background: "#10b981" }} />
              </div>

              {/* Tabs */}
              <div style={{ display: "flex", gap: "4px", background: "#0f172a", padding: "2px", borderRadius: "6px" }}>
                <button 
                  onClick={() => setPreviewTab("app")}
                  style={{
                    border: "none", padding: "4px 12px", borderRadius: "4px", fontSize: "11px", fontWeight: "600",
                    background: previewTab === "app" ? "#1e293b" : "transparent",
                    color: previewTab === "app" ? "#38bdf8" : "#94a3b8", cursor: "pointer"
                  }}
                >
                  🌐 View App Build
                </button>
                <button 
                  onClick={() => setPreviewTab("code")}
                  style={{
                    border: "none", padding: "4px 12px", borderRadius: "4px", fontSize: "11px", fontWeight: "600",
                    background: previewTab === "code" ? "#1e293b" : "transparent",
                    color: previewTab === "code" ? "#38bdf8" : "#94a3b8", cursor: "pointer"
                  }}
                >
                  📝 Raw Output Spec
                </button>
              </div>

              {/* Mock Address bar */}
              <div style={{
                flex: 1, background: "#0f172a", borderRadius: "6px", border: "1px solid #334155",
                fontSize: "11px", color: "#64748b", padding: "4px 12px", fontFamily: "var(--font-mono)",
                display: "flex", alignItems: "center", gap: "6px"
              }}>
                <Globe size={11} color="#64748b" />
                <span>http://localhost:5001/sandbox/preview/task-{previewTask.id}</span>
              </div>
            </div>

            {/* Sandbox content viewport */}
            <div style={{ flex: 1, background: "#0f172a", overflow: "auto", position: "relative" }}>
              {previewTab === "app" ? (
                <iframe 
                  title="App Sandbox Preview"
                  srcDoc={renderPreviewCode()} 
                  style={{ width: "100%", height: "100%", border: "none", background: "#0f172a" }}
                />
              ) : (
                <pre style={{
                  margin: 0, padding: "20px", fontSize: "12px", color: "#38bdf8",
                  fontFamily: "var(--font-mono)", whiteSpace: "pre-wrap", wordBreak: "break-word"
                }}>{previewOutput || "No output compiled."}</pre>
              )}
            </div>

            {/* Preview footer bar */}
            <div style={{
              background: "#1e293b", borderTop: "1px solid #334155", padding: "8px 16px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              borderBottomLeftRadius: "12px", borderBottomRightRadius: "12px", fontSize: "11px", color: "#94a3b8"
            }}>
              <span>ProductOS Build Sandbox • Output validated against Definition of Done</span>
              <button onClick={() => setPreviewTask(null)} className="btn btn-secondary btn-sm" style={{ padding: "2px 10px", fontSize: "10px" }}>Close Preview</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
