import React, { useState, useEffect } from 'react';
import './HistoryPanel.css';

export default function HistoryPanel({ 
  isOpen, 
  onClose, 
  onSelectConversation,
  activeConversationId,
  token
}) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Charger les conversations quand le panneau s'ouvre
  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen]);

  const loadConversations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Chargement des conversations...');
      // CHANGÉ: Utilisation de /conversations au lieu de /history/conversations
      const res = await fetch('http://127.0.0.1:8000/conversations', {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Réponse status:', res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log('Données reçues:', data);
        setConversations(data.items || []);
      } else {
        const errorData = await res.json().catch(() => ({ detail: 'Erreur inconnue' }));
        console.error('Erreur API:', errorData);
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
      // CHANGÉ: Utilisation de /conversations au lieu de /history/conversations
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
      // CHANGÉ: Utilisation de /conversations/{id} au lieu de /history/{id}
      const res = await fetch(`http://127.0.0.1:8000/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        // Retirer la conversation de la liste
        setConversations(prev => prev.filter(c => c.id !== conversationId));
        
        // Si c'était la conversation active, on la désactive
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
      // RESTE: Utilisation de /history pour supprimer tout l'historique
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

  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMins < 60) {
        return `il y a ${diffMins} min`;
      } else if (diffHours < 24) {
        return `il y a ${diffHours} h`;
      } else if (diffDays === 1) {
        return 'hier';
      } else if (diffDays < 7) {
        return `il y a ${diffDays} jours`;
      } else {
        return date.toLocaleDateString('fr-FR', { 
          day: '2-digit', 
          month: '2-digit',
          year: 'numeric'
        });
      }
    } catch (e) {
      console.error('Erreur de formatage de date:', e);
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
            {loading ? '🔄' : '🔄'}
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
            <button 
              onClick={loadConversations}
              className="retry-btn"
            >
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
                    <h4 className="conversation-title">
                      {conv.title || "Conversation sans titre"}
                    </h4>
                    {conv.id === activeConversationId && (
                      <span className="active-badge">Actuelle</span>
                    )}
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