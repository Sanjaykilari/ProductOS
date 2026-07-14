import React, { useState } from "react";
import { Link, Check, ExternalLink, HelpCircle } from "lucide-react";

export default function Integrations() {
  const [apps, setApps] = useState([
    { name: "GitHub Repository Sync", status: "Connected", desc: "Sync commits, branch logs, and triggers with DevOpsAgent.", category: "VCS" },
    { name: "Slack Alerts Webhook", status: "Connected", desc: "Stream release alerts and compiler failure logs directly.", category: "Communication" },
    { name: "Figma Design Tokens", status: "Connected", desc: "Import variables, radii, and hex codes directly to styling files.", category: "Design" },
    { name: "Claude Code Copilot", status: "Connected", desc: "Enhance agent model queries with long context window models.", category: "AI Models" },
    { name: "Jira Software Sync", status: "Disconnected", desc: "Map stories, tickets, and points to ProductOS Kanban.", category: "Project Management" },
    { name: "Amazon Web Services (AWS)", status: "Disconnected", desc: "Provision cloud infrastructure and monitor S3 bucket triggers.", category: "Cloud" }
  ]);

  const toggleConnection = (name) => {
    setApps(prev => 
      prev.map(app => 
        app.name === name ? { ...app, status: app.status === "Connected" ? "Disconnected" : "Connected" } : app
      )
    );
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      {/* Title */}
      <div>
        <h1 style={{ marginBottom: "4px" }}>Platform Integrations</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>Connect your external services, version control, and design assets to ProductOS.</p>
      </div>

      {/* Grid of integrations */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "var(--space-6)" }}>
        {apps.map((app) => {
          const isConnected = app.status === "Connected";
          return (
            <div 
              key={app.name} 
              className="card"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-3)",
                border: isConnected ? "1px solid var(--border-hover)" : "1px solid var(--border-primary)",
                background: isConnected ? "var(--bg-card)" : "var(--bg-panel)"
              }}
            >
              {/* Card Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div 
                    style={{ 
                      width: "32px", 
                      height: "32px", 
                      borderRadius: "var(--radius-sm)", 
                      background: isConnected ? "var(--primary-light)" : "var(--bg-active)",
                      color: isConnected ? "var(--primary-text)" : "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center" 
                    }}
                  >
                    <Link size={16} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>{app.name}</h3>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{app.category}</span>
                  </div>
                </div>

                <span className={`badge ${isConnected ? "badge-success" : "badge-gray"}`}>
                  {app.status}
                </span>
              </div>

              {/* Description */}
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", minHeight: "36px", lineHeight: "1.4" }}>
                {app.desc}
              </p>

              {/* Action Buttons */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-secondary)", paddingTop: "8px", marginTop: "4px" }}>
                <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "2px" }}>
                  <HelpCircle size={10} />
                  View Scopes
                </span>
                <button 
                  onClick={() => toggleConnection(app.name)}
                  className={`btn ${isConnected ? "btn-secondary" : "btn-primary"} btn-sm`}
                  style={{ padding: "4px 10px", fontSize: "11px" }}
                >
                  {isConnected ? "Disconnect" : "Connect Setup"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
