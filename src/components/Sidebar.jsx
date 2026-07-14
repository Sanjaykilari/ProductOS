import React, { useState } from "react";
import { 
  LayoutDashboard, 
  FolderKanban, 
  Target, 
  Shield, 
  Bot, 
  BookOpen, 
  MessageSquare, 
  Activity, 
  Terminal, 
  Link, 
  Layers, 
  ListTodo, 
  Zap, 
  ChevronsLeft, 
  ChevronsRight,
  Database,
  Building,
  Sparkles,
  Sliders
} from "lucide-react";

export default function Sidebar({ activeModule, setActiveModule, collapsed, setCollapsed }) {
  const [workspace, setWorkspace] = useState("ProductOS Dev");
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);

  const modules = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "projects", label: "Projects", icon: FolderKanban },
    { id: "product-mgmt", label: "Product Strategy", icon: Target },
    { id: "epics", label: "Epics", icon: Shield },
    { id: "features", label: "Features", icon: Layers },
    { id: "stories", label: "User Stories", icon: MessageSquare },
    { id: "tasks", label: "Tasks & Kanban", icon: ListTodo, badge: 12 },
    { id: "ai-employees", label: "AI Employees", icon: Bot, badge: "Live" },
    { id: "knowledge", label: "Knowledge Center", icon: BookOpen },
    { id: "ai-chat", label: "AI Chat Room", icon: Sparkles },
    { id: "automation", label: "Automation Center", icon: Zap },
    { id: "integrations", label: "Integrations", icon: Link },
    { id: "deployment", label: "Deployment Center", icon: Terminal },
    { id: "analytics", label: "Analytics & Health", icon: Activity },
    { id: "ai-admin", label: "AI Admin Portal", icon: Sliders, badge: "Sec" }
  ];

  const workspaces = ["ProductOS Dev", "Marketing Strategy", "Mobile App Core", "Design System"];

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* Workspace Switcher */}
      <div className="sidebar-header">
        <div 
          className="sidebar-brand" 
          onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
          style={{ cursor: "pointer", position: "relative", width: "100%" }}
        >
          <Building size={18} className="nav-item-icon" style={{ color: "var(--primary-color)" }} />
          {!collapsed && (
            <span className="sidebar-brand-text" style={{ fontSize: "14px", fontWeight: "600" }}>
              {workspace}
            </span>
          )}
          
          {showWorkspaceMenu && !collapsed && (
            <div 
              style={{
                position: "absolute",
                top: "40px",
                left: 0,
                width: "100%",
                background: "var(--bg-card)",
                border: "1px solid var(--border-primary)",
                borderRadius: "var(--radius-sm)",
                padding: "4px 0",
                boxShadow: "var(--shadow-lg)",
                zIndex: 50
              }}
            >
              {workspaces.map((ws) => (
                <div 
                  key={ws} 
                  onClick={(e) => {
                    e.stopPropagation();
                    setWorkspace(ws);
                    setShowWorkspaceMenu(false);
                  }}
                  style={{
                    padding: "8px 12px",
                    fontSize: "12px",
                    color: ws === workspace ? "var(--primary-color)" : "var(--text-secondary)",
                    background: ws === workspace ? "var(--bg-active)" : "transparent",
                    transition: "background var(--transition-fast)"
                  }}
                  onMouseEnter={(e) => e.target.style.background = "var(--bg-active)"}
                  onMouseLeave={(e) => e.target.style.background = ws === workspace ? "var(--bg-active)" : "transparent"}
                >
                  {ws}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <button 
          onClick={() => setCollapsed(!collapsed)} 
          className="btn btn-ghost btn-icon"
          style={{ padding: "4px" }}
        >
          {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="sidebar-nav">
        {modules.map((mod) => {
          const Icon = mod.icon;
          const isActive = activeModule === mod.id;
          return (
            <div
              key={mod.id}
              onClick={() => setActiveModule(mod.id)}
              className={`nav-item ${isActive ? "active" : ""}`}
            >
              <div className="nav-item-left">
                <span className="nav-item-icon">
                  <Icon size={16} />
                </span>
                <span className="nav-item-label">{mod.label}</span>
              </div>
              {mod.badge && (
                <span 
                  className="nav-item-badge" 
                  style={{ 
                    background: mod.id === "ai-employees" ? "var(--success-light)" : "var(--primary-light)",
                    color: mod.id === "ai-employees" ? "var(--success-text)" : "var(--primary-text)"
                  }}
                >
                  {mod.badge}
                </span>
              )}
            </div>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        {!collapsed ? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div 
              style={{ 
                width: "28px", 
                height: "28px", 
                borderRadius: "var(--radius-full)", 
                background: "linear-gradient(135deg, #6366f1, #a855f7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: "600"
              }}
            >
              SK
            </div>
            <div>
              <div style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-primary)" }}>Sanjay Kilari</div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>Workspace Admin</div>
            </div>
          </div>
        ) : (
          <div 
            style={{ 
              width: "28px", 
              height: "28px", 
              borderRadius: "var(--radius-full)", 
              background: "linear-gradient(135deg, #6366f1, #a855f7)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              fontWeight: "600",
              margin: "0 auto"
            }}
          >
            SK
          </div>
        )}
      </div>
    </aside>
  );
}
