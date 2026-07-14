import React, { useState, useEffect, useRef } from "react";
import { Search, Navigation, Zap, Sliders, Moon, Bot, BookOpen } from "lucide-react";

export default function CommandPalette({ isOpen, onClose, onSelectAction }) {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  const commands = [
    { category: "Navigation", title: "Go to Dashboard", shortcut: "G D", icon: Navigation, action: "nav:dashboard" },
    { category: "Navigation", title: "Go to Tasks & Kanban", shortcut: "G T", icon: Navigation, action: "nav:tasks" },
    { category: "Navigation", title: "Go to AI Employees", shortcut: "G E", icon: Bot, action: "nav:ai-employees" },
    { category: "Navigation", title: "Go to Knowledge Center", shortcut: "G K", icon: BookOpen, action: "nav:knowledge" },
    { category: "Navigation", title: "Go to Automation Center", shortcut: "G A", icon: Zap, action: "nav:automation" },
    { category: "AI Commands", title: "/generate-prd Draft a new product requirement doc", shortcut: "/prd", icon: Zap, action: "ai:generate-prd" },
    { category: "AI Commands", title: "/audit-code Trigger developer code security scan", shortcut: "/audit", icon: Zap, action: "ai:audit" },
    { category: "AI Commands", title: "/pause-agents Pause all active employee logs", shortcut: "/pause", icon: Bot, action: "ai:pause-agents" },
    { category: "System Actions", title: "Toggle Light / Dark mode", shortcut: "⌘T", icon: Moon, action: "sys:toggle-theme" },
    { category: "System Actions", title: "Configure Platform Integrations", shortcut: "⌘I", icon: Sliders, action: "nav:integrations" }
  ];

  const filteredCommands = commands.filter(cmd => 
    cmd.title.toLowerCase().includes(search.toLowerCase()) ||
    cmd.category.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredCommands.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          onSelectAction(filteredCommands[selectedIndex].action);
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands]);

  if (!isOpen) return null;

  return (
    <div className="command-palette-backdrop" onClick={onClose}>
      <div className="command-palette" onClick={(e) => e.stopPropagation()}>
        {/* Search Input */}
        <div className="command-palette-input-wrapper">
          <Search size={18} style={{ color: "var(--text-muted)" }} />
          <input 
            ref={inputRef}
            type="text" 
            className="command-palette-input" 
            placeholder="Type a command or search..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ padding: "2px 6px" }}>Esc</button>
        </div>

        {/* Results */}
        <div className="command-palette-results">
          {filteredCommands.length > 0 ? (
            // Group by category
            Object.entries(
              filteredCommands.reduce((acc, cmd) => {
                if (!acc[cmd.category]) acc[cmd.category] = [];
                acc[cmd.category].push(cmd);
                return acc;
              }, {})
            ).map(([category, items]) => (
              <div key={category}>
                <div 
                  style={{ 
                    fontSize: "10px", 
                    fontWeight: "600", 
                    color: "var(--text-muted)", 
                    padding: "6px 12px", 
                    textTransform: "uppercase" 
                  }}
                >
                  {category}
                </div>
                {items.map((cmd) => {
                  const cmdIdx = filteredCommands.indexOf(cmd);
                  const isSelected = cmdIdx === selectedIndex;
                  const Icon = cmd.icon;
                  return (
                    <div 
                      key={cmd.title} 
                      className={`command-item ${isSelected ? "selected" : ""}`}
                      onClick={() => {
                        onSelectAction(cmd.action);
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(cmdIdx)}
                    >
                      <div className="command-item-left">
                        <Icon size={14} style={{ color: isSelected ? "var(--primary-color)" : "var(--text-secondary)" }} />
                        <span>{cmd.title}</span>
                      </div>
                      <span className="command-item-shortcut">{cmd.shortcut}</span>
                    </div>
                  );
                })}
              </div>
            ))
          ) : (
            <div style={{ padding: "var(--space-6)", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
              No commands found matching "{search}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
