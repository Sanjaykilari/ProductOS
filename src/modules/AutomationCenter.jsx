import React, { useState } from "react";
import { Zap, Play, Plus, GitBranch, Shield, Send, Terminal, Settings2 } from "lucide-react";

export default function AutomationCenter() {
  const [selectedNode, setSelectedNode] = useState("Trigger Node");

  const nodes = [
    { id: "node-1", type: "trigger", title: "Git Push to Main", subtitle: "GitHub Webhook", icon: GitBranch, details: "Triggers on any commit merge to primary branch." },
    { id: "node-2", type: "condition", title: "Verify Security Scan", subtitle: "SecurityAgent check", icon: Shield, details: "Halts pipeline if vulnerabilities exceed threshold." },
    { id: "node-3", type: "action", title: "Deploy Production Pipeline", subtitle: "DevOpsAgent build", icon: Terminal, details: "Initiates staging compilation & deploys to Vercel." },
    { id: "node-4", type: "action", title: "Alert Slack Channel", subtitle: "Slack API Webhook", icon: Send, details: "Sends release changelog logs to #product-alerts." }
  ];

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)", height: "calc(100vh - 160px)" }}>
      {/* Title */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ marginBottom: "4px" }}>Automation Workflows</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>Orchestrate triggers, condition boundaries, and multi-agent action pipelines.</p>
        </div>
        <button className="btn btn-primary btn-sm">
          <Plus size={14} />
          <span>New Workflow</span>
        </button>
      </div>

      {/* Visual Workspace */}
      <div style={{ display: "flex", gap: "var(--space-6)", flex: 1, overflow: "hidden" }}>
        
        {/* Canvas Area */}
        <div 
          className="card" 
          style={{ 
            flex: 1, 
            background: "var(--bg-panel)", 
            position: "relative",
            overflow: "auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundImage: "radial-gradient(var(--border-primary) 1.5px, transparent 1.5px)",
            backgroundSize: "20px 20px"
          }}
        >
          {/* Connector SVGs */}
          <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
            <line x1="50%" y1="95px" x2="50%" y2="155px" stroke="var(--primary-color)" strokeWidth="2" strokeDasharray="4 4" />
            <line x1="50%" y1="235px" x2="50%" y2="295px" stroke="var(--primary-color)" strokeWidth="2" strokeDasharray="4 4" />
            
            {/* Split lines to actions */}
            <path d="M 50% 375 L 50% 400 Q 50% 415 40% 415 L 30% 415 L 30% 450" fill="none" stroke="var(--primary-color)" strokeWidth="2" />
            <path d="M 50% 375 L 50% 400 Q 50% 415 60% 415 L 70% 415 L 70% 450" fill="none" stroke="var(--primary-color)" strokeWidth="2" />
          </svg>

          {/* Flows Node Grid */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "60px", zIndex: 10 }}>
            {/* Node 1: Trigger */}
            <div 
              className="card"
              onClick={() => setSelectedNode("GitHub Trigger")}
              style={{ width: "220px", padding: "12px", border: "1.5px solid var(--primary-color)", cursor: "pointer", background: "var(--bg-card)" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ padding: "6px", borderRadius: "var(--radius-xs)", background: "var(--primary-light)", color: "var(--primary-text)" }}>
                  <GitBranch size={16} />
                </div>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: "700" }}>{nodes[0].title}</div>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>{nodes[0].subtitle}</div>
                </div>
              </div>
            </div>

            {/* Node 2: Condition */}
            <div 
              className="card"
              onClick={() => setSelectedNode("Security Condition")}
              style={{ width: "220px", padding: "12px", border: "1px solid var(--border-primary)", cursor: "pointer", background: "var(--bg-card)" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ padding: "6px", borderRadius: "var(--radius-xs)", background: "var(--warning-light)", color: "var(--warning-text)" }}>
                  <Shield size={16} />
                </div>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: "700" }}>{nodes[1].title}</div>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>{nodes[1].subtitle}</div>
                </div>
              </div>
            </div>

            {/* Node 3: Action */}
            <div 
              className="card"
              onClick={() => setSelectedNode("Deployment Action")}
              style={{ width: "220px", padding: "12px", border: "1px solid var(--border-primary)", cursor: "pointer", background: "var(--bg-card)" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ padding: "6px", borderRadius: "var(--radius-xs)", background: "var(--success-light)", color: "var(--success-text)" }}>
                  <Terminal size={16} />
                </div>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: "700" }}>{nodes[2].title}</div>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>{nodes[2].subtitle}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Properties Panel Sidebar */}
        <div className="card" style={{ width: "260px", display: "flex", flexDirection: "column", gap: "var(--space-4)", height: "100%" }}>
          <div style={{ borderBottom: "1px solid var(--border-secondary)", paddingBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
            <Settings2 size={16} style={{ color: "var(--primary-color)" }} />
            <h3 style={{ fontSize: "13px" }}>Node Configuration</h3>
          </div>
          
          <div>
            <h4 style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-primary)" }}>{selectedNode}</h4>
            <p style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px", lineHeight: "1.4" }}>
              Configure operational parameters, API keys, and notification bounds for this workflow node.
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Trigger Rule</label>
            <select className="select" defaultValue="push">
              <option value="push">On Git Push (Commit)</option>
              <option value="pr">On Pull Request Open</option>
              <option value="cron">On Scheduled Timer</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Active Environment</label>
            <select className="select" defaultValue="staging">
              <option value="staging">Staging Preview</option>
              <option value="production">Production Server</option>
            </select>
          </div>

          <div style={{ marginTop: "auto" }}>
            <button className="btn btn-primary btn-sm" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
              <Play size={12} />
              <span>Test Node Execution</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
