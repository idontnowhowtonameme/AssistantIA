import React, { useEffect, useRef, useState } from "react";
import HistoryPanel from "./HistoryPanel.jsx";
import AdminPanel from "./AdminPanel.jsx"; // ✅ popup admin
import { apiFetch, clearToken } from "../api.js";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [showHistory, setShowHistory] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [activeConversationId, setActiveConversationId] = useState(null);
  const [conversationTitle, setConversationTitle] = useState("Nouvelle conversation");

  // ✅ Admin
  const [me, setMe] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);

  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const loadMe = async () => {
      try {
        const data = await apiFetch("/auth/me");
        setMe(data);
      } catch (e) {
        if (e.status === 401) {
          clearToken();
          window.location.href = "/login";
        }
      }
    };
    loadMe();
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (!inputRef.current) return;
    inputRef.current.style.height = "auto";
    inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 150)}px`;
  }, [input]);

  const handleLogout = () => {
    clearToken();
    window.location.href = "/login";
  };

  const handleDeleteAccount = async () => {
    setShowDeleteModal(false);
    try {
      await apiFetch("/users/me", { method: "DELETE" });
      alert("Votre compte a été supprimé avec succès.");
      localStorage.clear();
      window.location.href = "/login";
    } catch (err) {
      alert("Erreur lors de la suppression : " + (err.message || "Erreur"));
    }
  };

  const startNewConversation = () => {
    setActiveConversationId(null);
    setMessages([]);
    setConversationTitle("Nouvelle conversation");
  };

  const loadConversationMessages = async (conversationId) => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    try {
      const data = await apiFetch(`/history/${conversationId}?limit=100&offset=0`);
      const formatted = (data.items || []).map((item) => ({
        role: item.role,
        content: item.content,
        id: item.id,
        createdAt: item.created_at,
      }));
      setMessages(formatted);
    } catch (err) {
      console.error(err);
      setMessages([]);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setLoading(true);

    try {
      const payload = { message: text };
      if (activeConversationId) payload.conversation_id = activeConversationId;

      const data = await apiFetch("/ai/chat", { method: "POST", body: payload });

      setMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);

      if (!activeConversationId && data.conversation_id) {
        setActiveConversationId(data.conversation_id);
        setConversationTitle("Nouvelle conversation");
      }
    } catch (err) {
      console.error(err);
      const msg =
        err.status === 401
          ? "Votre session a expiré. Veuillez vous reconnecter."
          : "Erreur lors de la génération de la réponse. Veuillez réessayer.";

      setMessages((prev) => [...prev, { role: "assistant", content: msg }]);

      if (err.status === 401) {
        clearToken();
        window.location.href = "/login";
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = async (conversationId, title) => {
    if (conversationId === activeConversationId) return;

    setActiveConversationId(conversationId);
    setConversationTitle(title || "Conversation");
    setShowHistory(false);

    await loadConversationMessages(conversationId);
  };

  // ✅ callback rename depuis HistoryPanel
  const handleRenameConversation = (conversationId, newTitle) => {
    if (conversationId === activeConversationId) {
      setConversationTitle(newTitle || "Conversation");
    }
  };

  const isAdmin = me?.role === "admin";

  return (
    <>
      <div className="chat-container">
        <div className="glass-card chat-card">
          <div className="chat-header">
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h2>{conversationTitle}</h2>
              <button
                onClick={startNewConversation}
                style={{
                  padding: "6px 12px",
                  background: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
                title="Commencer une nouvelle conversation"
              >
                + Nouvelle
              </button>
            </div>

            {me && (
              <div
                style={{
                  fontSize: "0.85rem",
                  color: "#4b5563",
                  marginRight: "12px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  lineHeight: 1.2,
                }}
              >
                <span>
                  👤 <strong>{me.email}</strong>
                </span>
                {me.role === "admin" && (
                  <span style={{ fontSize: "0.75rem", color: "#6366f1" }}>
                    administrateur
                  </span>
                )}
              </div>
            )}

            <div className="chat-header-buttons">
              <button onClick={() => setShowHistory(!showHistory)} className="history-btn">
                Historique
              </button>

              {isAdmin && (
                <button onClick={() => setShowAdmin(true)} className="admin-btn">
                  Admin
                </button>
              )}

              <button onClick={() => setShowDeleteModal(true)} className="delete-account-btn">
                Supprimer compte
              </button>
              <button onClick={handleLogout} className="logout-btn">
                Déconnexion
              </button>
            </div>
          </div>

          <div className="messages-area" ref={scrollRef}>
            {messages.length === 0 && !loading && (
              <div className="bubble assistant welcome-message">
                <div className="welcome-title">👋 Bonjour !</div>
                <div className="welcome-text">
                  Je suis votre assistant IA. Posez-moi n'importe quelle question pour démarrer une conversation.
                </div>
                {!activeConversationId && (
                  <div className="welcome-tip">Votre première question créera automatiquement une nouvelle conversation.</div>
                )}
              </div>
            )}

            {messages.map((m, i) => (
              <div key={m.id || i} className={`bubble ${m.role}`}>
                {m.content}
              </div>
            ))}

            {loading && (
              <div className="bubble assistant">
                <div className="thinking">
                  <span className="thinking-dots">Réflexion</span>
                  <span className="dot">.</span>
                  <span className="dot">.</span>
                  <span className="dot">.</span>
                </div>
              </div>
            )}
          </div>

          <form className="chat-input-wrapper" onSubmit={sendMessage}>
            <textarea
              ref={inputRef}
              placeholder="Écrivez votre message ici..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(e);
                }
              }}
              disabled={loading}
              rows="1"
            />
            <button type="submit" disabled={loading || !input.trim()} className={loading ? "sending" : ""}>
              {loading ? (
                <>
                  <span className="sending-spinner"></span>
                  Envoi...
                </>
              ) : (
                "Envoyer"
              )}
            </button>
          </form>
        </div>

        <HistoryPanel
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          onSelectConversation={handleSelectConversation}
          onRenameConversation={handleRenameConversation} // ✅ rename
          activeConversationId={activeConversationId}
          token={localStorage.getItem("token")}
        />
      </div>

      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: "15px", color: "#1f2937" }}>⚠️ Supprimer votre compte</h3>
            <p style={{ marginBottom: "25px", color: "#4b5563", lineHeight: "1.6" }}>
              Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est{" "}
              <strong style={{ color: "#dc2626" }}>irréversible</strong>. Toutes vos conversations et données personnelles
              seront définitivement supprimées.
            </p>
            <div className="modal-actions">
              <button onClick={() => setShowDeleteModal(false)} className="cancel-btn">
                Annuler
              </button>
              <button onClick={handleDeleteAccount} className="confirm-delete-btn">
                Confirmer la suppression
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ popup admin */}
      <AdminPanel
        isOpen={showAdmin}
        onClose={() => setShowAdmin(false)}
        currentUserId={me?.id || null}
      />
    </>
  );
}
