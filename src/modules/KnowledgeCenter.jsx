import React, { useState } from "react";
import { BookOpen, Folder, File, Plus, Search, Sparkles, AlertCircle, Edit, Trash } from "lucide-react";

export default function KnowledgeCenter() {
  const [activeDoc, setActiveDoc] = useState("Security Guidelines v1.0");
  const [isWriting, setIsWriting] = useState(false);
  const [docContent, setDocContent] = useState(
    `# Security Guidelines v1.0\n\n## Overview\nThis wiki outlines zero-trust requirements for multi-tenant deployments. All frontend applications must secure local storage caches and block inline scripting.\n\n## localForage boundary constraints\nEnsure IndexedDB instances partition storage based on active session tokens. DevOpsAgent will block pipeline builds failing validation.`
  );

  const documents = [
    { title: "Security Guidelines v1.0", category: "Policies" },
    { title: "Database Migration Schema Draft", category: "Architecture" },
    { title: "PRD: Visual Workflow Node Builder", category: "PRDs" },
    { title: "Sprint 3 Retro Notes", category: "Meeting Notes" }
  ];

  const handleAIWrite = () => {
    setIsWriting(true);
    setTimeout(() => {
      setDocContent(prev => 
        prev + `\n\n## 3. Cryptographic Storage Standards (AI Generated)\n- **Rule 1**: AES-GCM 256-bit encryption for local DB cache buffers.\n- **Rule 2**: SecurityAgent must approve all custom key validation routes prior to staging compilation.`
      );
      setIsWriting(false);
    }, 1000);
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", gap: "var(--space-6)", height: "calc(100vh - 160px)", overflow: "hidden" }}>
      
      {/* Knowledge Sidebar */}
      <div 
        className="card" 
        style={{ 
          width: "240px", 
          display: "flex", 
          flexDirection: "column", 
          gap: "var(--space-4)", 
          height: "100%",
          padding: "var(--space-3)" 
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
            <BookOpen size={16} style={{ color: "var(--primary-color)" }} />
            Wiki Folders
          </h3>
          <button className="btn btn-ghost btn-icon btn-sm"><Plus size={14} /></button>
        </div>

        {/* Search */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "var(--bg-app)", border: "1px solid var(--border-primary)", borderRadius: "var(--radius-sm)", padding: "4px 8px" }}>
          <Search size={12} style={{ color: "var(--text-muted)" }} />
          <input type="text" placeholder="Search wiki..." style={{ border: "none", background: "transparent", outline: "none", fontSize: "11px", width: "100%", color: "var(--text-primary)" }} />
        </div>

        {/* Folder items */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
          {["Policies", "Architecture", "PRDs", "Meeting Notes"].map((cat) => {
            const catDocs = documents.filter(d => d.category === cat);
            return (
              <div key={cat} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <div style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px", textTransform: "uppercase", padding: "4px" }}>
                  <Folder size={12} />
                  <span>{cat}</span>
                </div>
                {catDocs.map((doc) => (
                  <div 
                    key={doc.title} 
                    onClick={() => {
                      setActiveDoc(doc.title);
                      if (doc.title === "Security Guidelines v1.0") {
                        setDocContent(`# Security Guidelines v1.0\n\n## Overview\nThis wiki outlines zero-trust requirements for multi-tenant deployments. All frontend applications must secure local storage caches and block inline scripting.\n\n## localForage boundary constraints\nEnsure IndexedDB instances partition storage based on active session tokens. DevOpsAgent will block pipeline builds failing validation.`);
                      } else {
                        setDocContent(`# ${doc.title}\n\nThis is a template document for **${doc.title}** under **${doc.category}**.\nModify or enhance sections by calling the AI writing helper below.`);
                      }
                    }}
                    style={{ 
                      fontSize: "12px", 
                      padding: "6px 8px", 
                      borderRadius: "var(--radius-sm)", 
                      cursor: "pointer",
                      background: activeDoc === doc.title ? "var(--bg-active)" : "transparent",
                      color: activeDoc === doc.title ? "var(--primary-color)" : "var(--text-secondary)",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <File size={10} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.title}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Wiki Document Editor */}
      <div className="card" style={{ flex: 1, display: "flex", flexDirection: "column", gap: "var(--space-4)", height: "100%" }}>
        {/* Editor Toolbar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-secondary)", paddingBottom: "10px" }}>
          <div>
            <h2 style={{ fontSize: "16px" }}>{activeDoc}</h2>
          </div>
          <div style={{ display: "flex", gap: "4px" }}>
            <button className="btn btn-secondary btn-icon btn-sm"><Edit size={12} /></button>
            <button className="btn btn-danger btn-icon btn-sm"><Trash size={12} /></button>
          </div>
        </div>

        {/* Text editor body */}
        <textarea 
          value={docContent}
          onChange={(e) => setDocContent(e.target.value)}
          style={{ 
            flex: 1, 
            background: "transparent", 
            border: "none", 
            outline: "none", 
            resize: "none", 
            fontFamily: "var(--font-sans)", 
            fontSize: "14px", 
            lineHeight: "1.6",
            color: "var(--text-primary)" 
          }}
        />

        {/* AI writer trigger */}
        <div style={{ borderTop: "1px solid var(--border-secondary)", paddingTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Press Tab for AI autocomplete recommendations</span>
          <button 
            onClick={handleAIWrite}
            className="btn btn-primary btn-sm"
            disabled={isWriting}
          >
            <Sparkles size={12} />
            <span>{isWriting ? "AI Writing Autocomplete..." : "AI Write paragraph"}</span>
          </button>
        </div>
      </div>

    </div>
  );
}
