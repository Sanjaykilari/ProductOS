import React, { useState, useEffect } from "react";
import { BookOpen, Folder, File, Plus, Search, Sparkles, RefreshCw, Edit2, Trash2, Save, FileText } from "lucide-react";
import api from "../lib/api";

export default function KnowledgeCenter({ activeDocId, onDocCleared }) {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docContent, setDocContent] = useState("");
  const [docTitle, setDocTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isWriting, setIsWriting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");

  // Create document modal state
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("PRD");
  const [newContent, setNewContent] = useState("");

  useEffect(() => {
    loadProjectsAndDocs();
  }, []);

  useEffect(() => {
    if (activeDocId && documents.length > 0) {
      const found = documents.find(d => d.id === activeDocId);
      if (found) {
        selectDoc(found);
        onDocCleared?.();
      }
    }
  }, [activeDocId, documents]);

  const loadProjectsAndDocs = async () => {
    setIsLoading(true);
    try {
      const projs = await api.getProjects();
      setProjects(projs);
      
      const docs = await api.getDocuments();
      setDocuments(docs);
      if (docs.length > 0) {
        selectDoc(docs[0]);
      }
    } catch (e) {
      console.error("Failed to load documents", e);
    } finally {
      setIsLoading(false);
    }
  };

  const selectDoc = (doc) => {
    setSelectedDoc(doc);
    setDocTitle(doc.title);
    setDocContent(doc.content || "");
  };

  const handleSaveDoc = async () => {
    if (!selectedDoc) return;
    setIsSaving(true);
    try {
      await api.updateDocument(selectedDoc.id, { title: docTitle, content: docContent });
      // Update local state
      setDocuments(prev => prev.map(d => d.id === selectedDoc.id ? { ...d, title: docTitle, content: docContent } : d));
      setSelectedDoc(prev => ({ ...prev, title: docTitle, content: docContent }));
    } catch (e) {
      alert("Failed to save: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDoc = async () => {
    if (!selectedDoc) return;
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      await api.deleteDocument(selectedDoc.id);
      const remaining = documents.filter(d => d.id !== selectedDoc.id);
      setDocuments(remaining);
      if (remaining.length > 0) {
        selectDoc(remaining[0]);
      } else {
        setSelectedDoc(null);
        setDocTitle("");
        setDocContent("");
      }
    } catch (e) {
      alert("Failed to delete: " + e.message);
    }
  };

  const handleCreateDoc = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    
    // Default to first project if none selected
    const projId = selectedProject || (projects.length > 0 ? projects[0].id : "proj-analytics");
    try {
      await api.createDocument({
        projectId: projId,
        title: newTitle,
        content: newContent,
        docType: newType,
      });
      setNewTitle("");
      setNewContent("");
      setIsCreating(false);
      
      // Reload documents
      const docs = await api.getDocuments();
      setDocuments(docs);
      const created = docs.find(d => d.title === newTitle) || docs[0];
      if (created) selectDoc(created);
    } catch (e) {
      alert("Failed to create document: " + e.message);
    }
  };

  const handleAIWrite = async () => {
    if (!selectedDoc) return;
    setIsWriting(true);
    try {
      const prompt = `Complete the next paragraph for this document:\nTitle: ${docTitle}\nContent:\n${docContent}\n\nContinue writing in a professional, concise tone.`;
      const res = await api.chat({ prompt, agentId: "Documentation Agent" });
      if (res && res.text) {
        setDocContent(prev => prev + "\n\n" + res.text);
      }
    } catch (e) {
      alert("AI Scoping failed: " + e.message);
    } finally {
      setIsWriting(false);
    }
  };

  // Group by document type
  const docTypes = Array.from(new Set(documents.map(d => d.doc_type || "General")));
  
  const filteredDocs = documents.filter(d => 
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (d.content && d.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "16px", height: "calc(100vh - 120px)" }}>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "22px", marginBottom: "4px" }}>Knowledge Center</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
            Workspace wikis, auto-scraped templates, PRDs, and architecture documents.
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button className="btn btn-secondary btn-sm" onClick={loadProjectsAndDocs} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <RefreshCw size={12} />
            <span>Refresh</span>
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setIsCreating(true)} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <Plus size={14} />
            <span>Create Page</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px", gap: "8px", color: "var(--text-secondary)" }}>
          <RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} />
          <span>Loading knowledge archive...</span>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "250px 1fr", gap: "20px", flex: 1, overflow: "hidden", minHeight: 0 }}>
          
          {/* Knowledge Sidebar */}
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: "12px", height: "100%", padding: "14px", overflow: "hidden" }}>
            <h3 style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "6px" }}>
              <BookOpen size={14} />
              WIKI DIRECTORY
            </h3>

            {/* Project filter */}
            <select
              value={selectedProject}
              onChange={e => setSelectedProject(e.target.value)}
              style={{
                fontSize: "11px", padding: "6px", borderRadius: "6px",
                background: "var(--bg-hover)", border: "1px solid var(--border-primary)",
                color: "var(--text-secondary)", cursor: "pointer"
              }}
            >
              <option value="">All Projects</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>

            {/* Search */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "var(--bg-app)", border: "1px solid var(--border-primary)", borderRadius: "6px", padding: "5px 10px" }}>
              <Search size={12} style={{ color: "var(--text-muted)" }} />
              <input 
                type="text" 
                placeholder="Search wiki..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ border: "none", background: "transparent", outline: "none", fontSize: "11px", width: "100%", color: "var(--text-primary)" }} 
              />
            </div>

            {/* Folder list */}
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "14px" }}>
              {docTypes.length === 0 ? (
                <div style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "center", padding: "20px 0" }}>
                  No documents found.
                </div>
              ) : (
                docTypes.map((type) => {
                  const typeDocs = filteredDocs.filter(d => 
                    (d.doc_type || "General") === type && 
                    (!selectedProject || d.project_id === selectedProject)
                  );
                  if (typeDocs.length === 0) return null;
                  return (
                    <div key={type} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <div style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px", textTransform: "uppercase", padding: "4px" }}>
                        <Folder size={11} />
                        <span>{type}</span>
                      </div>
                      {typeDocs.map((doc) => (
                        <div 
                          key={doc.id} 
                          onClick={() => selectDoc(doc)}
                          style={{ 
                            fontSize: "12px", 
                            padding: "6px 8px", 
                            borderRadius: "6px", 
                            cursor: "pointer",
                            background: selectedDoc?.id === doc.id ? "var(--bg-active)" : "transparent",
                            color: selectedDoc?.id === doc.id ? "var(--primary-color)" : "var(--text-secondary)",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px"
                          }}
                        >
                          <FileText size={11} />
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                            {doc.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Wiki Document Editor */}
          {selectedDoc ? (
            <div className="card" style={{ flex: 1, display: "flex", flexDirection: "column", gap: "14px", height: "100%", padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-secondary)", paddingBottom: "12px" }}>
                <input 
                  type="text" 
                  value={docTitle} 
                  onChange={e => setDocTitle(e.target.value)} 
                  style={{
                    fontSize: "18px", fontWeight: "700", border: "none",
                    background: "transparent", color: "var(--text-primary)",
                    outline: "none", flex: 1
                  }}
                />
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={handleSaveDoc} className="btn btn-sm" disabled={isSaving} style={{
                    background: "linear-gradient(135deg, #10b981, #059669)",
                    border: "none", color: "#fff", display: "flex", alignItems: "center", gap: "4px"
                  }}>
                    <Save size={12} />
                    <span>{isSaving ? "Saving..." : "Save"}</span>
                  </button>
                  <button onClick={handleDeleteDoc} className="btn btn-danger btn-sm" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Trash2 size={12} />
                    <span>Delete</span>
                  </button>
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
                  fontFamily: "var(--font-mono)", 
                  fontSize: "13px", 
                  lineHeight: "1.6",
                  color: "var(--text-primary)",
                  padding: "8px 0"
                }}
              />

              {/* AI Scoping helper */}
              <div style={{ borderTop: "1px solid var(--border-secondary)", paddingTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  Use Markdown layout headers for styling documentation wiki.
                </span>
                <button 
                  onClick={handleAIWrite}
                  className="btn btn-primary btn-sm"
                  disabled={isWriting}
                  style={{ display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <Sparkles size={12} />
                  <span>{isWriting ? "AI Scoping..." : "AI Write Next Paragraph"}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="card" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "13px" }}>
              No document active. Scaffolds are generated under Projects ➔ Approve Roadmap.
            </div>
          )}
        </div>
      )}

      {/* Create document modal overlay */}
      {isCreating && (
        <div className="modal-backdrop" onClick={() => setIsCreating(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: "500px" }}>
            <div className="modal-header">
              <h3 style={{ fontSize: "14px", fontWeight: "700" }}>Create Custom Wiki Page</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setIsCreating(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateDoc} style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "16px 0" }}>
              <div className="form-group">
                <label className="form-label">Document Title</label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="e.g. Security Audit Requirements v1.1" 
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Category (Type)</label>
                <select className="select" value={newType} onChange={e => setNewType(e.target.value)}>
                  <option value="PRD">PRD</option>
                  <option value="Technical Spec">Technical Spec</option>
                  <option value="Epic Brief">Epic Brief</option>
                  <option value="Meeting Notes">Meeting Notes</option>
                  <option value="Architecture">Architecture</option>
                  <option value="Policies">Policies</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Associated Project</label>
                <select className="select" value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Initial Markdown Content</label>
                <textarea 
                  className="textarea" 
                  placeholder="# Description..." 
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  rows={6}
                />
              </div>
              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "8px" }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsCreating(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Create Document</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
