import React, { useState } from "react";
import { 
  Search, 
  Plus, 
  Bell, 
  Sun, 
  Moon, 
  Monitor, 
  PanelRight, 
  Check, 
  Info, 
  AlertTriangle 
} from "lucide-react";

export default function Header({ 
  activeModule, 
  theme, 
  setTheme, 
  aiPanelCollapsed, 
  setAiPanelCollapsed,
  onSearchClick,
  onCreateTaskClick 
}) {
  const [showNotifications, setShowNotifications] = useState(false);

  const formatModuleName = (id) => {
    if (!id) return "";
    return id.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  const notifications = [
    { id: 1, type: "info", text: "DevAgent compiled routing logic successfully.", time: "2m ago" },
    { id: 2, type: "warning", text: "QAAgent found 3 critical failing tests in auth module.", time: "12m ago" },
    { id: 3, type: "success", text: "Production release v2.4.0 completed rollback.", time: "45m ago" },
    { id: 4, type: "info", text: "PMAgent completed generating PRD for AI Chat Room.", time: "1h ago" }
  ];

  return (
    <header className="header">
      {/* Left section: Breadcrumbs */}
      <div className="header-left">
        <div className="breadcrumbs">
          <span style={{ color: "var(--text-muted)", fontWeight: "500" }}>ProductOS</span>
          <span className="breadcrumb-separator">/</span>
          <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>
            {formatModuleName(activeModule)}
          </span>
        </div>
      </div>

      {/* Right section: Controls */}
      <div className="header-right">
        {/* Global Search trigger */}
        <div className="global-search-trigger" onClick={onSearchClick}>
          <Search size={14} />
          <span>Search or Command...</span>
          <span className="search-shortcut">⌘K</span>
        </div>

        {/* Quick Create Button */}
        <button className="btn btn-primary btn-sm" onClick={onCreateTaskClick}>
          <Plus size={14} />
          <span>Create Task</span>
        </button>

        {/* Theme Selector */}
        <div 
          style={{ 
            display: "flex", 
            alignItems: "center", 
            border: "1px solid var(--border-primary)", 
            borderRadius: "var(--radius-sm)",
            padding: "2px",
            background: "var(--bg-active)"
          }}
        >
          <button 
            onClick={() => setTheme("light")} 
            className="btn btn-ghost btn-icon btn-sm"
            style={{ 
              padding: "4px", 
              background: theme === "light" ? "var(--bg-card)" : "transparent",
              boxShadow: theme === "light" ? "var(--shadow-sm)" : "none",
              color: theme === "light" ? "var(--primary-color)" : "var(--text-secondary)"
            }}
            title="Light Theme"
          >
            <Sun size={14} />
          </button>
          <button 
            onClick={() => setTheme("dark")} 
            className="btn btn-ghost btn-icon btn-sm"
            style={{ 
              padding: "4px", 
              background: theme === "dark" ? "var(--bg-card)" : "transparent",
              boxShadow: theme === "dark" ? "var(--shadow-sm)" : "none",
              color: theme === "dark" ? "var(--primary-color)" : "var(--text-secondary)"
            }}
            title="Dark Theme"
          >
            <Moon size={14} />
          </button>
        </div>

        {/* Notification Center */}
        <div style={{ position: "relative" }}>
          <button 
            className="btn btn-ghost btn-icon"
            onClick={() => setShowNotifications(!showNotifications)}
            style={{ position: "relative" }}
          >
            <Bell size={16} />
            <span 
              style={{
                position: "absolute",
                top: "6px",
                right: "6px",
                width: "6px",
                height: "6px",
                borderRadius: "var(--radius-full)",
                background: "var(--error-color)"
              }}
            />
          </button>

          {showNotifications && (
            <div 
              style={{
                position: "absolute",
                top: "40px",
                right: 0,
                width: "280px",
                background: "var(--bg-card)",
                border: "1px solid var(--border-primary)",
                borderRadius: "var(--radius-md)",
                boxShadow: "var(--shadow-lg)",
                padding: "8px",
                zIndex: 100
              }}
            >
              <div 
                style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  padding: "8px", 
                  borderBottom: "1px solid var(--border-secondary)", 
                  fontSize: "12px", 
                  fontWeight: "600" 
                }}
              >
                <span>Agent Alerts</span>
                <span style={{ color: "var(--primary-color)", cursor: "pointer" }}>Mark all read</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", padding: "4px 0" }}>
                {notifications.map((n) => (
                  <div 
                    key={n.id} 
                    style={{ 
                      padding: "8px", 
                      fontSize: "11px", 
                      borderRadius: "var(--radius-sm)", 
                      background: "var(--bg-hover)",
                      borderLeft: `3px solid ${
                        n.type === "success" ? "var(--success-color)" : 
                        n.type === "warning" ? "var(--warning-color)" : 
                        "var(--primary-color)"
                      }`
                    }}
                  >
                    <div style={{ color: "var(--text-primary)" }}>{n.text}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: "9px", marginTop: "2px" }}>{n.time}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Collapsible right AI Panel trigger */}
        <button 
          className={`btn ${aiPanelCollapsed ? "btn-ghost" : "btn-secondary"} btn-icon`}
          onClick={() => setAiPanelCollapsed(!aiPanelCollapsed)}
          title="Toggle AI Copilot"
        >
          <PanelRight size={16} style={{ color: aiPanelCollapsed ? "var(--text-secondary)" : "var(--primary-color)" }} />
        </button>
      </div>
    </header>
  );
}
