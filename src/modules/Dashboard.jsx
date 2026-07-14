import React from "react";
import { 
  Bot, 
  Terminal, 
  TrendingUp, 
  Calendar, 
  FileText, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  CheckSquare, 
  Plus, 
  Sparkles,
  Zap,
  Activity
} from "lucide-react";

export default function Dashboard({ setActiveModule }) {
  const agentSummary = [
    { name: "PMAgent", status: "Idle", color: "var(--text-muted)", task: "Finished PRD Generation" },
    { name: "DevAgent", status: "Coding", color: "var(--primary-color)", task: "Refactoring layout CSS variables" },
    { name: "QAAgent", status: "Testing", color: "var(--warning-color)", task: "Running cypress regressions on staging" },
    { name: "DevOpsAgent", status: "Deploying", color: "var(--success-color)", task: "Pushing build v2.4.1 preview" }
  ];

  const focusTasks = [
    { id: 1, title: "Review DevAgent security scan results", done: false },
    { id: 2, title: "Approve PRD layout draft from PMAgent", done: true },
    { id: 3, title: "Check pipeline build latency reports", done: false }
  ];

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      {/* Welcome Banner */}
      <div 
        className="card"
        style={{
          background: "linear-gradient(135deg, var(--bg-card), var(--primary-light))",
          borderColor: "rgba(99, 102, 241, 0.15)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "var(--space-6)"
        }}
      >
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: "700", marginBottom: "var(--space-1)" }}>
            Welcome back, Sanjay.
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
            Your AI Employees have completed <strong style={{ color: "var(--primary-color)" }}>5 tasks</strong> and drafted <strong style={{ color: "var(--primary-color)" }}>1 new PRD</strong> in the last 2 hours.
          </p>
        </div>
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <button className="btn btn-primary btn-sm" onClick={() => setActiveModule("ai-chat")}>
            <Sparkles size={14} />
            <span>Consult AI Copilot</span>
          </button>
        </div>
      </div>

      {/* Grid Layout for Widgets */}
      <div 
        style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", 
          gap: "var(--space-6)" 
        }}
      >
        {/* Today's Focus */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
            <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckSquare size={16} style={{ color: "var(--primary-color)" }} />
              Today's Focus
            </h3>
            <button className="btn btn-ghost btn-sm btn-icon" style={{ borderRadius: "50%" }}>
              <Plus size={14} />
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {focusTasks.map((t) => (
              <label 
                key={t.id} 
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "10px", 
                  fontSize: "13px", 
                  color: t.done ? "var(--text-muted)" : "var(--text-primary)",
                  cursor: "pointer" 
                }}
              >
                <input type="checkbox" defaultChecked={t.done} style={{ accentColor: "var(--primary-color)" }} />
                <span style={{ textDecoration: t.done ? "line-through" : "none" }}>{t.title}</span>
              </label>
            ))}
          </div>
          <div 
            style={{ 
              marginTop: "var(--space-4)", 
              padding: "10px", 
              borderRadius: "var(--radius-sm)", 
              background: "var(--bg-hover)", 
              borderLeft: "3px solid var(--primary-color)",
              fontSize: "11px",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <Sparkles size={12} style={{ color: "var(--primary-color)" }} />
            <span>AI recommendation: Review failing QA check before approving PRD.</span>
          </div>
        </div>

        {/* Sprint Progress Chart */}
        <div className="card" style={{ display: "flex", flexDirection: "column" }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "var(--space-4)" }}>
            <TrendingUp size={16} style={{ color: "var(--success-color)" }} />
            Sprint 4 Velocity
          </h3>
          <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "space-around" }}>
            {/* SVG Ring Progress */}
            <div style={{ position: "relative", width: "80px", height: "80px" }}>
              <svg width="80" height="80" viewBox="0 0 36 36">
                <path
                  className="ring-bg"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="var(--bg-active)"
                  strokeWidth="3"
                />
                <path
                  className="ring-progress"
                  strokeDasharray="72, 100"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="var(--primary-color)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
              <div 
                style={{ 
                  position: "absolute", 
                  top: "50%", 
                  left: "50%", 
                  transform: "translate(-50%, -50%)", 
                  fontSize: "14px", 
                  fontWeight: "700" 
                }}
              >
                72%
              </div>
            </div>
            {/* Legend info */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ fontSize: "11px", display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--primary-color)" }} />
                <span>Completed: 36 pts</span>
              </div>
              <div style={{ fontSize: "11px", display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--warning-color)" }} />
                <span>In Progress: 10 pts</span>
              </div>
              <div style={{ fontSize: "11px", display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--bg-active)" }} />
                <span>Backlog: 4 pts</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Employees Status */}
        <div className="card" onClick={() => setActiveModule("ai-employees")} style={{ cursor: "pointer" }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "var(--space-4)" }}>
            <Bot size={16} style={{ color: "var(--primary-color)" }} />
            AI Employee Monitor
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {agentSummary.map((a) => (
              <div key={a.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: a.color }} />
                  <span style={{ fontWeight: "600" }}>{a.name}</span>
                  <span style={{ color: "var(--text-muted)", fontSize: "10px" }}>- {a.task}</span>
                </div>
                <span className="badge badge-gray" style={{ fontSize: "10px" }}>{a.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Deployment Status */}
        <div className="card" onClick={() => setActiveModule("deployment")} style={{ cursor: "pointer" }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "var(--space-4)" }}>
            <Terminal size={16} style={{ color: "var(--success-color)" }} />
            Environments & Deployments
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
              <div>
                <strong style={{ display: "block" }}>Production</strong>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>v2.4.0 • Active</span>
              </div>
              <span className="badge badge-success">Healthy</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
              <div>
                <strong style={{ display: "block" }}>Staging</strong>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>PR #142 • Auto deploying...</span>
              </div>
              <span className="badge badge-warning" style={{ background: "var(--warning-light)", color: "var(--warning-text)" }}>Deploying</span>
            </div>
          </div>
        </div>

        {/* Product Health & Latency */}
        <div className="card">
          <h3 style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "var(--space-4)" }}>
            <Activity size={16} style={{ color: "var(--primary-color)" }} />
            Core Web Vitals & Latency
          </h3>
          {/* Simple custom bars */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                <span>API Latency</span>
                <strong>124ms (optimal)</strong>
              </div>
              <div style={{ height: "6px", background: "var(--bg-active)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: "85%", background: "var(--success-color)" }} />
              </div>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                <span>Largest Contentful Paint</span>
                <strong>1.1s (optimal)</strong>
              </div>
              <div style={{ height: "6px", background: "var(--bg-active)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: "90%", background: "var(--success-color)" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Documents & Quick Notes */}
        <div className="card" onClick={() => setActiveModule("knowledge")} style={{ cursor: "pointer" }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "var(--space-4)" }}>
            <FileText size={16} style={{ color: "var(--primary-color)" }} />
            Recent Wiki & Docs
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
              <FileText size={12} style={{ color: "var(--text-secondary)" }} />
              <span>[PRD] AI Agent Workflows Configuration</span>
              <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>• 1h ago</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
              <FileText size={12} style={{ color: "var(--text-secondary)" }} />
              <span>[Architecture] Database Schema migration draft</span>
              <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>• 4h ago</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
              <FileText size={12} style={{ color: "var(--text-secondary)" }} />
              <span>[Meeting Notes] Sprint 3 Retro Notes</span>
              <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>• Yesterday</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
