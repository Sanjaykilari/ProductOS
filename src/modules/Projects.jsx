import React, { useState, useEffect } from "react";
import {
  Folder, CheckCircle, RefreshCw, ThumbsUp, ChevronRight, ChevronDown,
  FileText, Layers, Code, Zap, Play, Eye, X, Clock, Bot, Shield,
  Cpu, Database, Bug, Rocket, BookOpen, Paintbrush, Search
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

function DocumentCard({ doc }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{
      background: "var(--bg-hover)", border: "1px solid var(--border-secondary)",
      borderRadius: "8px", padding: "10px 12px", marginTop: "6px"
    }}>
      <div
        style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
        onClick={() => setExpanded(!expanded)}
      >
        <FileText size={13} color="#a78bfa" />
        <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-primary)", flex: 1 }}>{doc.title}</span>
        <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{doc.doc_type}</span>
        {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </div>
      {expanded && doc.content && (
        <pre style={{
          marginTop: "8px", fontSize: "11px", color: "var(--text-secondary)",
          lineHeight: "1.5", whiteSpace: "pre-wrap", wordBreak: "break-word",
          background: "var(--bg-card)", padding: "10px", borderRadius: "6px",
          border: "1px solid var(--border-primary)", maxHeight: "300px", overflowY: "auto"
        }}>{doc.content}</pre>
      )}
    </div>
  );
}

