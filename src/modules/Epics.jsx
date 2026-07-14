import React from "react";
import { ShieldCheck, MessageSquare, Layers, Clock, Sparkles } from "lucide-react";

export default function Epics() {
  const epics = [
    { id: "EPIC-01", name: "Multi-Agent AI Collaboration Workspace", progress: 85, tasks: "12/15 tasks", owner: "PMAgent", color: "var(--primary-color)" },
    { id: "EPIC-02", name: "Vercel-Inspired Real-time Deployment Logs", progress: 40, tasks: "4/10 tasks", owner: "DevOpsAgent", color: "var(--success-color)" },
    { id: "EPIC-03", name: "Security Audit zero-trust sandbox scanning", progress: 10, tasks: "1/8 tasks", owner: "SecurityAgent", color: "var(--error-color)" }
  ];

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      {/* Page Header */}
      <div>
        <h1 style={{ marginBottom: "4px" }}>Epic Dashboard</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>Plan high-level milestones, monitor cross-team dependencies, and map epic roadmaps.</p>
      </div>

      {/* Main Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "var(--space-4)" }}>
        {epics.map((epic) => (
          <div key={epic.id} className="card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="badge badge-indigo" style={{ background: epic.color, color: "var(--text-inverse)" }}>{epic.id}</span>
                <h3 style={{ fontSize: "15px", fontWeight: "600" }}>{epic.name}</h3>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12px", color: "var(--text-secondary)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Layers size={12} /> {epic.tasks}
                </span>
                <span>•</span>
                <span>Owner: <strong>{epic.owner}</strong></span>
              </div>
            </div>

            {/* Progress bar */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                <span>Completion Status</span>
                <strong>{epic.progress}%</strong>
              </div>
              <div style={{ height: "8px", background: "var(--bg-active)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${epic.progress}%`, background: epic.color, transition: "width var(--transition-normal)" }} />
              </div>
            </div>

            {/* AI Insights & dependencies */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "var(--space-2)", borderTop: "1px solid var(--border-secondary)", fontSize: "11px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--text-secondary)" }}>
                <Clock size={12} />
                <span>ETA: Jul 24, 2026</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--primary-text)" }}>
                <Sparkles size={12} />
                <span>AI Recommendation: Auto-prioritize remaining {epic.id} story cards.</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
