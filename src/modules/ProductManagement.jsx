import React, { useState } from "react";
import { Target, FileText, Sparkles, Brain, ArrowRight, User, Eye, Edit } from "lucide-react";
import api from "../lib/api";

export default function ProductManagement() {
  const [activeSubTab, setActiveSubTab] = useState("prd");
  const [prdTitle, setPrdTitle] = useState("AI-Native Auto-Prioritization Engine");
  const [isGenerating, setIsGenerating] = useState(false);
  const [prdContent, setPrdContent] = useState(
    `# PRD-104: AI-Native Auto-Prioritization Engine\n\n## 1. Overview\nBuild an intelligent scheduling and scoring module that parses task complexity, team velocity, and business impact to auto-sort backlog cards.\n\n## 2. Objectives\n- Reduce sprint planning overhead by 40%.\n- Mitigate manual RICE scoring errors.`
  );

  const triggerAIGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await api.chat({
        prompt: `Write a core requirements section for the following PRD:\nTitle: ${prdTitle}\nContext: ${prdContent}\n\nProvide only 3 bullet points of detailed requirements.`,
        agentId: "PM Agent"
      });
      setPrdContent(prev => prev + `\n\n## 3. Core Requirements (AI Generated)\n${response.text}`);
    } catch (err) {
      alert(`AI Generation failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const competitors = [
    { name: "ProductOS", ai: "Full Context multi-agent staff", UX: "Instant, Keyboard-first", speed: "120ms latency" },
    { name: "Jira Software", ai: "Basic static templates", UX: "Heavy, complex menus", speed: "1.2s latency" },
    { name: "Linear App", ai: "No default agents", UX: "Clean, keyboard-first", speed: "180ms latency" }
  ];

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      {/* Module Title */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ marginBottom: "4px" }}>Product Strategy & Framework</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>Define vision, formulate PRDs, draft user personas, and review competitive metrics.</p>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="tabs">
        <button 
          className={`tab-item ${activeSubTab === "vision" ? "active" : ""}`}
          onClick={() => setActiveSubTab("vision")}
        >
          Vision & Goals
        </button>
        <button 
          className={`tab-item ${activeSubTab === "prd" ? "active" : ""}`}
          onClick={() => setActiveSubTab("prd")}
        >
          PRD Generator
        </button>
        <button 
          className={`tab-item ${activeSubTab === "personas" ? "active" : ""}`}
          onClick={() => setActiveSubTab("personas")}
        >
          User Personas
        </button>
        <button 
          className={`tab-item ${activeSubTab === "competitors" ? "active" : ""}`}
          onClick={() => setActiveSubTab("competitors")}
        >
          Competitor Analysis
        </button>
      </div>

      {/* Sub Tab contents */}
      <div style={{ flex: 1 }}>
        {activeSubTab === "vision" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
            <div className="card" style={{ background: "linear-gradient(to right, var(--bg-card), var(--primary-light))" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "var(--space-2)" }}>
                <Target size={18} style={{ color: "var(--primary-color)" }} />
                <h3 style={{ fontSize: "16px" }}>The Core Vision</h3>
              </div>
              <p style={{ fontSize: "14px", color: "var(--text-primary)", lineHeight: "1.6", fontStyle: "italic" }}>
                "Empower product organizations to build, validate, and ship features 10x faster by deploying specialized, autonomous AI employees that handle coordination, security scans, unit tests, and code generation seamlessly."
              </p>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-6)" }}>
              <div className="card">
                <h4 style={{ marginBottom: "var(--space-2)" }}>Business Objectives</h4>
                <ul style={{ paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px", color: "var(--text-secondary)" }}>
                  <li>Achieve sub-second page loads across the platform (Vercel-level performance).</li>
                  <li>Enable custom slack hooks and workflow builders (Notion-level customizability).</li>
                  <li>Incorporate zero-trust code scans on staging branches automatically.</li>
                </ul>
              </div>
              <div className="card">
                <h4 style={{ marginBottom: "var(--space-2)" }}>Success Metrics (KPIs)</h4>
                <ul style={{ paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px", color: "var(--text-secondary)" }}>
                  <li>Monthly Active Users (MAU) retention rate exceeding 92%.</li>
                  <li>DeveloperAgent code merge rate approval above 85% on first review.</li>
                  <li>QA Bug leak rate in production kept below 1.2%.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === "prd" && (
          <div style={{ display: "flex", gap: "var(--space-6)", flexWrap: "wrap" }}>
            {/* PRD Text Editor Panel */}
            <div className="card" style={{ flex: 1, minWidth: "320px", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <input 
                  type="text" 
                  value={prdTitle} 
                  onChange={(e) => setPrdTitle(e.target.value)}
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    background: "transparent",
                    border: "none",
                    color: "var(--text-primary)",
                    outline: "none",
                    width: "80%"
                  }}
                />
                <div style={{ display: "flex", gap: "4px" }}>
                  <button className="btn btn-secondary btn-icon btn-sm"><Eye size={12} /></button>
                  <button className="btn btn-secondary btn-icon btn-sm"><Edit size={12} /></button>
                </div>
              </div>
              
              <textarea 
                className="textarea" 
                value={prdContent}
                onChange={(e) => setPrdContent(e.target.value)}
                style={{ flex: 1, minHeight: "220px", fontFamily: "var(--font-mono)", fontSize: "12px", background: "var(--bg-app)" }}
              />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Last saved by PMAgent 15m ago</span>
                <button 
                  onClick={triggerAIGenerate}
                  className="btn btn-primary btn-sm" 
                  disabled={isGenerating}
                >
                  <Sparkles size={12} />
                  <span>{isGenerating ? "AI is Writing..." : "Enhance Section with AI"}</span>
                </button>
              </div>
            </div>

            {/* AI Prompts list */}
            <div style={{ width: "260px", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              <div className="card" style={{ background: "var(--bg-panel)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "var(--space-2)" }}>
                  <Brain size={14} style={{ color: "var(--primary-color)" }} />
                  <h4 style={{ fontSize: "12px", fontWeight: "600" }}>AI Recommendation</h4>
                </div>
                <p style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                  "Based on competitor research, consider adding requirements detailing offline persistence using local-indexed database synchronization."
                </p>
                <button className="btn btn-secondary btn-sm" style={{ width: "100%", marginTop: "8px", fontSize: "10px" }}>
                  Insert Offline Spec
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === "personas" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-6)" }}>
            <div className="card" style={{ display: "flex", gap: "var(--space-4)" }}>
              <div 
                style={{ 
                  width: "48px", 
                  height: "48px", 
                  borderRadius: "var(--radius-md)", 
                  background: "var(--primary-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--primary-color)",
                  flexShrink: 0
                }}
              >
                <User size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: "15px", marginBottom: "2px" }}>Sarah, Lead PM</h3>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "var(--space-2)" }}>Enterprise Tech Co. • 120 teammates</div>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                  <strong>Pain Point:</strong> Spending 2-3 hours daily writing Jira descriptions, resolving dependencies, and coordinating manual code audits.
                </p>
              </div>
            </div>
            <div className="card" style={{ display: "flex", gap: "var(--space-4)" }}>
              <div 
                style={{ 
                  width: "48px", 
                  height: "48px", 
                  borderRadius: "var(--radius-md)", 
                  background: "var(--success-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--success-color)",
                  flexShrink: 0
                }}
              >
                <User size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: "15px", marginBottom: "2px" }}>Alex, DevOps Director</h3>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "var(--space-2)" }}>Rapid Growth Startup • 30 teammates</div>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                  <strong>Pain Point:</strong> Ensuring developer commits pass compliance checklists without slowing down production pipelines.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === "competitors" && (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Competitor</th>
                  <th>AI employee Integration</th>
                  <th>Layout UX</th>
                  <th>Performance Latency</th>
                </tr>
              </thead>
              <tbody>
                {competitors.map((c) => (
                  <tr key={c.name} style={{ background: c.name === "ProductOS" ? "var(--primary-light)" : "transparent" }}>
                    <td><strong>{c.name}</strong></td>
                    <td style={{ color: c.name === "ProductOS" ? "var(--primary-text)" : "var(--text-secondary)" }}>{c.ai}</td>
                    <td>{c.UX}</td>
                    <td>{c.speed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