function TaskRow({ task, onExecute, onApprove, isExecuting }) {
  const [showOutput, setShowOutput] = useState(false);
  const [outputs, setOutputs] = useState([]);
  const [assignee, setAssignee] = useState(task.assignee || "Developer Agent");

  const loadOutputs = async () => {
    try {
      const data = await api.getTaskOutput(task.id);
      setOutputs(data);
      setShowOutput(true);
    } catch (e) { console.error(e); }
  };

  const handleAssign = async (agentName) => {
    setAssignee(agentName);
    try {
      await api.assignTaskAgent(task.id, agentName);
    } catch (e) { console.error(e); }
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
              {task.description.substring(0, 120)}{task.description.length > 120 ? "…" : ""}
            </p>
          )}
        </div>

        {/* Agent assignment */}
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

        {/* Approve button */}
        {task.status === "Draft" && (
          <button onClick={() => onApprove(task.id)} className="btn btn-sm" style={{
            background: "#10b98122", border: "1px solid #10b98144", color: "#10b981",
            fontSize: "10px", padding: "4px 8px", borderRadius: "6px", cursor: "pointer",
            display: "flex", alignItems: "center", gap: "3px"
          }}>
            <ThumbsUp size={10} /> Approve
          </button>
        )}

        {/* Execute button */}
        {(task.status === "Approved" || task.status === "Assigned" || task.status === "Draft") && (
          <button
            onClick={() => onExecute(task.id, assignee)}
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

        {/* View output */}
        {task.status === "Completed" && (
          <button onClick={loadOutputs} className="btn btn-sm" style={{
            background: "var(--bg-hover)", border: "1px solid var(--border-primary)",
            color: "var(--text-secondary)", fontSize: "10px", padding: "4px 8px",
            borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "3px"
          }}>
            <Eye size={10} /> Output
          </button>
        )}
      </div>

      {/* Output panel */}
      {showOutput && outputs.length > 0 && (
        <div style={{ marginTop: "10px", borderTop: "1px solid var(--border-secondary)", paddingTop: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--primary-color)" }}>
              Agent Output — {outputs[0].agent_name}
            </span>
            <button onClick={() => setShowOutput(false)} style={{
              background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)"
            }}><X size={12} /></button>
          </div>
          {outputs[0].summary && (
            <p style={{ fontSize: "11px", color: "#10b981", margin: "0 0 6px", fontWeight: "600" }}>
              Summary: {outputs[0].summary}
            </p>
          )}
          <pre style={{
            fontSize: "11px", color: "var(--text-secondary)", lineHeight: "1.5",
            whiteSpace: "pre-wrap", wordBreak: "break-word",
            background: "var(--bg-app)", padding: "10px", borderRadius: "6px",
            border: "1px solid var(--border-primary)", maxHeight: "400px", overflowY: "auto"
          }}>{outputs[0].output_content}</pre>
        </div>
      )}
    </div>
  );
}

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [selectedProj, setSelectedProj] = useState(null);
  const [fullProject, setFullProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [executingTasks, setExecutingTasks] = useState({});
  const [expandedEpics, setExpandedEpics] = useState({});
  const [expandedFeatures, setExpandedFeatures] = useState({});
  const [expandedStories, setExpandedStories] = useState({});

  useEffect(() => { loadProjects(); }, []);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const list = await api.getProjects();
      setProjects(list);
      if (list.length > 0 && !selectedProj) {
        setSelectedProj(list[0]);
        loadFullProject(list[0].id);
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
        setExpandedEpics({ [full.epics[0].id]: true });
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

  const handleApproveItem = async (itemType, itemId) => {
    try {
      await api.approveArtifact(itemType, itemId);
      loadFullProject(selectedProj.id);
    } catch (err) {
      alert(`Approval failed: ${err.message}`);
    }
  };

  const handleExecuteTask = async (taskId, agentName) => {
    setExecutingTasks(prev => ({ ...prev, [taskId]: true }));
    try {
      await api.executeTask(taskId, agentName);
      loadFullProject(selectedProj.id);
    } catch (err) {
      alert(`Execution failed: ${err.message}`);
    } finally {
      setExecutingTasks(prev => ({ ...prev, [taskId]: false }));
    }
  };

  const toggleExpand = (map, setter, id) => {
    setter(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const totalTasks = fullProject?.epics?.reduce((sum, e) =>
    sum + e.features?.reduce((s2, f) =>
      s2 + f.stories?.reduce((s3, st) => s3 + (st.tasks?.length || 0), 0), 0), 0) || 0;

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ marginBottom: "4px" }}>Project Workspace</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
            Full project hierarchy with agent assignments and execution controls.
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
          No active projects. Head to the <strong>AI Chat Room</strong> and ask the AI to "Build me a..." to create one!
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: "var(--space-6)" }}>
          {/* Projects sidebar list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <h3 style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase" }}>Projects</h3>
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
                  <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-primary)" }}>{p.title}</span>
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
                    <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "4px" }}>{selectedProj.title}</h2>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
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
                  <h3 style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "8px" }}>
                    📄 Documents ({fullProject.documents.length})
                  </h3>
                  {fullProject.documents.map(doc => (
                    <DocumentCard key={doc.id} doc={doc} />
                  ))}
                </div>
              )}

              {/* ─── Project Tree ─── */}
              {fullProject?.epics?.length > 0 && (
                <div>
                  <h3 style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "10px" }}>
                    🏗️ Project Hierarchy
                  </h3>

                  {fullProject.epics.map(epic => (
                    <div key={epic.id} style={{ marginBottom: "8px" }}>
                      {/* Epic Row */}
                      <div
                        onClick={() => toggleExpand(expandedEpics, setExpandedEpics, epic.id)}
                        style={{
                          display: "flex", alignItems: "center", gap: "8px",
                          padding: "8px 12px", borderRadius: "8px",
                          background: "var(--bg-hover)", cursor: "pointer",
                          border: "1px solid var(--border-secondary)"
                        }}
                      >
                        {expandedEpics[epic.id] ? <ChevronDown size={14} color="var(--text-muted)" /> : <ChevronRight size={14} color="var(--text-muted)" />}
                        <Layers size={14} color="#6366f1" />
                        <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)", flex: 1 }}>
                          {epic.title}
                        </span>
                        <StatusBadge status={epic.status} />
                        {epic.status === "Draft" && (
                          <button onClick={(e) => { e.stopPropagation(); handleApproveItem("Epic", epic.id); }}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#10b981", fontSize: "10px", fontWeight: "600" }}>
                            Approve
                          </button>
                        )}
                      </div>

                      {/* Features under Epic */}
                      {expandedEpics[epic.id] && epic.features?.map(feat => (
                        <div key={feat.id} style={{ marginLeft: "24px", marginTop: "4px" }}>
                          <div
                            onClick={() => toggleExpand(expandedFeatures, setExpandedFeatures, feat.id)}
                            style={{
                              display: "flex", alignItems: "center", gap: "8px",
                              padding: "6px 12px", borderRadius: "6px",
                              background: "var(--bg-card)", cursor: "pointer",
                              border: "1px solid var(--border-secondary)"
                            }}
                          >
                            {expandedFeatures[feat.id] ? <ChevronDown size={12} color="var(--text-muted)" /> : <ChevronRight size={12} color="var(--text-muted)" />}
                            <Code size={12} color="#10b981" />
                            <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-primary)", flex: 1 }}>
                              {feat.title}
                            </span>
                            <StatusBadge status={feat.status} />
                          </div>

                          {/* Stories under Feature */}
                          {expandedFeatures[feat.id] && feat.stories?.map(story => (
                            <div key={story.id} style={{ marginLeft: "24px", marginTop: "4px" }}>
                              <div
                                onClick={() => toggleExpand(expandedStories, setExpandedStories, story.id)}
                                style={{
                                  display: "flex", alignItems: "center", gap: "8px",
                                  padding: "5px 10px", borderRadius: "6px",
                                  cursor: "pointer", color: "var(--text-secondary)"
                                }}
                              >
                                {expandedStories[story.id] ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                                <FileText size={11} color="#f59e0b" />
                                <span style={{ fontSize: "11px", fontWeight: "600", flex: 1 }}>{story.title}</span>
                                <StatusBadge status={story.status} />
                              </div>

                              {/* Tasks under Story */}
                              {expandedStories[story.id] && (
                                <div style={{ marginLeft: "24px", marginTop: "4px" }}>
                                  {story.tasks?.map(task => (
                                    <TaskRow
                                      key={task.id}
                                      task={task}
                                      onExecute={handleExecuteTask}
                                      onApprove={(id) => handleApproveItem("Task", id)}
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

              {/* Loading state for tree */}
              {!fullProject && (
                <div style={{ display: "flex", justifyContent: "center", padding: "30px", gap: "8px", color: "var(--text-muted)" }}>
                  <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} />
                  <span style={{ fontSize: "12px" }}>Loading project hierarchy...</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
