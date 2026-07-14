import React, { useState } from "react";
import { Layers, ArrowUpDown, Sparkles, Filter, Plus } from "lucide-react";

export default function Features() {
  const [features, setFeatures] = useState([
    { id: "FEAT-12", title: "Visual Workflow Node Builder", value: 9, complexity: 6, impact: "High", storyPoints: 8 },
    { id: "FEAT-13", title: "Vercel-inspired Deployment logs stream", value: 8, complexity: 4, impact: "Medium", storyPoints: 5 },
    { id: "FEAT-14", title: "Git-integrated zero-trust code scans", value: 10, complexity: 8, impact: "High", storyPoints: 13 },
    { id: "FEAT-15", title: "Slack integration webhook nodes", value: 6, complexity: 2, impact: "Low", storyPoints: 2 }
  ]);

  const calculatePriority = (val, comp, impact) => {
    const impactVal = impact === "High" ? 3 : impact === "Medium" ? 2 : 1;
    return ((val * impactVal) / comp).toFixed(1);
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      {/* Title */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ marginBottom: "4px" }}>Features Backlog</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>Evaluate feature ROI using Value, Complexity, and Business Impact matrices.</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button className="btn btn-secondary btn-sm" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <Filter size={12} />
            <span>Filter</span>
          </button>
          <button className="btn btn-primary btn-sm" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <Plus size={12} />
            <span>New Feature</span>
          </button>
        </div>
      </div>

      {/* Prioritization Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Feature Name</th>
              <th>Value (1-10)</th>
              <th>Complexity (1-10)</th>
              <th>Business Impact</th>
              <th>Story Points</th>
              <th>AI Score</th>
            </tr>
          </thead>
          <tbody>
            {features.map((feat) => {
              const score = calculatePriority(feat.value, feat.complexity, feat.impact);
              return (
                <tr key={feat.id}>
                  <td><span className="badge badge-gray">{feat.id}</span></td>
                  <td><strong>{feat.title}</strong></td>
                  <td>{feat.value}</td>
                  <td>{feat.complexity}</td>
                  <td>
                    <span className={`badge ${
                      feat.impact === "High" ? "badge-success" :
                      feat.impact === "Medium" ? "badge-warning" : "badge-gray"
                    }`}>
                      {feat.impact}
                    </span>
                  </td>
                  <td>{feat.storyPoints} pts</td>
                  <td>
                    <span 
                      style={{ 
                        display: "inline-flex", 
                        alignItems: "center", 
                        gap: "4px",
                        color: "var(--primary-text)", 
                        background: "var(--primary-light)", 
                        padding: "2px 6px",
                        borderRadius: "var(--radius-xs)",
                        fontWeight: "600",
                        fontSize: "11px"
                      }}
                    >
                      <Sparkles size={10} />
                      {score}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Highlight Box */}
      <div className="card" style={{ background: "var(--bg-panel)", borderLeft: "3px solid var(--primary-color)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
          <Sparkles size={14} style={{ color: "var(--primary-color)" }} />
          <h4 style={{ fontSize: "13px", fontWeight: "600" }}>AI Priority Calculation Details</h4>
        </div>
        <p style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
          AI Score is calculated using <code>(Value × ImpactMultiplier) / Complexity</code>. 
          Impact multiplier values: High (3x), Medium (2x), Low (1x). 
          Features with scores above <strong>4.0</strong> represent highest immediate ROI and are auto-prioritized in Kanban backlog slots.
        </p>
      </div>
    </div>
  );
}
