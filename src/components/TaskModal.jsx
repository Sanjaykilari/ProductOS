import React, { useState, useEffect } from "react";
import { X, Check, Paperclip, Send, ShieldCheck, Sparkles, AlertTriangle } from "lucide-react";

export default function TaskModal({ isOpen, onClose, task, onUpdateTask }) {
  if (!isOpen || !task) return null;

  const [status, setStatus] = useState(task.status || "In Progress");

  useEffect(() => {
    setStatus(task.status || "In Progress");
  }, [task]);
  const [commentInput, setCommentInput] = useState("");
  const [comments, setComments] = useState([
    { id: 1, user: "PMAgent", text: "Generated initial description and verified with user journey rules.", time: "2h ago" },
    { id: 2, user: "DevAgent", text: "Finished frontend layout structure. Ready for UI check.", time: "1h ago" }
  ]);
  const [criteria, setCriteria] = useState([
    { id: 1, text: "UI loads under 150ms on mobile viewport", checked: true },
    { id: 2, text: "Dark/Light modes support custom CSS variables", checked: true },
    { id: 3, text: "Keyboard shortcuts trigger command palette", checked: false },
    { id: 4, text: "Deployment configurations pass health checks", checked: false }
  ]);

  const toggleCriterion = (id) => {
    setCriteria(prev => 
      prev.map(c => c.id === id ? { ...c, checked: !c.checked } : c)
    );
  };

  const handlePostComment = () => {
    if (!commentInput.trim()) return;
    setComments(prev => [
      ...prev,
      {
        id: Date.now(),
        user: "Sanjay Kilari (You)",
        text: commentInput,
        time: "Just now"
      }
    ]);
    setCommentInput("");
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "680px", height: "90vh" }}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="badge badge-indigo">TASK-{task.id || "102"}</span>
            <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>• Added by PMAgent</span>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ display: "flex", gap: "var(--space-6)" }}>
          {/* Main Content Column */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "var(--space-2)" }}>
                {task.title || "Implement AI-Native Workflow Builder Interface"}
              </h2>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                {task.description || "Build a visual editor using HTML5 canvas/SVG nodes where users can wire triggers to custom agent actions. Requires responsive layout, dark/light compatibility, and connection graphs."}
              </p>
            </div>

            {/* AI Summary Section */}
            <div 
              style={{ 
                background: "var(--bg-hover)", 
                border: "1px solid var(--border-primary)", 
                borderRadius: "var(--radius-md)", 
                padding: "12px" 
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                <Sparkles size={14} style={{ color: "var(--primary-color)" }} />
                <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-primary)" }}>AI Task Summary</span>
              </div>
              <p style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                This task represents a frontend milestone with medium-high design fidelity. 
                SecurityAgent flags no vulnerability concerns. ArchitectureAgent estimates 8 hours of Dev time.
              </p>
              <div 
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "4px", 
                  marginTop: "8px", 
                  color: "var(--warning-text)", 
                  background: "var(--warning-light)", 
                  padding: "4px 8px", 
                  borderRadius: "var(--radius-xs)",
                  fontSize: "10px",
                  width: "max-content"
                }}
              >
                <AlertTriangle size={10} />
                <span>AI Risk: Medium dependency on Deployment Center module setup.</span>
              </div>
            </div>

            {/* Acceptance Criteria Checklist */}
            <div>
              <h4 style={{ fontSize: "13px", fontWeight: "600", marginBottom: "var(--space-2)" }}>Acceptance Criteria</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                {criteria.map((c) => (
                  <label 
                    key={c.id} 
                    style={{ 
                      display: "flex", 
                      alignItems: "flex-start", 
                      gap: "var(--space-2)", 
                      fontSize: "12px", 
                      cursor: "pointer" 
                    }}
                  >
                    <input 
                      type="checkbox" 
                      checked={c.checked} 
                      onChange={() => toggleCriterion(c.id)}
                      style={{ marginTop: "3px" }}
                    />
                    <span style={{ 
                      color: c.checked ? "var(--text-muted)" : "var(--text-primary)",
                      textDecoration: c.checked ? "line-through" : "none"
                    }}>
                      {c.text}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Definition of Done */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "var(--space-2)" }}>
                <ShieldCheck size={14} style={{ color: "var(--success-color)" }} />
                <h4 style={{ fontSize: "13px", fontWeight: "600" }}>Definition of Done</h4>
              </div>
              <ul style={{ paddingLeft: "16px", fontSize: "11px", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: "2px" }}>
                <li>Unit tests coverage exceeds 80% (QA Team)</li>
                <li>Documentation and PRD pages updated in Wiki</li>
                <li>Vercel deployment preview validated in staging</li>
              </ul>
            </div>

            {/* Comments Feed */}
            <div>
              <h4 style={{ fontSize: "13px", fontWeight: "600", marginBottom: "var(--space-2)" }}>Activity & Comments</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "150px", overflowY: "auto", marginBottom: "8px" }}>
                {comments.map((com) => (
                  <div key={com.id} style={{ display: "flex", flexDirection: "column", background: "var(--bg-app)", padding: "8px", borderRadius: "var(--radius-sm)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: "600", marginBottom: "2px" }}>
                      <span>{com.user}</span>
                      <span style={{ color: "var(--text-muted)", fontWeight: "normal" }}>{com.time}</span>
                    </div>
                    <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{com.text}</p>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="Post comment to thread..." 
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handlePostComment(); }}
                  style={{ fontSize: "12px" }}
                />
                <button className="btn btn-primary btn-icon btn-sm" onClick={handlePostComment}>
                  <Send size={12} />
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar Column (Metadata) */}
          <div style={{ width: "200px", borderLeft: "1px solid var(--border-primary)", paddingLeft: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select 
                className="select" 
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  if (onUpdateTask) onUpdateTask({ ...task, status: e.target.value });
                }}
              >
                <option value="Backlog">Backlog</option>
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="In Review">In Review</option>
                <option value="Approved">Approved</option>
                <option value="Done">Done</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Assignee</label>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
                <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: "#6366f1", color: "#fff", fontSize: "9px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                  <span style={{ margin: "auto" }}>DA</span>
                </div>
                <span>DevAgent (Employee)</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Reporter</label>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
                <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: "#10b981", color: "#fff", fontSize: "9px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                  <span style={{ margin: "auto" }}>PA</span>
                </div>
                <span>PMAgent (Employee)</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Story Points</label>
              <input type="number" className="input" defaultValue={5} style={{ padding: "4px 8px" }} />
            </div>

            <div className="form-group">
              <label className="form-label">Attachments</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--primary-color)", cursor: "pointer" }}>
                  <Paperclip size={10} />
                  <span>workflow-nodes-v1.json</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--primary-color)", cursor: "pointer" }}>
                  <Paperclip size={10} />
                  <span>prd-draft-revised.md</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Close Details</button>
        </div>
      </div>
    </div>
  );
}
