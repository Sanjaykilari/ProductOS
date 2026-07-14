import React, { useState, useEffect } from "react";
import { Terminal, Shield, RefreshCw, Layers, CheckCircle2, AlertOctagon, Sparkles } from "lucide-react";

export default function DeploymentCenter() {
  const [activeTab, setActiveTab] = useState("pipelines");
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [rollbackSuccess, setRollbackSuccess] = useState(false);
  const [logs, setLogs] = useState([
    "[10:45:02] PM: Initiating build v2.4.1 deployment trigger...",
    "[10:45:05] DEV: Bundling assets with Vite compiler...",
    "[10:45:09] SEC: Zero-trust code scans verified. 0 vulnerabilities found.",
    "[10:45:12] QA: Executed 12 cypress regressions. Success rate 100%.",
    "[10:45:15] DEVOPS: Compiling production Docker containers...",
    "[10:45:20] SYSTEM: Deployment succeeded on staging domain. URL: dev.productos.co"
  ]);

  const pipelineStages = [
    { name: "Trigger Hook", status: "success", info: "GitHub push commit 9f12" },
    { name: "Unit Tests", status: "success", info: "QA regression coverage 98%" },
    { name: "Security Check", status: "success", info: "SecAgent static dependency check" },
    { name: "Asset Bundle", status: "success", info: "Vite build optimized bundle" },
    { name: "Deployment", status: "active", info: "Deploying preview container..." }
  ];

  const handleRollback = () => {
    setIsRollingBack(true);
    setTimeout(() => {
      setLogs(prev => [
        ...prev,
        "[10:47:11] ROLLBACK: Initiated rollback procedure to v2.4.0...",
        "[10:47:13] SYSTEM: Re-routing load balancer dns targets...",
        "[10:47:15] SYSTEM: Deployment reverted to v2.4.0 successfully."
      ]);
      setIsRollingBack(false);
      setRollbackSuccess(true);
      setTimeout(() => setRollbackSuccess(false), 3000);
    }, 1500);
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)", height: "calc(100vh - 160px)" }}>
      {/* Title & Env Summary */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ marginBottom: "4px" }}>Deployment pipelines</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>Monitor active CI/CD environments, roll back production releases, and inspect log outputs.</p>
        </div>
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <button 
            className="btn btn-danger btn-sm"
            onClick={handleRollback}
            disabled={isRollingBack}
          >
            <RefreshCw size={12} className={isRollingBack ? "animate-spin" : ""} />
            <span>{isRollingBack ? "Reverting Build..." : "Rollback Release"}</span>
          </button>
        </div>
      </div>

      {rollbackSuccess && (
        <div className="alert alert-success animate-fade-in">
          <CheckCircle2 size={16} />
          <span>Release v2.4.0 restored. Production traffic redirected successfully.</span>
        </div>
      )}

      {/* Main Grid */}
      <div style={{ display: "flex", gap: "var(--space-6)", flex: 1, overflow: "hidden", flexWrap: "wrap" }}>
        
        {/* Stages list & status */}
        <div style={{ flex: 1, minWidth: "300px", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          
          {/* Environment Status Card */}
          <div className="card" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
            <div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>Production Server</div>
              <h3 style={{ fontSize: "16px", color: "var(--success-color)", marginTop: "4px" }}>v2.4.0 (Active)</h3>
              <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>100% routing targets healthy</span>
            </div>
            <div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>Staging Server</div>
              <h3 style={{ fontSize: "16px", color: "var(--primary-color)", marginTop: "4px" }}>v2.4.1 (Preview)</h3>
              <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Building container node...</span>
            </div>
          </div>

          {/* Timeline Stages */}
          <div className="card" style={{ flex: 1, display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            <h3 style={{ fontSize: "14px" }}>Build Stages Status</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {pipelineStages.map((stage) => (
                <div key={stage.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                  <div>
                    <strong>{stage.name}</strong>
                    <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>{stage.info}</div>
                  </div>
                  <span className={`badge ${
                    stage.status === "success" ? "badge-success" : "badge-indigo"
                  }`}>
                    {stage.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Build Logs Terminal Console */}
        <div 
          className="card"
          style={{
            width: "350px",
            background: "#080808",
            borderColor: "#18181b",
            color: "#00ff66",
            fontFamily: "var(--font-mono)",
            display: "flex",
            flexDirection: "column",
            height: "100%"
          }}
        >
          <div style={{ borderBottom: "1px solid #1a1a1a", paddingBottom: "8px", marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#ffffff", fontSize: "12px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
              <Terminal size={14} style={{ color: "#00ff66" }} />
              Live Deployment Logs
            </span>
            <span style={{ fontSize: "9px", background: "#111", padding: "2px 6px", borderRadius: "3px", color: "#888" }}>v2.4.1 build</span>
          </div>
          
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px", fontSize: "11px" }}>
            {logs.map((log, idx) => (
              <div key={idx} style={{ lineBreak: "anywhere" }}>{log}</div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
