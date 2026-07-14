import React, { useState, useEffect } from "react";
import { Play, Pause, Square, UserPlus, Terminal, Cpu, HardDrive, Sparkles, RefreshCw } from "lucide-react";
import api from "../lib/api";

export default function AIEmployees() {
  const [selectedAgent, setSelectedAgent] = useState("PM Agent");
  const [agents, setAgents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Poll agent states from backend every 2s
  useEffect(() => {
    loadAgentStates();
    const interval = setInterval(loadAgentStates, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadAgentStates = async () => {
    try {
      const list = await api.getAgentStates();
      // Map names to match selection keys if needed
      setAgents(list);
    } catch (err) {
      console.error("Failed to load agent states", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getAgentLogs = (agentName, status, task) => {
    const defaultLogs = [
      `[INFO] Booting agent framework for ${agentName}...`,
      `[SUCCESS] Security context initialized.`,
      `[INFO] Current Status: ${status}`
    ];
    if (status === "Executing") {
      return [
        ...defaultLogs,
        `[RUNNING] Active on task: ${task || "Processing workspace requirements..."}`,
        `[PROCESS] Injecting prompt templates & resolved skills...`,
        `[PROCESS] Reasoning via DeepSeek API gateway...`
      ];
    }
    if (status === "Planning") {
      return [
        ...defaultLogs,
        `[PLANNING] Loading workspace context and historical decisions...`,
        `[PLANNING] Performing guardrails checks & permissions check...`
      ];
    }
    if (status === "Idle") {
      return [
        ...defaultLogs,
        `[IDLE] Awaiting assignment. CPU load set to standby.`
      ];
    }
    return defaultLogs;
  };

  const activeAgentData = agents.find(a => a.name === selectedAgent) || agents[0];
  const currentLogs = activeAgentData 
    ? getAgentLogs(activeAgentData.name, activeAgentData.status, activeAgentData.current_task)
    : ["[INFO] Loading console stream..."];

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)", height: "100%" }}>
      {/* Page Title */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ marginBottom: "4px" }}>AI Employees Center</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>Monitor metrics, control active workloads, and review logs for your AI staff.</p>
        </div>
        <span 
          className="badge" 
          style={{ 
            background: "var(--success-light)", 
            color: "var(--success-text)", 
            display: "flex", 
            alignItems: "center", 
            gap: "4px",
            fontSize: "12px",
            padding: "4px 12px"
          }}
        >
          <Sparkles size={12} />
          {agents.length} Active Digital Employees
        </span>
      </div>

      {/* Main Workspace Layout */}
      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px", gap: "8px", color: "var(--text-secondary)" }}>
          <RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} />
          <span>Polling digital employee profiles...</span>
        </div>
      ) : (
        <div style={{ display: "flex", gap: "var(--space-6)", height: "calc(100vh - 200px)", overflow: "hidden" }}>
          
          {/* Cards Grid */}
          <div style={{ flex: 1, overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "var(--space-4)", height: "100%", paddingRight: "4px" }}>
            {agents.map((agent) => {
              const isSelected = selectedAgent === agent.name;
              return (
                <div 
                  key={agent.name} 
                  className="card"
                  onClick={() => setSelectedAgent(agent.name)}
                  style={{ 
                    border: isSelected ? "1.5px solid var(--primary-color)" : "1px solid var(--border-primary)",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-3)",
                    position: "relative",
                    background: isSelected ? "var(--bg-hover)" : "var(--bg-card)",
                    transition: "all 0.15s"
                  }}
                >
                  {/* Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-primary)" }}>{agent.name}</strong>
                    <span className={`badge ${
                      agent.status === "Executing" ? "badge-indigo" :
                      agent.status === "Planning" ? "badge-warning" : "badge-gray"
                    }`}>
                      {agent.status}
                    </span>
                  </div>

                  {/* Subtask assignment */}
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)", minHeight: "36px", lineHeight: "1.4" }}>
                    <strong>Workload:</strong> {agent.current_task || "Idle Standby"}
                  </div>

                  {/* Meters */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", borderTop: "1px solid var(--border-secondary)", paddingTop: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--text-muted)" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "2px" }}><Cpu size={10} /> CPU: {agent.cpu}%</span>
                      <span style={{ display: "flex", alignItems: "center", gap: "2px" }}><HardDrive size={10} /> RAM: {agent.ram}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--text-muted)" }}>
                      <span>Tokens: {agent.tokens}</span>
                      <span>ETA: {agent.eta}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Live Logs Console Sidebar */}
          <div 
            className="card" 
            style={{ 
              width: "320px", 
              background: "#050505", 
              borderColor: "#1a1a1a",
              color: "#00ff66", 
              fontFamily: "var(--font-mono)", 
              display: "flex", 
              flexDirection: "column", 
              padding: "var(--space-4)",
              height: "100%",
              borderRadius: "var(--radius-md)"
            }}
          >
            <div style={{ borderBottom: "1px solid #1a1a1a", paddingBottom: "8px", marginBottom: "var(--space-3)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#ffffff", fontSize: "12px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
                <Terminal size={14} style={{ color: "#00ff66" }} />
                Logs: {selectedAgent}
              </span>
              <span style={{ fontSize: "9px", background: "#111", padding: "2px 6px", borderRadius: "3px", color: "#888" }}>Tailing</span>
            </div>

            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px", fontSize: "11px" }}>
              {currentLogs.map((log, idx) => (
                <div key={idx} style={{ lineBreak: "anywhere" }}>
                  {log}
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
