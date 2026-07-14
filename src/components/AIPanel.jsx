import React, { useState, useEffect, useRef, useCallback } from "react";
import { Sparkles, Send, Bot, X, CornerDownLeft, RefreshCw, Copy, ChevronDown, Zap, CheckCircle } from "lucide-react";
import api from "../lib/api";

const MODULE_CONTEXT = {
  dashboard:    { title: "Dashboard Copilot",   color: "#6366f1", suggestions: ["Summarize project health", "Show blocked tasks", "Draft status update"] },
  projects:     { title: "Project Coordinator", color: "#10b981", suggestions: ["List my projects", "Check milestone risks", "Show epic progress"] },
  "product-mgmt":{ title: "PM Copilot",         color: "#f59e0b", suggestions: ["Write PRD for Auth flow", "Analyze user journeys", "Draft release scope"] },
  epics:        { title: "Epic Architect",       color: "#8b5cf6", suggestions: ["Find epic blockers", "Suggest story breakdown", "Generate epic roadmap"] },
  features:     { title: "Feature Planner",      color: "#ec4899", suggestions: ["Run RICE scoring", "Group by business value", "Draft release scope"] },
  tasks:        { title: "Scrum Master",          color: "#06b6d4", suggestions: ["Estimate story points", "Find sprint risks", "Summarize blockers"] },
  stories:      { title: "Story Writer",          color: "#84cc16", suggestions: ["Write acceptance criteria", "Generate test cases", "Split story"] },
  "ai-employees":{ title: "Agent Commander",     color: "#f97316", suggestions: ["Show agent statuses", "Assign security audit", "Check DevOps health"] },
  knowledge:    { title: "Wiki Librarian",        color: "#14b8a6", suggestions: ["Search architecture docs", "Summarize meeting notes", "Draft QA policy"] },
  "ai-chat":    { title: "AI Copilot",            color: "#6366f1", suggestions: ["What can I build?", "Show system status", "Help me write a PRD"] },
  automation:   { title: "Workflow Automator",    color: "#a78bfa", suggestions: ["Suggest trigger for failures", "Create auto-assignment rule", "Explain workflow node"] },
  deployment:   { title: "DevOps Copilot",        color: "#ef4444", suggestions: ["Show build failures", "Predict rollback risk", "Summarize infra status"] },
  analytics:    { title: "BI Analyst",            color: "#fb923c", suggestions: ["Calculate cycle time", "Create burndown report", "Estimate velocity"] },
  "ai-admin":   { title: "AI Admin",              color: "#10b981", suggestions: ["Show token usage", "List active models", "Check provider health"] },
};

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: "3px", padding: "2px 0", alignItems: "center" }}>
      {[0,1,2].map(i => (
        <div key={i} style={{
          width: "5px", height: "5px", borderRadius: "50%", background: "var(--primary-color)",
          animation: `bounce 1.2s infinite ${i * 0.2}s`
        }} />
      ))}
    </div>
  );
}

