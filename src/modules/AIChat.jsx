import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Sparkles, Send, Bot, User, Zap, ChevronDown,
  CheckCircle, Clock, RefreshCw, X, Copy,
  Layers, Code, Shield, Cpu, Check, Users as UsersIcon,
  FileText, Database, Paintbrush, Bug, Rocket, BookOpen, Search
} from "lucide-react";
import api from "../lib/api";

const AGENT_OPTIONS = [
  { id: "PM Agent",            label: "PM Agent",            icon: Layers,     color: "#6366f1", desc: "PRDs, Roadmaps, Epics, Stories", category: "Product" },
  { id: "Research Agent",      label: "Research Agent",      icon: Search,     color: "#06b6d4", desc: "Market, APIs, Best Practices", category: "Product" },
  { id: "Architecture Agent",  label: "Architecture Agent",  icon: Cpu,        color: "#f59e0b", desc: "System Design, Tech Stack", category: "Engineering" },
  { id: "Developer Agent",     label: "Developer Agent",     icon: Code,       color: "#10b981", desc: "Code, Refactor, Debug, Review", category: "Engineering" },
  { id: "Frontend Agent",      label: "Frontend Agent",      icon: Paintbrush, color: "#f97316", desc: "UI Components, Pages, Layouts", category: "Engineering" },
  { id: "Backend Agent",       label: "Backend Agent",       icon: Code,       color: "#84cc16", desc: "APIs, Services, Business Logic", category: "Engineering" },
  { id: "Database Agent",      label: "Database Agent",      icon: Database,   color: "#14b8a6", desc: "Schema, Indexes, Migrations", category: "Engineering" },
  { id: "UI Agent",            label: "UI/UX Agent",         icon: Paintbrush, color: "#e879f9", desc: "Design Tokens, Wireframes", category: "Engineering" },
  { id: "QA Agent",            label: "QA Agent",            icon: Bug,        color: "#8b5cf6", desc: "Tests, Regression, Quality", category: "Quality" },
  { id: "Security Agent",      label: "Security Agent",      icon: Shield,     color: "#ef4444", desc: "OWASP, Auth, Compliance", category: "Quality" },
  { id: "DevOps Agent",        label: "DevOps Agent",        icon: Rocket,     color: "#ec4899", desc: "CI/CD, Docker, Cloud, Deploy", category: "Operations" },
  { id: "Documentation Agent", label: "Doc Agent",           icon: BookOpen,   color: "#a78bfa", desc: "API Docs, Wiki, Release Notes", category: "Operations" },
];

const CATEGORIES = ["Product", "Engineering", "Quality", "Operations"];

const BUILD_PROMPTS = [
  "Build me a SaaS product management tool",
  "Create a REST API for a social media app",
  "Design architecture for an e-commerce platform",
  "Generate user stories for a mobile banking app",
  "Build authentication & authorization system",
  "Create a real-time chat application",
];

function TypingIndicator() {
  return (
    <div style={{ display: "flex", gap: "4px", padding: "4px 0", alignItems: "center" }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: "6px", height: "6px", borderRadius: "50%",
          background: "var(--primary-color)", opacity: 0.7,
          animation: `bounce 1.2s infinite ${i * 0.2}s`
        }} />
      ))}
    </div>
  );
}

