import React from "react";
import { MessageSquare, CheckCircle, Clock, Sparkles } from "lucide-react";

export default function Stories() {
  const stories = [
    {
      id: "US-201",
      title: "Interactive Workspace Panel Resizing",
      template: "As a developer, I want to drag the borders of panels so that I can customize my workspace grid layout.",
      points: 5,
      epic: "EPIC-01",
      status: "In Progress",
      dod: "Passed"
    },
    {
      id: "US-202",
      title: "Live terminal log stream interface",
      template: "As an operator, I want to view scrolling build outputs in real-time so that I can debug pipeline compile failures.",
      points: 8,
      epic: "EPIC-02",
      status: "To Do",
      dod: "Pending"
    },
    {
      id: "US-203",
      title: "Workspace webhook configuration",
      template: "As a PM, I want to trigger Slack alerts when build stages complete so that my team stays updated automatically.",
      points: 3,
      epic: "EPIC-01",
      status: "Done",
      dod: "Passed"
    }
  ];

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      {/* Page Header */}
      <div>
        <h1 style={{ marginBottom: "4px" }}>User Stories</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>Manage, scope, and refine user stories using standard agile formats.</p>
      </div>

      {/* Stories list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        {stories.map((story) => (
          <div key={story.id} className="card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="badge badge-indigo">{story.id}</span>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>• Epic: {story.epic}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "12px" }}>
                <span style={{ fontWeight: "600" }}>{story.points} Story Points</span>
                <span className={`badge ${
                  story.status === "Done" ? "badge-success" :
                  story.status === "In Progress" ? "badge-indigo" : "badge-gray"
                }`}>
                  {story.status}
                </span>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "4px" }}>{story.title}</h4>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", fontStyle: "italic", background: "var(--bg-app)", padding: "10px", borderRadius: "var(--radius-sm)", borderLeft: "3px solid var(--border-hover)", lineHeight: "1.4" }}>
                "{story.template}"
              </p>
            </div>

            {/* DOD Checklist state & AI suggestion */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", paddingTop: "var(--space-2)", borderTop: "1px solid var(--border-secondary)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px", color: story.dod === "Passed" ? "var(--success-color)" : "var(--text-muted)" }}>
                <CheckCircle size={12} />
                <span>Definition of Done: <strong>{story.dod}</strong></span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--primary-text)" }}>
                <Sparkles size={12} />
                <span>AI Suggestion: Verify UI performance requirements before QA approval.</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