export default function AIPanel({ activeModule, collapsed, setCollapsed }) {
  const ctx = MODULE_CONTEXT[activeModule] || MODULE_CONTEXT.dashboard;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("copilot");
  const [notifications, setNotifications] = useState([]);
  const [telemetry, setTelemetry] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const convId = useRef(`panel-${Date.now()}`);

  // Welcome message on module change
  useEffect(() => {
    setMessages([{
      id: 1, sender: "assistant",
      text: `Hi! I'm your **${ctx.title}**. Ask me anything about this section or pick a suggestion below.`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }]);
    setInput("");
    convId.current = `panel-${Date.now()}`;
  }, [activeModule]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load notifications & telemetry for insights tab
  useEffect(() => {
    if (activeTab === "insights") {
      api.getNotifications().then(setNotifications).catch(() => {});
      api.getTelemetry().then(setTelemetry).catch(() => {});
    }
  }, [activeTab]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setLoading(true);

    setMessages(prev => [...prev, {
      id: Date.now(), sender: "user", text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }]);

    const streamId = Date.now() + 1;
    setMessages(prev => [...prev, { id: streamId, sender: "assistant", text: "", streaming: true }]);

    let accumulated = "";

    // Add module context to the prompt
    const enrichedPrompt = `[Context: User is on the "${ctx.title}" screen of ProductOS]\n\n${text}`;

    api.streamChat(
      { prompt: enrichedPrompt, agentId: "PM Agent", conversationId: convId.current },
      (chunk) => {
        accumulated += chunk;
        setMessages(prev => prev.map(m => m.id === streamId ? { ...m, text: accumulated } : m));
      },
      (fullText) => {
        setMessages(prev => prev.map(m => m.id === streamId
          ? { ...m, text: fullText || accumulated, streaming: false } : m));
        setLoading(false);
      },
      (err) => {
        setMessages(prev => prev.map(m => m.id === streamId
          ? { ...m, text: `⚠️ ${err}`, streaming: false } : m));
        setLoading(false);
      }
    );
  };

  const handleCopy = (text) => navigator.clipboard.writeText(text).catch(() => {});

  const accentColor = ctx.color;

  return (
    <aside className={`right-ai-panel ${collapsed ? "collapsed" : ""}`}>
      <div className="resizer-handle" />

      {/* Header */}
      <div style={{ padding: "14px 14px 0", borderBottom: "1px solid var(--border-secondary)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <div style={{
              width: "26px", height: "26px", borderRadius: "8px",
              background: `${accentColor}22`, display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Sparkles size={13} style={{ color: accentColor }} />
            </div>
            <div>
              <h3 style={{ fontSize: "13px", fontWeight: "700", lineHeight: 1 }}>{ctx.title}</h3>
              <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#10b981" }} />
                <span style={{ fontSize: "9px", color: "#10b981", fontWeight: "600" }}>DeepSeek Live</span>
              </div>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setCollapsed(true)}>
            <X size={13} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--border-secondary)", marginLeft: "-14px", marginRight: "-14px", paddingLeft: "14px" }}>
          {["copilot", "suggestions", "insights"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: "7px 12px", fontSize: "11px", fontWeight: "600",
                color: activeTab === tab ? accentColor : "var(--text-muted)",
                borderBottom: activeTab === tab ? `2px solid ${accentColor}` : "2px solid transparent",
                marginBottom: "-1px", textTransform: "capitalize", transition: "all 0.15s"
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ─── COPILOT TAB ─────────────────────────────────────────────── */}
      {activeTab === "copilot" && (
        <div style={{ display: "flex", flexDirection: "column", height: "calc(100% - 100px)" }}>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {messages.map(m => (
              <div key={m.id} style={{
                display: "flex", gap: "8px",
                flexDirection: m.sender === "user" ? "row-reverse" : "row",
                alignItems: "flex-start"
              }}>
                <div style={{
                  width: "22px", height: "22px", borderRadius: "50%", flexShrink: 0,
                  background: m.sender === "user" ? "linear-gradient(135deg,#6366f1,#a855f7)" : `${accentColor}22`,
                  border: m.sender !== "user" ? `1.5px solid ${accentColor}44` : "none",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  {m.sender === "user"
                    ? <span style={{ color: "#fff", fontSize: "9px", fontWeight: "700" }}>SK</span>
                    : <Bot size={11} color={accentColor} />
                  }
                </div>
                <div style={{
                  background: m.sender === "user" ? `linear-gradient(135deg,${accentColor},#7c3aed)` : "var(--bg-hover)",
                  color: m.sender === "user" ? "#fff" : "var(--text-primary)",
                  padding: "7px 10px",
                  borderRadius: m.sender === "user" ? "14px 3px 14px 14px" : "3px 14px 14px 14px",
                  fontSize: "12px", lineHeight: "1.55",
                  border: m.sender !== "user" ? "1px solid var(--border-secondary)" : "none",
                  maxWidth: "82%", wordBreak: "break-word", whiteSpace: "pre-wrap"
                }}>
                  {m.streaming
                    ? <>{m.text || ""}<span style={{ opacity: 0.5, animation: "blink 1s infinite" }}>▊</span></>
                    : m.text
                  }
                </div>
              </div>
            ))}
            {loading && messages[messages.length - 1]?.sender !== "assistant" && (
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: `${accentColor}22`, border: `1.5px solid ${accentColor}44`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Bot size={11} color={accentColor} />
                </div>
                <div style={{ background: "var(--bg-hover)", padding: "7px 10px", borderRadius: "3px 14px 14px 14px", border: "1px solid var(--border-secondary)" }}>
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion chips */}
          <div style={{ padding: "8px 14px", background: "var(--bg-hover)", borderTop: "1px solid var(--border-secondary)" }}>
            <div style={{ fontSize: "9px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>Quick Actions</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {ctx.suggestions.map((s, i) => (
                <button key={i} onClick={() => { setInput(s); inputRef.current?.focus(); }}
                  style={{
                    background: "var(--bg-card)", border: "1px solid var(--border-primary)",
                    color: "var(--text-secondary)", fontSize: "11px", padding: "5px 8px",
                    borderRadius: "7px", cursor: "pointer", textAlign: "left", transition: "all 0.12s"
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = accentColor; e.currentTarget.style.color = accentColor; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-primary)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div style={{ padding: "10px 14px", borderTop: "1px solid var(--border-primary)" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "7px",
              background: "var(--bg-app)", border: "1px solid var(--border-primary)",
              borderRadius: "10px", padding: "6px 10px"
            }}>
              <input
                ref={inputRef}
                type="text"
                placeholder="Ask copilot…"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleSend(); }}
                disabled={loading}
                style={{ border: "none", background: "transparent", outline: "none", fontSize: "12px", flex: 1, color: "var(--text-primary)" }}
              />
              {loading
                ? <RefreshCw size={12} style={{ color: "var(--text-muted)", animation: "spin 1s linear infinite" }} />
                : (
                  <button onClick={handleSend} disabled={!input.trim()}
                    style={{
                      background: input.trim() ? accentColor : "var(--bg-hover)",
                      border: "none", borderRadius: "6px", padding: "4px 8px",
                      cursor: input.trim() ? "pointer" : "not-allowed",
                      color: input.trim() ? "#fff" : "var(--text-muted)",
                      display: "flex", alignItems: "center"
                    }}
                  >
                    <Send size={11} />
                  </button>
                )}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: "var(--text-muted)", marginTop: "5px" }}>
              <span>Context: {activeModule}</span>
              <span style={{ display: "flex", alignItems: "center", gap: "2px" }}>Enter <CornerDownLeft size={7} /></span>
            </div>
          </div>
        </div>
      )}

      {/* ─── SUGGESTIONS TAB ─────────────────────────────────────────── */}
      {activeTab === "suggestions" && (
        <div style={{ padding: "14px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ background: `${accentColor}11`, border: `1px solid ${accentColor}33`, borderRadius: "10px", padding: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
              <Sparkles size={13} style={{ color: accentColor }} />
              <span style={{ fontSize: "12px", fontWeight: "700", color: accentColor }}>Build with AI</span>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.5", margin: 0 }}>
              Switch to the <strong>AI Chat</strong> tab and type "Build me a…" to auto-generate full projects, epics, and tasks using DeepSeek.
            </p>
          </div>

          {ctx.suggestions.map((s, i) => (
            <div key={i} style={{ background: "var(--bg-hover)", borderRadius: "10px", padding: "10px 12px", border: "1px solid var(--border-secondary)", cursor: "pointer" }}
              onClick={() => { setActiveTab("copilot"); setInput(s); inputRef.current?.focus(); }}
            >
              <div style={{ fontSize: "12px", color: "var(--text-primary)", fontWeight: "500" }}>{s}</div>
              <div style={{ fontSize: "10px", color: accentColor, marginTop: "3px", fontWeight: "600" }}>Ask {ctx.title} →</div>
            </div>
          ))}
        </div>
      )}

      {/* ─── INSIGHTS TAB ─────────────────────────────────────────────── */}
      {activeTab === "insights" && (
        <div style={{ padding: "14px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
          {telemetry && (
            <>
              <div style={{ borderBottom: "1px solid var(--border-secondary)", paddingBottom: "12px" }}>
                <div style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "8px" }}>Live Workspace</div>
                {[
                  { label: "Projects", value: telemetry.projectCount },
                  { label: "Tasks", value: telemetry.taskCount },
                  { label: "Completed", value: `${telemetry.completionRate}%` },
                  { label: "Blocked", value: telemetry.blockedTasks },
                ].map(s => (
                  <div key={s.label} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "5px" }}>
                    <span style={{ color: "var(--text-secondary)" }}>{s.label}</span>
                    <span style={{ fontWeight: "700", color: "var(--text-primary)" }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <div>
            <div style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "8px" }}>Recent Alerts</div>
            {notifications.length === 0
              ? <div style={{ fontSize: "12px", color: "var(--text-muted)", textAlign: "center", padding: "20px 0" }}>No notifications yet</div>
              : notifications.slice(0, 5).map(n => (
                <div key={n.id} style={{
                  display: "flex", gap: "8px", alignItems: "flex-start",
                  padding: "8px 0", borderBottom: "1px solid var(--border-secondary)"
                }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", marginTop: "4px", flexShrink: 0,
                    background: n.type === "Error" ? "#ef4444" : n.type === "Warning" ? "#f59e0b" : "#10b981"
                  }} />
                  <span style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: "1.4" }}>{n.message}</span>
                </div>
              ))
            }
          </div>
        </div>
      )}

      <style>{`
        @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0; } }
        @keyframes bounce { 0%,80%,100% { transform:translateY(0); } 40% { transform:translateY(-5px); } }
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>
    </aside>
  );
}
