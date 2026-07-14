import React, { useState, useEffect } from "react";
import { Folder, Clock, Users, ShieldAlert, CheckCircle, ArrowRight, Sparkles, RefreshCw, ThumbsUp } from "lucide-react";
import api from "../lib/api";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [selectedProj, setSelectedProj] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const list = await api.getProjects();
      setProjects(list);
      if (list.length > 0) {
        setSelectedProj(list[0]);
      }
    } catch (err) {
      console.error("Failed to load projects", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveProject = async (projectId) => {
    setIsApproving(true);
    try {
      await api.approveArtifact("Project", projectId);
      // Reload projects list to show updated status
      const list = await api.getProjects();
      setProjects(list);
      const updated = list.find(p => p.id === projectId);
      if (updated) setSelectedProj(updated);
    } catch (err) {
      alert(`Approval failed: ${err.message}`);
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ marginBottom: "4px" }}>Project Workspace Overview</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
            Monitor active milestones, track blockers, and coordinate AI Employees.
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
          No active projects in the database. Head to the <strong>AI Chat Room</strong> and ask the AI to "Build me a..." to create one!
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: "var(--space-6)" }}>
          {/* Projects sidebar list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <h3 style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase" }}>Projects Directory</h3>
            {projects.map(p => (
              <div 
                key={p.id}
                onClick={() => setSelectedProj(p)}
                className={`card card-interactive ${selectedProj?.id === p.id ? "active-border" : ""}`}
                style={{ 
                  padding: "12px", 
                  cursor: "pointer",
                  border: selectedProj?.id === p.id ? "1.5px solid var(--primary-color)" : "1px solid var(--border-primary)",
                  background: selectedProj?.id === p.id ? "var(--bg-hover)" : "var(--bg-card)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <Folder size={14} style={{ color: "var(--primary-color)" }} />
                  <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)" }}>{p.title}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                  <span style={{ fontSize: "9px", color: "var(--text-muted)" }}>ID: {p.id.substring(0, 10)}</span>
                  <span className={`badge ${p.status === "Approved" ? "badge-success" : "badge-gray"}`} style={{ fontSize: "9px", padding: "1px 5px" }}>
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Project Details */}
          {selectedProj && (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
              {/* Hero detail card */}
              <div className="card" style={{ display: "flex", flexDirection: "column", gap: "12px", borderLeft: `4px solid ${selectedProj.status === "Approved" ? "var(--success-color)" : "var(--primary-color)"}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h2 style={{ fontSize: "18px", fontWeight: "700" }}>{selectedProj.title}</h2>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>Timeline: {selectedProj.timeline || "4 Weeks"} • Complexity: {selectedProj.complexity || "Medium"}</p>
                  </div>
                  {selectedProj.status !== "Approved" && (
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => handleApproveProject(selectedProj.id)}
                      disabled={isApproving}
                      style={{ display: "flex", alignItems: "center", gap: "6px" }}
                    >
                      <ThumbsUp size={12} />
                      <span>{isApproving ? "Approving..." : "Approve Roadmap"}</span>
                    </button>
                  )}
                </div>

                <div style={{ borderTop: "1px solid var(--border-secondary)", paddingTop: "12px", marginTop: "4px" }}>
                  <h4 style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "6px" }}>Project Vision</h4>
                  <p style={{ fontSize: "13px", color: "var(--text-primary)", lineHeight: "1.5", margin: 0 }}>{selectedProj.vision}</p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "8px" }}>
                  <div>
                    <h4 style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "4px" }}>Goals & Objectives</h4>
                    <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>{selectedProj.goals}</p>
                  </div>
                  <div>
                    <h4 style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "4px" }}>Business Case</h4>
                    <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>{selectedProj.business_case}</p>
                  </div>
                </div>

                <div style={{ background: "var(--bg-hover)", borderRadius: "8px", padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)" }}>Target Tech Stack:</span>
                  <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--primary-color)", fontFamily: "var(--font-mono)" }}>{selectedProj.tech_stack || "React + Node.js"}</span>
                </div>
              </div>

              {/* Milestones and Mock Timeline list */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "var(--space-6)", alignItems: "flex-start" }}>
                <div className="card">
                  <h3 style={{ marginBottom: "12px" }}>Backlog Roadmap Timeline</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      <span className="badge badge-indigo" style={{ width: "80px" }}>Sprint 1</span>
                      <span style={{ fontSize: "12px", color: "var(--text-primary)" }}>Setup router endpoints, migrate database config structures.</span>
                    </div>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      <span className="badge badge-indigo" style={{ width: "80px" }}>Sprint 2</span>
                      <span style={{ fontSize: "12px", color: "var(--text-primary)" }}>Implement CSS variables layout design tokens and theme switches.</span>
                    </div>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      <span className="badge badge-gray" style={{ width: "80px" }}>Sprint 3</span>
                      <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Verify encryption models and run OWASP security audit logs.</span>
                    </div>
                  </div>
                </div>

                <div className="card" style={{ borderLeft: "3px solid var(--warning-color)", background: "var(--bg-panel)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                    <ShieldAlert size={14} style={{ color: "var(--warning-color)" }} />
                    <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--warning-text)" }}>AI Risk Assessment</span>
                  </div>
                  <p style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: "1.4", margin: 0 }}>
                    PM Agent calculates a <strong>Low-Medium</strong> risk rating. Code validation gates ensure all tasks must pass QA Agent Cypress tests prior to build packaging.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
