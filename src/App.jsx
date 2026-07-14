import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import AIPanel from "./components/AIPanel";
import CommandPalette from "./components/CommandPalette";

// Import modules
import Dashboard from "./modules/Dashboard";
import Projects from "./modules/Projects";
import ProductManagement from "./modules/ProductManagement";
import Epics from "./modules/Epics";
import Features from "./modules/Features";
import Stories from "./modules/Stories";
import Tasks from "./modules/Tasks";
import AIEmployees from "./modules/AIEmployees";
import KnowledgeCenter from "./modules/KnowledgeCenter";
import AIChat from "./modules/AIChat";
import AutomationCenter from "./modules/AutomationCenter";
import Integrations from "./modules/Integrations";
import DeploymentCenter from "./modules/DeploymentCenter";
import Analytics from "./modules/Analytics";
import AIAdminDashboard from "./modules/AIAdminDashboard";

export default function App() {
  const [activeModule, setActiveModule] = useState("dashboard");
  const [theme, setTheme] = useState("dark"); // Defaulting to premium Dark Mode
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [aiPanelCollapsed, setAiPanelCollapsed] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Set the theme class on document element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  // Listen for Cmd+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleCommandAction = (action) => {
    if (action.startsWith("nav:")) {
      const moduleName = action.replace("nav:", "");
      setActiveModule(moduleName);
    } else if (action === "sys:toggle-theme") {
      setTheme(prev => (prev === "dark" ? "light" : "dark"));
    } else if (action === "ai:generate-prd") {
      setActiveModule("product-mgmt");
    } else if (action === "ai:pause-agents") {
      setActiveModule("ai-employees");
    }
  };

  const [sharedState, setSharedState] = useState({ activeDocId: null });

  const renderModule = () => {
    switch (activeModule) {
      case "dashboard":
        return <Dashboard setActiveModule={setActiveModule} />;
      case "projects":
        return <Projects onNavigateToDoc={(docId) => {
          setSharedState({ activeDocId: docId });
          setActiveModule("knowledge");
        }} />;
      case "product-mgmt":
        return <ProductManagement />;
      case "epics":
        return <Epics />;
      case "features":
        return <Features />;
      case "stories":
        return <Stories />;
      case "tasks":
        return <Tasks />;
      case "ai-employees":
        return <AIEmployees />;
      case "knowledge":
        return <KnowledgeCenter 
          activeDocId={sharedState.activeDocId} 
          onDocCleared={() => setSharedState({ activeDocId: null })} 
        />;
      case "ai-chat":
        return <AIChat />;
      case "automation":
        return <AutomationCenter />;
      case "integrations":
        return <Integrations />;
      case "deployment":
        return <DeploymentCenter />;
      case "analytics":
        return <Analytics />;
      case "ai-admin":
        return <AIAdminDashboard />;
      default:
        return <Dashboard setActiveModule={setActiveModule} />;
    }
  };

  return (
    <div className="app-shell">
      {/* Sidebar Navigation */}
      <Sidebar 
        activeModule={activeModule} 
        setActiveModule={setActiveModule} 
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      {/* Main Content Area */}
      <div className="main-viewport">
        {/* Top Header */}
        <Header 
          activeModule={activeModule}
          theme={theme}
          setTheme={setTheme}
          aiPanelCollapsed={aiPanelCollapsed}
          setAiPanelCollapsed={setAiPanelCollapsed}
          onSearchClick={() => setCommandPaletteOpen(true)}
          onCreateTaskClick={() => setActiveModule("tasks")}
        />

        {/* Viewport for active module components */}
        <main className="module-content">
          {renderModule()}
        </main>

        {/* Floating AI Copilot Trigger */}
        {aiPanelCollapsed && (
          <button 
            className="floating-ai-trigger" 
            onClick={() => setAiPanelCollapsed(false)}
            title="Open AI Assistant"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3a6 6 0 0 0-9 9v7c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-7a6 6 0 0 0-9-9Z"/>
              <path d="M8 15h.01"/>
              <path d="M16 15h.01"/>
            </svg>
          </button>
        )}
      </div>

      {/* Collapsible Right Panel */}
      <AIPanel 
        activeModule={activeModule} 
        collapsed={aiPanelCollapsed} 
        setCollapsed={setAiPanelCollapsed}
      />

      {/* Spotlight Command Search Modal */}
      <CommandPalette 
        isOpen={commandPaletteOpen} 
        onClose={() => setCommandPaletteOpen(false)}
        onSelectAction={handleCommandAction}
      />
    </div>
  );
}