function MessageBubble({ msg, onCopy }) {
  const isUser = msg.sender === "user";
  const isStreaming = msg.streaming;

  return (
    <div style={{
      display: "flex", gap: "12px",
      flexDirection: isUser ? "row-reverse" : "row",
      alignItems: "flex-start",
      animation: "fadeSlideIn 0.3s ease"
    }}>
      {/* Avatar */}
      <div style={{
        width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0,
        background: isUser
          ? "linear-gradient(135deg, #6366f1, #a855f7)"
          : msg.agentColor
            ? `linear-gradient(135deg, ${msg.agentColor}22, ${msg.agentColor}44)`
            : "var(--bg-active)",
        border: msg.agentColor && !isUser ? `2px solid ${msg.agentColor}55` : "none",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {isUser
          ? <User size={14} color="#fff" />
          : <Bot size={14} color={msg.agentColor || "var(--primary-color)"} />
        }
      </div>

      <div style={{ maxWidth: "78%", display: "flex", flexDirection: "column", gap: "4px" }}>
        {/* Agent label */}
        {!isUser && msg.agent && (
          <span style={{ fontSize: "10px", fontWeight: "700", color: msg.agentColor || "var(--primary-color)", letterSpacing: "0.04em" }}>
            {msg.agent}
          </span>
        )}

        {/* Bubble */}
        <div style={{
          background: isUser
            ? "linear-gradient(135deg, var(--primary-color), #7c3aed)"
            : "var(--bg-hover)",
          color: isUser ? "#fff" : "var(--text-primary)",
          padding: "10px 14px",
          borderRadius: isUser ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
          fontSize: "13px", lineHeight: "1.6",
          border: isUser ? "none" : "1px solid var(--border-secondary)",
          wordBreak: "break-word", whiteSpace: "pre-wrap",
        }}>
          {isStreaming ? (
            <>{msg.text || ""}<span style={{ opacity: 0.5, animation: "blink 1s infinite" }}>▊</span></>
          ) : (
            msg.text
          )}
        </div>

        {/* Project generated card */}
        {msg.projectResult && (
          <div style={{
            background: "linear-gradient(135deg, var(--primary-color)11, #7c3aed11)",
            border: "1px solid var(--primary-color)44",
            borderRadius: "12px", padding: "12px 14px", marginTop: "4px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
              <CheckCircle size={14} color="#10b981" />
              <span style={{ fontSize: "12px", fontWeight: "700", color: "#10b981" }}>Project Generated!</span>
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
              <strong style={{ color: "var(--text-primary)" }}>{msg.projectResult.title}</strong>
              <br />Project ID: <code style={{ fontSize: "11px", background: "var(--bg-active)", padding: "2px 5px", borderRadius: "4px" }}>{msg.projectResult.projectId}</code>
            </div>
            <div style={{ marginTop: "8px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {["Epics", "Features", "Stories", "Tasks", "Documents"].map(t => (
                <span key={t} style={{
                  fontSize: "11px", padding: "2px 8px", borderRadius: "999px",
                  background: "var(--primary-color)22", color: "var(--primary-color)", fontWeight: "600"
                }}>{t} ✓</span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {!isUser && !isStreaming && (
          <div style={{ display: "flex", gap: "6px", marginTop: "2px" }}>
            <button
              onClick={() => onCopy(msg.text)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "2px", borderRadius: "4px", display: "flex", alignItems: "center", gap: "3px", fontSize: "11px" }}
              title="Copy"
            >
              <Copy size={11} /> Copy
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AIChat() {
  const [messages, setMessages] = useState([
    {
      id: 1, sender: "assistant", agent: "ProductOS AI",
      agentColor: "#6366f1",
      text: "👋 Welcome to the AI Command Room!\n\nI'm your intelligent workspace. You can:\n• Ask me to **build anything** — I'll generate a full project backlog with documents\n• Select **multiple agents** to get perspectives from different specialists\n• Use suggested prompts below to get started instantly\n\nTry: \"Build me a SaaS analytics dashboard\"",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [input, setInput] = useState("");
  const [selectedAgents, setSelectedAgents] = useState([AGENT_OPTIONS[0]]);
  const [agentPanelOpen, setAgentPanelOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [telemetry, setTelemetry] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const conversationId = useRef(`conv-${Date.now()}`);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    api.getTelemetry().then(setTelemetry).catch(() => {});
    const interval = setInterval(() => api.getTelemetry().then(setTelemetry).catch(() => {}), 15000);
    return () => clearInterval(interval);
  }, []);

  const addMessage = (msg) => {
    setMessages(prev => [...prev, { id: Date.now() + Math.random(), ...msg }]);
  };

  // Agent multi-select toggle
  const toggleAgent = (agent) => {
    setSelectedAgents(prev => {
      const exists = prev.find(a => a.id === agent.id);
      if (exists) {
        // Don't allow zero agents
        if (prev.length === 1) return prev;
        return prev.filter(a => a.id !== agent.id);
      }
      return [...prev, agent];
    });
  };

  const selectAll = () => setSelectedAgents([...AGENT_OPTIONS]);
  const selectNone = () => setSelectedAgents([AGENT_OPTIONS[0]]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setInput("");
    setIsLoading(true);

    const userMsg = {
      id: Date.now(), sender: "user", text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };
    setMessages(prev => [...prev, userMsg]);

    const isBuildIntent = /\b(build|create|generate|make|design|develop|scaffold)\b/i.test(text);

    if (isBuildIntent) {
      const thinkId = Date.now() + 1;
      setMessages(prev => [...prev, {
        id: thinkId, sender: "assistant",
        agent: "PM Agent", agentColor: "#6366f1",
        text: "🧠 Analyzing your idea and spinning up the AI Product Team…\nGenerating Projects, Epics, Features, Stories, Tasks, and Documents…",
        streaming: false,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }]);

      try {
        const result = await api.initiateProject(text);

        setMessages(prev => prev.map(m => m.id === thinkId ? {
          ...m,
          text: `✅ Your project has been structured and queued for approval!\n\nThe PM Agent analyzed your idea and generated:\n• Full project roadmap\n• Epics, Features & User Stories\n• Tasks with dependencies & agent assignments\n• PRD, Technical Spec & Epic Brief documents\n\nHead to **Projects** to review, approve, and execute!`,
          streaming: false,
          projectResult: { title: result.title, projectId: result.projectId }
        } : m));

        setTimeout(() => {
          addMessage({
            sender: "assistant", agent: "PM Agent", agentColor: "#6366f1",
            text: `📋 Next steps:\n1. Go to **Projects** → find "${result.title}"\n2. Review the generated Epics, Tasks & Documents\n3. Click **Approve All** to approve the entire project\n4. Click **Execute** on individual tasks to run agents!`,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          });
        }, 800);

      } catch (err) {
        setMessages(prev => prev.map(m => m.id === thinkId ? {
          ...m, text: `⚠️ Could not generate project: ${err.message}\n\nMake sure the backend server is running at http://localhost:5001`,
          streaming: false
        } : m));
      }
    } else {
      // Send to all selected agents sequentially
      for (let i = 0; i < selectedAgents.length; i++) {
        const agent = selectedAgents[i];
        const streamMsgId = Date.now() + i + 1;

        setMessages(prev => [...prev, {
          id: streamMsgId, sender: "assistant",
          agent: agent.label, agentColor: agent.color,
          text: "", streaming: true,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }]);

        let accumulated = "";

        await new Promise((resolve) => {
          api.streamChat(
            { prompt: text, agentId: agent.id, conversationId: conversationId.current },
            (chunk) => {
              accumulated += chunk;
              setMessages(prev => prev.map(m => m.id === streamMsgId
                ? { ...m, text: accumulated }
                : m
              ));
            },
            (fullText) => {
              setMessages(prev => prev.map(m => m.id === streamMsgId
                ? { ...m, text: fullText || accumulated, streaming: false }
                : m
              ));
              resolve();
            },
            (err) => {
              setMessages(prev => prev.map(m => m.id === streamMsgId
                ? { ...m, text: `⚠️ ${err}`, streaming: false }
                : m
              ));
              resolve();
            }
          );
        });
      }
    }

    setIsLoading(false);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 96px)", gap: 0 }}>
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: "16px" }}>
        <h1 style={{ marginBottom: "4px", fontSize: "22px" }}>AI Command Room</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
          Ask any AI Agent to build features, analyze data, generate code, or manage your workspace.
        </p>
      </div>

      {/* ─── Live Status Bar ─────────────────────────────────────────── */}
      {telemetry && (
        <div style={{
          display: "flex", gap: "20px", padding: "8px 16px",
          background: "var(--bg-hover)", borderRadius: "10px", marginBottom: "12px",
          border: "1px solid var(--border-secondary)", flexWrap: "wrap"
        }}>
          {[
            { label: "Projects", value: telemetry.projectCount, color: "#6366f1" },
            { label: "Tasks", value: telemetry.taskCount, color: "#10b981" },
            { label: "Docs", value: telemetry.documentCount || 0, color: "#a78bfa" },
            { label: "Completed", value: `${telemetry.completionRate}%`, color: "#f59e0b" },
            { label: "Active", value: telemetry.activeTasks, color: "#ef4444" },
          ].map(s => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: s.color }} />
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{s.label}:</span>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-primary)" }}>{s.value}</span>
            </div>
          ))}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "4px" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: "11px", color: "#10b981", fontWeight: "600" }}>DeepSeek Live</span>
          </div>
        </div>
      )}

      {/* ─── Main chat area ──────────────────────────────────────────── */}
      <div className="card" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", padding: 0, minHeight: 0 }}>

        {/* Messages feed */}
        <div style={{
          flex: 1, overflowY: "auto", padding: "20px 24px",
          display: "flex", flexDirection: "column", gap: "16px",
          scrollbarWidth: "thin"
        }}>
          {messages.map(msg => (
            <MessageBubble key={msg.id} msg={msg} onCopy={handleCopy} />
          ))}
          {isLoading && messages[messages.length - 1]?.sender !== "assistant" && (
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <div style={{
                width: "32px", height: "32px", borderRadius: "50%",
                background: "var(--bg-active)", display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <Bot size={14} color="var(--primary-color)" />
              </div>
              <div style={{
                background: "var(--bg-hover)", padding: "10px 14px",
                borderRadius: "4px 16px 16px 16px",
                border: "1px solid var(--border-secondary)"
              }}>
                <TypingIndicator />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ─── Selected Agents Pills Bar ────────────────────────────── */}
        <div style={{
          padding: "8px 20px",
          background: "var(--bg-hover)",
          borderTop: "1px solid var(--border-secondary)",
          display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center"
        }}>
          <span style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginRight: "4px" }}>
            Active Agents:
          </span>
          {selectedAgents.map(ag => {
            const Icon = ag.icon;
            return (
              <div key={ag.id} style={{
                display: "inline-flex", alignItems: "center", gap: "4px",
                padding: "3px 8px", borderRadius: "999px",
                background: `${ag.color}18`, border: `1px solid ${ag.color}44`,
                fontSize: "11px", fontWeight: "600", color: ag.color,
              }}>
                <Icon size={10} />
                {ag.label}
                {selectedAgents.length > 1 && (
                  <button
                    onClick={() => toggleAgent(ag)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: ag.color, padding: 0, display: "flex", marginLeft: "2px" }}
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Suggested build prompts */}
        <div style={{
          padding: "10px 20px",
          background: "var(--bg-hover)",
          borderTop: "1px solid var(--border-secondary)"
        }}>
          <div style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>
            Quick Build Prompts
          </div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {BUILD_PROMPTS.map((p, i) => (
              <button key={i} onClick={() => { setInput(p); inputRef.current?.focus(); }}
                style={{
                  background: "var(--bg-card)", border: "1px solid var(--border-primary)",
                  color: "var(--text-secondary)", fontSize: "11px", padding: "4px 10px",
                  borderRadius: "999px", cursor: "pointer", transition: "all 0.15s",
                  whiteSpace: "nowrap"
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--primary-color)"; e.currentTarget.style.color = "var(--primary-color)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-primary)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Input row */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border-primary)" }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
            {/* Agent selector button */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setAgentPanelOpen(o => !o)}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  background: selectedAgents.length > 1 
                    ? "linear-gradient(135deg, #6366f118, #10b98118)" 
                    : `${selectedAgents[0].color}18`,
                  border: selectedAgents.length > 1 
                    ? "1px solid #6366f144" 
                    : `1px solid ${selectedAgents[0].color}44`,
                  borderRadius: "10px", padding: "8px 10px", cursor: "pointer",
                  color: selectedAgents.length > 1 ? "#6366f1" : selectedAgents[0].color,
                  fontSize: "12px", fontWeight: "600",
                  whiteSpace: "nowrap", transition: "all 0.15s"
                }}
              >
                <UsersIcon size={13} />
                {selectedAgents.length === 1 ? selectedAgents[0].label : `${selectedAgents.length} Agents`}
                <ChevronDown size={11} style={{ opacity: 0.6 }} />
              </button>

              {/* ─── Multi-agent selector panel ─── */}
              {agentPanelOpen && (
                <div style={{
                  position: "absolute", bottom: "100%", left: 0, marginBottom: "6px",
                  background: "var(--bg-card)", border: "1px solid var(--border-primary)",
                  borderRadius: "12px", boxShadow: "var(--shadow-xl)",
                  width: "280px", maxHeight: "400px", overflowY: "auto",
                  zIndex: 100, animation: "fadeSlideIn 0.15s ease"
                }}>
                  {/* Panel header */}
                  <div style={{
                    padding: "10px 14px", borderBottom: "1px solid var(--border-secondary)",
                    display: "flex", justifyContent: "space-between", alignItems: "center"
                  }}>
                    <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-primary)" }}>
                      Select Agents ({selectedAgents.length})
                    </span>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={selectAll} style={{
                        background: "none", border: "none", cursor: "pointer",
                        fontSize: "10px", fontWeight: "600", color: "var(--primary-color)"
                      }}>All</button>
                      <button onClick={selectNone} style={{
                        background: "none", border: "none", cursor: "pointer",
                        fontSize: "10px", fontWeight: "600", color: "var(--text-muted)"
                      }}>Reset</button>
                    </div>
                  </div>

                  {/* Category groups */}
                  {CATEGORIES.map(cat => (
                    <div key={cat}>
                      <div style={{
                        padding: "6px 14px", fontSize: "9px", fontWeight: "700",
                        color: "var(--text-muted)", textTransform: "uppercase",
                        letterSpacing: "0.08em", background: "var(--bg-hover)"
                      }}>
                        {cat}
                      </div>
                      {AGENT_OPTIONS.filter(a => a.category === cat).map(ag => {
                        const Icon = ag.icon;
                        const isSelected = selectedAgents.some(a => a.id === ag.id);
                        return (
                          <button key={ag.id}
                            onClick={() => toggleAgent(ag)}
                            style={{
                              display: "flex", alignItems: "center", gap: "10px",
                              width: "100%", padding: "8px 14px", background: "none",
                              border: "none", cursor: "pointer", textAlign: "left",
                              borderBottom: "1px solid var(--border-secondary)",
                              transition: "background 0.1s"
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
                            onMouseLeave={e => e.currentTarget.style.background = "none"}
                          >
                            {/* Checkbox */}
                            <div style={{
                              width: "18px", height: "18px", borderRadius: "4px",
                              border: isSelected ? `2px solid ${ag.color}` : "2px solid var(--border-primary)",
                              background: isSelected ? `${ag.color}` : "transparent",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              flexShrink: 0, transition: "all 0.15s"
                            }}>
                              {isSelected && <Check size={11} color="#fff" strokeWidth={3} />}
                            </div>
                            <div style={{
                              width: "26px", height: "26px", borderRadius: "6px",
                              background: `${ag.color}20`, display: "flex", alignItems: "center",
                              justifyContent: "center", flexShrink: 0
                            }}>
                              <Icon size={12} color={ag.color} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-primary)" }}>{ag.label}</div>
                              <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "1px" }}>{ag.desc}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Text input */}
            <div style={{
              flex: 1, display: "flex", alignItems: "center",
              background: "var(--bg-app)", border: "1px solid var(--border-primary)",
              borderRadius: "12px", padding: "8px 14px", gap: "8px",
              transition: "border 0.15s"
            }}>
              <input
                ref={inputRef}
                type="text"
                placeholder={`Ask ${selectedAgents.length === 1 ? selectedAgents[0].label : `${selectedAgents.length} agents`}… or "Build me a [product]"`}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                disabled={isLoading}
                style={{
                  border: "none", background: "transparent", outline: "none",
                  fontSize: "13px", flex: 1, color: "var(--text-primary)"
                }}
              />
              {isLoading && <RefreshCw size={14} style={{ color: "var(--text-muted)", animation: "spin 1s linear infinite", flexShrink: 0 }} />}
            </div>

            {/* Send */}
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              style={{
                background: input.trim() && !isLoading
                  ? "linear-gradient(135deg, var(--primary-color), #7c3aed)"
                  : "var(--bg-hover)",
                border: "none", borderRadius: "12px",
                padding: "10px 14px", cursor: input.trim() && !isLoading ? "pointer" : "not-allowed",
                color: input.trim() && !isLoading ? "#fff" : "var(--text-muted)",
                display: "flex", alignItems: "center", gap: "6px",
                fontSize: "13px", fontWeight: "600", transition: "all 0.15s",
                whiteSpace: "nowrap"
              }}
            >
              <Send size={14} />
              {isLoading ? "Thinking…" : "Send"}
            </button>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", fontSize: "10px", color: "var(--text-muted)" }}>
            <span>Press <kbd style={{ background: "var(--bg-hover)", padding: "1px 4px", borderRadius: "3px", fontSize: "9px" }}>Enter</kbd> to send • {selectedAgents.length} agent{selectedAgents.length !== 1 ? "s" : ""} selected • Model: DeepSeek V3</span>
            <span style={{ color: "#10b981" }}>● Connected to backend</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
        @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0; } }
        @keyframes bounce { 0%,80%,100% { transform:translateY(0); } 40% { transform:translateY(-6px); } }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
      `}
      </style>
    </div>
  );
}
