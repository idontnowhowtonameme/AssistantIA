import React, { useState, useEffect } from 'react';
import './HistoryPanel.css';

export default function HistoryPanel({
  isOpen,
  onClose,
  onSelectConversation,
  onRenameConversation,
  activeConversationId,
  token
}) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ renaming state
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen]);

  const loadConversations = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('http://127.0.0.1:8000/conversations', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        setConversations(data.items || []);
      } else {
        const errorData = await res.json().catch(() => ({ detail: 'Erreur inconnue' }));
        setError(`Erreur ${res.status}: ${errorData.detail || 'Impossible de charger les conversations'}`);
        setConversations([]);
      }
    } catch (err) {
      console.error('Erreur réseau:', err);
      setError('Erreur de connexion au serveur');
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const createNewConversation = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: null })
      });

      if (res.ok) {
        const newConv = await res.json();
        setConversations(prev => [newConv, ...prev]);
        onSelectConversation(newConv.id, newConv.title);
        return newConv.id;
      } else {
        throw new Error('Erreur création conversation');
      }
    } catch (err) {
      console.error('Erreur:', err);
      alert("Erreur lors de la création de la conversation");
      return null;
    }
  };

  const deleteConversation = async (conversationId, e) => {
    e.stopPropagation();

    if (!window.confirm('Voulez-vous vraiment supprimer cette conversation ?')) {
      return;
    }

    try {
      const res = await fetch(`http://127.0.0.1:8000/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        setConversations(prev => prev.filter(c => c.id !== conversationId));
        if (conversationId === activeConversationId) {
          onSelectConversation(null, "Nouvelle conversation");
        }
      } else {
        const errorData = await res.json().catch(() => ({ detail: 'Erreur inconnue' }));
        alert(`Erreur: ${errorData.detail || 'Impossible de supprimer la conversation'}`);
      }
    } catch (err) {
      console.error('Erreur:', err);
      alert('Erreur réseau lors de la suppression');
    }
  };

  const clearAllHistory = async () => {
    if (!window.confirm('Voulez-vous vraiment effacer TOUT l\'historique ?')) {
      return;
    }

    try {
      const res = await fetch('http://127.0.0.1:8000/history', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        setConversations([]);
        onSelectConversation(null, "Nouvelle conversation");
        alert('Historique effacé avec succès');
      } else {
        const errorData = await res.json().catch(() => ({ detail: 'Erreur inconnue' }));
        alert(`Erreur: ${errorData.detail || 'Impossible d\'effacer l\'historique'}`);
      }
    } catch (err) {
      console.error('Erreur:', err);
      alert('Erreur réseau');
    }
  };

  const startRename = (conv, e) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditingTitle(conv.title || "");
  };

  const cancelRename = (e) => {
    e?.stopPropagation?.();
    setEditingId(null);
    setEditingTitle("");
  };

  const saveRename = async (conversationId, e) => {
    e.stopPropagation();

    const newTitle = (editingTitle || "").trim();
    if (!newTitle) {
      alert("Le titre ne peut pas être vide.");
      return;
    }
    if (newTitle.length > 80) {
      alert("Titre trop long (max 80 caractères).");
      return;
    }

    try {
      const res = await fetch(`http://127.0.0.1:8000/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: newTitle })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'Erreur inconnue' }));
        alert(`Erreur: ${errorData.detail || 'Impossible de renommer la conversation'}`);
        return;
      }

      const updated = await res.json();

      setConversations(prev =>
        prev.map(c => (c.id === conversationId ? { ...c, title: updated.title, updated_at: updated.updated_at } : c))
      );

      // ✅ si la conv active est renommée, on met à jour le header
      onRenameConversation?.(conversationId, updated.title);

      setEditingId(null);
      setEditingTitle("");
    } catch (err) {
      console.error(err);
      alert("Erreur réseau lors du renommage.");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 60) return `il y a ${diffMins} min`;
      if (diffHours < 24) return `il y a ${diffHours} h`;
      if (diffDays === 1) return 'hier';
      if (diffDays < 7) return `il y a ${diffDays} jours`;

      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return dateString || '';
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
            style={{ background: '#10b981' }}
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
          <button
            onClick={onClose}
            className="close-history-btn"
            title="Fermer"
          >
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
            <p className="history-empty-subtitle">
              Commencez par envoyer un message dans le chat principal
            </p>
          </div>
        ) : (
          <div className="conversations-list">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`conversation-item ${conv.id === activeConversationId ? 'active' : ''}`}
                onClick={() => onSelectConversation(conv.id, conv.title || "Conversation")}
              >
                <div className="conversation-header">
                  <div className="conversation-title-wrapper">
                    {editingId === conv.id ? (
                      <input
                        className="rename-input"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                        maxLength={80}
                      />
                    ) : (
                      <h4 className="conversation-title">
                        {conv.title || "Conversation sans titre"}
                      </h4>
                    )}

                    {conv.id === activeConversationId && (
                      <span className="active-badge">Actuelle</span>
                    )}
                  </div>

                  <div className="conversation-actions">
                    {editingId === conv.id ? (
                      <>
                        <button
                          onClick={(e) => saveRename(conv.id, e)}
                          className="rename-save-btn"
                          title="Enregistrer"
                        >
                          ✓
                        </button>
                        <button
                          onClick={(e) => cancelRename(e)}
                          className="rename-cancel-btn"
                          title="Annuler"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={(e) => startRename(conv, e)}
                          className="rename-conversation-btn"
                          title="Renommer"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={(e) => deleteConversation(conv.id, e)}
                          className="delete-conversation-btn"
                          title="Supprimer cette conversation"
                        >
                          ×
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="conversation-details">
                  <span className="conversation-date">
                    {formatDate(conv.updated_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="history-footer">
        {conversations.length > 0 && (
          <div className="conversation-count">
            {conversations.length} conversation(s)
          </div>
        )}
        <div className="history-help">
          Cliquez sur une conversation pour la charger
        </div>
      </div>
    </div>
  );
}
