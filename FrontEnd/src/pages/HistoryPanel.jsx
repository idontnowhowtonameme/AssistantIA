import React, { useEffect, useState } from "react";
import "./HistoryPanel.css";
import { apiFetch } from "../api.js";

export default function HistoryPanel({ isOpen, onClose, onSelectConversation, activeConversationId }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const loadConversations = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiFetch("/conversations");
      setConversations(data.items || []);
    } catch (err) {
      setError(err.message || "Impossible de charger les conversations");
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const createNewConversation = async () => {
    try {
      const newConv = await apiFetch("/conversations", { method: "POST", body: { title: null } });
      setConversations((prev) => [newConv, ...prev]);
      onSelectConversation(newConv.id, newConv.title);
      return newConv.id;
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la création de la conversation");
      return null;
    }
  };

  const deleteConversation = async (conversationId, e) => {
    e.stopPropagation();

    if (!window.confirm("Voulez-vous vraiment supprimer cette conversation ?")) return;

    try {
      await apiFetch(`/conversations/${conversationId}`, { method: "DELETE" });
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));

      if (conversationId === activeConversationId) {
        onSelectConversation(null, "Nouvelle conversation");
      }
    } catch (err) {
      alert(err.message || "Impossible de supprimer la conversation");
    }
  };

  const clearAllHistory = async () => {
    if (!window.confirm("Voulez-vous vraiment effacer TOUT l'historique ?")) return;

    try {
      await apiFetch("/history", { method: "DELETE" });
      setConversations([]);
      onSelectConversation(null, "Nouvelle conversation");
      alert("Historique effacé avec succès");
    } catch (err) {
      alert(err.message || "Impossible d'effacer l'historique");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";

    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 60) return `il y a ${diffMins} min`;
      if (diffHours < 24) return `il y a ${diffHours} h`;
      if (diffDays === 1) return "hier";
      if (diffDays < 7) return `il y a ${diffDays} jours`;

      return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
      return dateString;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="history-panel">
      <div className="history-header">
        <h3>Historique des conversations</h3>
        <div className="history-actions">
          <button
            onClick={loadConversations}
            className="refresh-history-btn"
            disabled={loading}
            title="Rafraîchir"
          >
            🔄
          </button>

          <button
            onClick={createNewConversation}
            className="refresh-history-btn"
            style={{ background: "#10b981" }}
            title="Nouvelle conversation"
          >
            +
          </button>

          <button
            onClick={clearAllHistory}
            className="clear-history-btn"
            disabled={conversations.length === 0 || loading}
            title="Effacer tout"
          >
            Effacer tout
          </button>

          <button onClick={onClose} className="close-history-btn" title="Fermer">
            ✕
          </button>
        </div>
      </div>

      <div className="history-content">
        {loading ? (
          <div className="history-loading">
            <div className="loading-spinner"></div>
            Chargement des conversations...
          </div>
        ) : error ? (
          <div className="history-error">
            <p>{error}</p>
            <button onClick={loadConversations} className="retry-btn">
              Réessayer
            </button>
          </div>
        ) : conversations.length === 0 ? (
          <div className="history-empty">
            <p>Aucune conversation</p>
            <p className="history-empty-subtitle">Commencez par envoyer un message dans le chat principal</p>
          </div>
        ) : (
          <div className="conversations-list">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`conversation-item ${conv.id === activeConversationId ? "active" : ""}`}
                onClick={() => onSelectConversation(conv.id, conv.title || "Conversation")}
              >
                <div className="conversation-header">
                  <div className="conversation-title-wrapper">
                    <h4 className="conversation-title">{conv.title || "Conversation sans titre"}</h4>
                    {conv.id === activeConversationId && <span className="active-badge">Actuelle</span>}
                  </div>
                  <button
                    onClick={(e) => deleteConversation(conv.id, e)}
                    className="delete-conversation-btn"
                    title="Supprimer cette conversation"
                  >
                    ×
                  </button>
                </div>

                <div className="conversation-details">
                  <span className="conversation-date">{formatDate(conv.updated_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="history-footer">
        {conversations.length > 0 && <div className="conversation-count">{conversations.length} conversation(s)</div>}
        <div className="history-help">Cliquez sur une conversation pour la charger</div>
      </div>
    </div>
  );
}
