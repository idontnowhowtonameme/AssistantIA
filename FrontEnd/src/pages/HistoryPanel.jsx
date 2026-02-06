import React, { useState, useEffect, useRef } from 'react';

export default function HistoryPanel({ 
  isOpen, 
  onClose, 
  conversations, 
  loading,
  onSelectConversation,
  onCreateConversation,
  activeConversationId,
  onRefresh,
  token
}) {
  const [showDeleteConvModal, setShowDeleteConvModal] = useState(false);
  const [convToDelete, setConvToDelete] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const historyScrollRef = useRef(null);

  useEffect(() => {
    if (historyScrollRef.current && isOpen) {
      historyScrollRef.current.scrollTop = historyScrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const loadConversationMessages = async (conversationId) => {
    if (!conversationId) return;
    
    setLoadingMessages(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/history/${conversationId}?limit=10&offset=0`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}` 
        }
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(data.items || []);
      } else {
        console.error('Erreur lors du chargement des messages');
        setMessages([]);
      }
    } catch (err) {
      console.error('Erreur réseau:', err);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSelectConversation = (conversationId) => {
    onSelectConversation(conversationId);
    loadConversationMessages(conversationId);
    onClose(); // Fermer le panneau après sélection
  };

  const handleCreateConversation = async () => {
    const newConvId = await onCreateConversation();
    if (newConvId) {
      handleSelectConversation(newConvId);
    }
  };

  const handleDeleteConversation = async (conversationId) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette conversation ?')) {
      return;
    }

    try {
      const res = await fetch(`http://127.0.0.1:8000/history/${conversationId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}` 
        }
      });

      if (res.ok) {
        alert('Conversation supprimée avec succès');
        onRefresh(); // Recharger la liste
        if (conversationId === activeConversationId) {
          onSelectConversation(null); // Réinitialiser la conversation active
          setMessages([]);
        }
      } else {
        alert('Erreur lors de la suppression de la conversation');
      }
    } catch (err) {
      console.error('Erreur:', err);
      alert('Erreur réseau');
    }
  };

  const clearAllHistory = async () => {
    if (!window.confirm('Voulez-vous vraiment effacer TOUT l\'historique ? Cette action est irréversible.')) {
      return;
    }

    try {
      const res = await fetch('http://127.0.0.1:8000/history', {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}` 
        }
      });

      if (res.ok) {
        alert('Historique effacé avec succès');
        onRefresh();
        onSelectConversation(null);
        setMessages([]);
      } else {
        alert('Erreur lors de l\'effacement de l\'historique');
      }
    } catch (err) {
      console.error('Erreur:', err);
      alert('Erreur réseau');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLastMessagePreview = (conversationId) => {
    const convMessages = messages.filter(m => m.conversation_id === conversationId);
    if (convMessages.length === 0) return "Aucun message";
    const lastMessage = convMessages[convMessages.length - 1];
    return `${lastMessage.role === 'user' ? 'Vous: ' : 'IA: '}${lastMessage.content.substring(0, 30)}${lastMessage.content.length > 30 ? '...' : ''}`;
  };

  if (!isOpen) return null;

  return (
    <div className="history-panel">
      <div className="history-header">
        <h3>Conversations</h3>
        <div className="history-actions">
          <button 
            onClick={onRefresh}
            className="refresh-history-btn"
            disabled={loading}
          >
            🔄
          </button>
          <button 
            onClick={handleCreateConversation}
            className="refresh-history-btn"
            style={{ background: '#10b981' }}
          >
            +
          </button>
          <button 
            onClick={clearAllHistory}
            className="clear-history-btn"
          >
            Effacer tout
          </button>
          <button 
            onClick={onClose}
            className="close-history-btn"
          >
            ✕
          </button>
        </div>
      </div>

      <div 
        className="history-messages" 
        ref={historyScrollRef}
      >
        {loading ? (
          <div className="history-loading">
            <div className="loading-spinner"></div>
            Chargement des conversations...
          </div>
        ) : conversations.length === 0 ? (
          <div className="history-empty">
            Aucune conversation
          </div>
        ) : (
          conversations.map((conv, i) => (
            <div 
              key={i} 
              className={`history-bubble ${conv.id === activeConversationId ? 'active' : ''}`}
              onClick={() => handleSelectConversation(conv.id)}
              style={{
                background: conv.id === activeConversationId ? '#e0e7ff' : '',
                borderLeft: conv.id === activeConversationId ? '4px solid #6366f1' : ''
              }}
            >
              <div className="history-meta">
                <span className="history-role" style={{ fontWeight: 'bold', color: '#1f2937' }}>
                  {conv.title}
                </span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteConversation(conv.id);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  ×
                </button>
              </div>
              <div className="history-content" style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '4px' }}>
                {formatDate(conv.updated_at)}
              </div>
              <div className="history-content" style={{ marginTop: '6px' }}>
                {getLastMessagePreview(conv.id)}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="history-footer">
        {conversations.length} conversation(s)
      </div>
    </div>
  );
}