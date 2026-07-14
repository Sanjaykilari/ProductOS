import React, { useState } from "react";
import { TrendingUp, BarChart2, DollarSign, Bot, Activity, HelpCircle } from "lucide-react";

export default function Analytics() {
  const [metricTab, setMetricTab] = useState("speed");

  const agentStats = [
    { name: "DevAgent", tasks: 24, efficiency: "94%", tokens: "2.4M ($48.00)" },
    { name: "QAAgent", tasks: 18, efficiency: "98.5%", tokens: "1.1M ($22.00)" },
    { name: "PMAgent", tasks: 8, efficiency: "91%", tokens: "600K ($12.00)" },
    { name: "SecurityAgent", tasks: 12, efficiency: "99.2%", tokens: "800K ($16.00)" }
  ];

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      {/* Title */}
      <div>
        <h1 style={{ marginBottom: "4px" }}>Platform Analytics</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>Evaluate developer velocity, calculate average cycle times, and audit agent API costs.</p>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button 
          className={`tab-item ${metricTab === "speed" ? "active" : ""}`}
          onClick={() => setMetricTab("speed")}
        >
          Velocity & Cycle Time
        </button>
        <button 
          className={`tab-item ${metricTab === "cost" ? "active" : ""}`}
          onClick={() => setMetricTab("cost")}
        >
          AI Usage & Agent Cost
        </button>
      </div>

      {/* Tab Contents */}
      {metricTab === "speed" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
          {/* Main Chart Row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "var(--space-6)" }}>
            
            {/* Burndown Chart */}
            <div className="card">
              <h3 style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "var(--space-4)" }}>
                <TrendingUp size={16} style={{ color: "var(--primary-color)" }} />
                Sprint Burndown (Points)
              </h3>
              {/* SVG Line Chart */}
              <div style={{ width: "100%", height: "160px" }}>
                <svg viewBox="0 0 300 150" style={{ width: "100%", height: "100%" }}>
                  {/* Grid Lines */}
                  <line x1="0" y1="20" x2="300" y2="20" stroke="var(--border-secondary)" strokeWidth="1" />
                  <line x1="0" y1="70" x2="300" y2="70" stroke="var(--border-secondary)" strokeWidth="1" />
                  <line x1="0" y1="120" x2="300" y2="120" stroke="var(--border-secondary)" strokeWidth="1" />
                  
                  {/* Ideal Burn Line (Dotted Gray) */}
                  <line x1="10" y1="20" x2="290" y2="120" stroke="var(--text-muted)" strokeWidth="1.5" strokeDasharray="4 4" />
                  
                  {/* Actual Burn Line (Solid Indigo) */}
                  <path 
                    d="M 10 20 L 50 20 L 100 45 L 150 55 L 200 80 L 250 95 L 290 120" 
                    fill="none" 
                    stroke="var(--primary-color)" 
                    strokeWidth="2.5" 
                    strokeLinecap="round"
                  />
                  {/* Gradient Area under curve */}
                  <path
                    d="M 10 20 L 50 20 L 100 45 L 150 55 L 200 80 L 250 95 L 290 120 L 290 140 L 10 140 Z"
                    fill="url(#grad)"
                    opacity="0.1"
                  />
                  <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="var(--primary-color)" />
                      <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--text-muted)", marginTop: "8px" }}>
                <span>Day 1 (48 pts)</span>
                <span>Day 7 (24 pts)</span>
                <span>Day 14 (0 pts)</span>
              </div>
            </div>

            {/* Cycle Time Chart */}
            <div className="card">
              <h3 style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "var(--space-4)" }}>
                <BarChart2 size={16} style={{ color: "var(--success-color)" }} />
                Average Cycle Time (Days)
              </h3>
              {/* SVG Column Chart */}
              <div style={{ width: "100%", height: "160px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "var(--space-4)", padding: "0 10px" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                  <div style={{ height: "45px", width: "100%", background: "var(--border-hover)", borderRadius: "3px 3px 0 0" }} />
                  <span style={{ fontSize: "9px", color: "var(--text-muted)", marginTop: "4px" }}>Sprint 1</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                  <div style={{ height: "75px", width: "100%", background: "var(--border-hover)", borderRadius: "3px 3px 0 0" }} />
                  <span style={{ fontSize: "9px", color: "var(--text-muted)", marginTop: "4px" }}>Sprint 2</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                  <div style={{ height: "60px", width: "100%", background: "var(--border-hover)", borderRadius: "3px 3px 0 0" }} />
                  <span style={{ fontSize: "9px", color: "var(--text-muted)", marginTop: "4px" }}>Sprint 3</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                  <div style={{ height: "30px", width: "100%", background: "var(--primary-color)", borderRadius: "3px 3px 0 0" }} />
                  <span style={{ fontSize: "9px", color: "var(--text-primary)", fontWeight: "600", marginTop: "4px" }}>Sprint 4</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {metricTab === "cost" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
          {/* Card summary row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-4)" }}>
            <div className="card">
              <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>Monthly AI Spend Limit</div>
              <div style={{ fontSize: "20px", fontWeight: "700", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                <DollarSign size={18} style={{ color: "var(--success-color)" }} />
                <span>$98.00 / $500.00</span>
              </div>
            </div>
            <div className="card">
              <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>Tokens Consumed</div>
              <div style={{ fontSize: "20px", fontWeight: "700", marginTop: "4px" }}>4.9M Tokens</div>
            </div>
            <div className="card">
              <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>Average Task Cost</div>
              <div style={{ fontSize: "20px", fontWeight: "700", marginTop: "4px" }}>$0.24 / task</div>
            </div>
          </div>

          {/* Table list of agent token stats */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee Name</th>
                  <th>Tasks Done</th>
                  <th>Task Efficiency Ratio</th>
                  <th>Tokens Used (Cost)</th>
                </tr>
              </thead>
              <tbody>
                {agentStats.map((stat) => (
                  <tr key={stat.name}>
                    <td>
                      <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Bot size={14} style={{ color: "var(--primary-color)" }} />
                        <strong>{stat.name}</strong>
                      </span>
                    </td>
                    <td>{stat.tasks} tasks</td>
                    <td><span className="badge badge-success">{stat.efficiency}</span></td>
                    <td>{stat.tokens}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
