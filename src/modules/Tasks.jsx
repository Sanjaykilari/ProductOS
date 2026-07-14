import React, { useState, useEffect } from "react";
import { List, Kanban, Calendar, Clock, Plus, Search, Filter, MessageSquare, Paperclip, CheckSquare, Sparkles, Folder, RefreshCw } from "lucide-react";
import TaskModal from "../components/TaskModal";
import api from "../lib/api";

export default function Tasks() {
  const [currentView, setCurrentView] = useState("kanban");
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // New task form state
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPoints, setNewPoints] = useState(3);
  const [newAssignee, setNewAssignee] = useState("Developer Agent");

  const columns = ["Draft", "To Do", "In Progress", "In Review", "Approved", "Completed", "Failed"];

  // Fetch projects and tasks on mount
  useEffect(() => {
    loadProjectsAndTasks();
  }, []);

  // Re-fetch tasks when active project filter changes
  useEffect(() => {
    loadTasks();
  }, [selectedProject]);

  const loadProjectsAndTasks = async () => {
    setIsLoading(true);
    try {
      const projs = await api.getProjects();
      setProjects(projs);
      if (projs.length > 0) {
        setSelectedProject(projs[0].id);
      } else {
        await loadTasks();
      }
    } catch (err) {
      console.error("Failed to load projects", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const list = await api.getTasks(selectedProject || null);
      setTasks(list);
    } catch (err) {
      console.error("Failed to load tasks", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardClick = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleUpdateTaskStatus = async (updatedTask) => {
    try {
      await api.updateTaskStatus(updatedTask.id, updatedTask.status);
      await loadTasks();
    } catch (err) {
      alert(`Error updating task status: ${err.message}`);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      await api.createTask({
        title: newTitle,
        description: newDesc,
        points: newPoints,
        assignee: newAssignee,
        status: "Draft"
      });
      setNewTitle("");
      setNewDesc("");
      setNewPoints(3);
      setIsCreating(false);
      await loadTasks();
    } catch (err) {
      alert(`Failed to create task: ${err.message}`);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)", height: "100%" }}>
      {/* Header controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ marginBottom: "4px" }}>Tasks & Boards</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>Manage tasks across Kanban columns, detailed checklists, and timeline Gantts.</p>
        </div>

        {/* View & Project Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          {/* Project Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Folder size={14} style={{ color: "var(--text-secondary)" }} />
            <select 
              className="select" 
              value={selectedProject} 
              onChange={(e) => setSelectedProject(e.target.value)}
              style={{ padding: "4px 10px", fontSize: "12px", borderRadius: "6px", width: "180px" }}
            >
              <option value="">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>

          <div 
            style={{ 
              display: "flex", 
              border: "1px solid var(--border-primary)", 
              borderRadius: "var(--radius-sm)", 
              background: "var(--bg-active)",
              padding: "2px" 
            }}
          >
            <button 
              className={`btn btn-ghost btn-sm btn-icon`}
              style={{ background: currentView === "kanban" ? "var(--bg-card)" : "transparent" }}
              onClick={() => setCurrentView("kanban")}
              title="Kanban Board"
            >
              <Kanban size={14} style={{ color: currentView === "kanban" ? "var(--primary-color)" : "var(--text-secondary)" }} />
            </button>
            <button 
              className={`btn btn-ghost btn-sm btn-icon`}
              style={{ background: currentView === "list" ? "var(--bg-card)" : "transparent" }}
              onClick={() => setCurrentView("list")}
              title="List View"
            >
              <List size={14} style={{ color: currentView === "list" ? "var(--primary-color)" : "var(--text-secondary)" }} />
            </button>
            <button 
              className={`btn btn-ghost btn-sm btn-icon`}
              style={{ background: currentView === "timeline" ? "var(--bg-card)" : "transparent" }}
              onClick={() => setCurrentView("timeline")}
              title="Timeline Gantt"
            >
              <Calendar size={14} style={{ color: currentView === "timeline" ? "var(--primary-color)" : "var(--text-secondary)" }} />
            </button>
          </div>

          <button className="btn btn-primary btn-sm" onClick={() => setIsCreating(true)}>
            <Plus size={14} />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Inline Task Creation Form Overlay */}
      {isCreating && (
        <div style={{
          background: "var(--bg-card)",
          border: "1px solid var(--primary-color)44",
          borderRadius: "var(--radius-md)",
          padding: "var(--space-4)",
          boxShadow: "var(--shadow-lg)",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          animation: "slideDown 0.2s ease"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "700" }}>Create New Agile Task</h3>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setIsCreating(false)}>✕</button>
          </div>
          <form onSubmit={handleCreateTask} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 150px 150px", gap: "12px" }}>
              <input 
                type="text" 
                className="input" 
                placeholder="Task Title..." 
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                required
              />
              <select className="select" value={newAssignee} onChange={e => setNewAssignee(e.target.value)}>
                <option value="Developer Agent">Developer Agent</option>
                <option value="QA Agent">QA Agent</option>
                <option value="Security Agent">Security Agent</option>
                <option value="Architecture Agent">Architecture Agent</option>
                <option value="DevOps Agent">DevOps Agent</option>
                <option value="UI Agent">UI Agent</option>
              </select>
              <input 
                type="number" 
                className="input" 
                placeholder="Points (SP)" 
                value={newPoints}
                onChange={e => setNewPoints(parseInt(e.target.value) || 1)}
                min="1"
              />
            </div>
            <textarea 
              className="textarea" 
              placeholder="Task Description..."
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              rows="3"
            />
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsCreating(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm">Add Task</button>
            </div>
          </form>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div 
        style={{ 
          display: "flex", 
          gap: "12px", 
          background: "var(--bg-card)", 
          padding: "var(--space-3) var(--space-4)", 
          borderRadius: "var(--radius-md)", 
          border: "1px solid var(--border-primary)",
          alignItems: "center"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, background: "var(--bg-app)", border: "1px solid var(--border-primary)", borderRadius: "var(--radius-sm)", padding: "4px 8px" }}>
          <Search size={14} style={{ color: "var(--text-muted)" }} />
          <input type="text" placeholder="Search tasks..." style={{ border: "none", background: "transparent", outline: "none", fontSize: "12px", width: "100%", color: "var(--text-primary)" }} />
        </div>
        <button className="btn btn-secondary btn-sm" onClick={loadTasks} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <RefreshCw size={12} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Main viewport */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "40px", gap: "8px", color: "var(--text-secondary)" }}>
            <RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} />
            <span>Loading database records...</span>
          </div>
        ) : tasks.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
            No tasks found in the database. Ask the AI Agent to build a project or click "Create Task" above!
          </div>
        ) : (
          <>
            {/* Kanban Board View */}
            {currentView === "kanban" && (
              <div 
                style={{ 
                  display: "flex", 
                  gap: "var(--space-4)", 
                  overflowX: "auto", 
                  height: "calc(100vh - 280px)",
                  paddingBottom: "12px" 
                }}
              >
                {columns.map((col) => {
                  const colTasks = tasks.filter(t => t.status === col);
                  return (
                    <div 
                      key={col} 
                      style={{ 
                        flex: 1, 
                        minWidth: "250px", 
                        background: "var(--bg-panel)", 
                        borderRadius: "var(--radius-md)", 
                        padding: "var(--space-3)", 
                        display: "flex", 
                        flexDirection: "column", 
                        gap: "var(--space-3)",
                        border: "1px solid var(--border-primary)" 
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-secondary)", paddingBottom: "6px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)" }}>{col}</span>
                          <span className="badge badge-gray" style={{ fontSize: "10px", padding: "1px 6px" }}>{colTasks.length}</span>
                        </div>
                      </div>

                      {/* Task list inside column */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", overflowY: "auto", flex: 1 }}>
                        {colTasks.map((task) => (
                          <div 
                            key={task.id} 
                            className="card card-interactive" 
                            onClick={() => handleCardClick(task)}
                            style={{ padding: "12px", border: "1px solid var(--border-primary)", display: "flex", flexDirection: "column", gap: "8px" }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: "500", textTransform: "uppercase" }}>{task.id}</span>
                              <span style={{ fontSize: "10px", background: "var(--bg-active)", padding: "1px 4px", borderRadius: "var(--radius-xs)", fontWeight: "600" }}>{task.points} SP</span>
                            </div>
                            <h4 style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)", lineHeight: "1.4" }}>{task.title}</h4>
                            <p style={{ fontSize: "11px", color: "var(--text-secondary)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {task.description}
                            </p>
                            
                            {/* Assignee / Meta footer */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px", borderTop: "1px solid var(--border-secondary)", paddingTop: "6px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", color: "var(--text-muted)" }}>
                                <CheckSquare size={10} />
                                <span>DoD Validated</span>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #a855f7)", color: "#fff", fontSize: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                                  {(task.assignee || "DA").substring(0, 2)}
                                </div>
                                <span style={{ fontSize: "10px", color: "var(--text-secondary)" }}>{task.assignee || "DevAgent"}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* List View */}
            {currentView === "list" && (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Task Key</th>
                      <th>Summary</th>
                      <th>Points</th>
                      <th>Status</th>
                      <th>Assignee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((t) => (
                      <tr key={t.id} onClick={() => handleCardClick(t)} style={{ cursor: "pointer" }}>
                        <td><span className="badge badge-gray">{t.id}</span></td>
                        <td><strong>{t.title}</strong> - <span style={{ color: "var(--text-secondary)", fontSize: "11px" }}>{t.description}</span></td>
                        <td>{t.points} SP</td>
                        <td>
                          <span className={`badge ${
                            t.status === "Completed" ? "badge-success" :
                            t.status === "Executing" ? "badge-indigo" : "badge-gray"
                          }`}>
                            {t.status}
                          </span>
                        </td>
                        <td>{t.assignee || "Developer Agent"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Timeline Gantt View */}
            {currentView === "timeline" && (
              <div className="card" style={{ padding: "var(--space-4)" }}>
                <h3 style={{ marginBottom: "var(--space-4)" }}>Sprint Timeline Gantt</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {tasks.map((t, idx) => (
                    <div key={t.id} style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
                      <div style={{ width: "200px", fontSize: "12px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        <strong>{t.id}</strong> {t.title}
                      </div>
                      <div style={{ flex: 1, background: "var(--bg-active)", height: "16px", borderRadius: "var(--radius-sm)", position: "relative" }}>
                        <div 
                          style={{ 
                            position: "absolute", 
                            left: `${(idx * 15) % 70}%`, 
                            width: `${20 + (idx * 5)}%`, 
                            background: "var(--primary-color)", 
                            height: "100%", 
                            borderRadius: "var(--radius-sm)",
                            opacity: 0.8
                          }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Task Modal details view */}
      <TaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        task={selectedTask}
        onUpdateTask={handleUpdateTaskStatus}
      />
    </div>
  );
}
