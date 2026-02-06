import React, { useState, useEffect, useRef } from 'react';
import HistoryPanel from './HistoryPanel';
import './HistoryPanel.css';

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [conversationTitle, setConversationTitle] = useState("Nouvelle conversation");
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const handleDeleteAccount = async () => {
    setShowDeleteModal(false);
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://127.0.0.1:8000/users/me', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        alert("Votre compte a été supprimé avec succès.");
        localStorage.clear();
        window.location.href = "/login";
      } else {
        const error = await res.json().catch(() => ({ detail: 'Erreur inconnue' }));
        alert("Erreur lors de la suppression : " + error.detail);
      }
    } catch (err) {
      console.error("Erreur:", err);
      alert("Erreur réseau lors de la suppression.");
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
      const token = localStorage.getItem('token');
      const res = await fetch(`http://127.0.0.1:8000/history/${conversationId}?limit=100&offset=0`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        const formattedMessages = data.items.map(item => ({
          role: item.role,
          content: item.content,
          id: item.id,
          createdAt: item.created_at
        }));
        setMessages(formattedMessages);
      } else {
        console.error('Erreur lors du chargement des messages');
        setMessages([]);
      }
    } catch (err) {
      console.error('Erreur réseau:', err);
      setMessages([]);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    // 1. Ajouter le message utilisateur à l'écran
    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // 2. Appel API avec conversation_id
      const payload = { message: text };
      if (activeConversationId) {
        payload.conversation_id = activeConversationId;
      }

      const token = localStorage.getItem('token');
      const res = await fetch('http://127.0.0.1:8000/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
        
        // Si nouvelle conversation créée automatiquement par le backend
        if (!activeConversationId && data.conversation_id) {
          setActiveConversationId(data.conversation_id);
          setConversationTitle("Nouvelle conversation");
        }
      } else {
        const error = await res.json().catch(() => ({ detail: 'Erreur inconnue' }));
        console.error("Erreur API:", error);
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: error.detail === "Invalid or expired token" 
            ? "Votre session a expiré. Veuillez vous reconnecter."
            : "Erreur lors de la génération de la réponse. Veuillez réessayer." 
        }]);
      }
    } catch (err) {
      console.error("Erreur réseau:", err);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Erreur de connexion au serveur. Veuillez vérifier votre connexion internet." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = async (conversationId, title) => {
    if (conversationId === activeConversationId) {
      return; // Déjà sélectionnée
    }
    
    setActiveConversationId(conversationId);
    setConversationTitle(title || "Conversation");
    
    // Charger les messages de la conversation
    await loadConversationMessages(conversationId);
  };

  return (
    <>
      <div className="chat-container">
        <div className="glass-card chat-card">
          <div className="chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2>{conversationTitle}</h2>
              <button 
                onClick={startNewConversation}
                style={{
                  padding: '6px 12px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
                title="Commencer une nouvelle conversation"
              >
                + Nouvelle
              </button>
            </div>
            <div className="chat-header-buttons">
              <button onClick={() => setShowHistory(!showHistory)} className="history-btn">
                Historique
              </button>
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
                  <div className="welcome-tip">
                    Votre première question créera automatiquement une nouvelle conversation.
                  </div>
                )}
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`bubble ${m.role}`}>
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
                if(e.key === 'Enter' && !e.shiftKey) { 
                  e.preventDefault(); 
                  sendMessage(e); 
                }
              }}
              disabled={loading}
              rows="1"
            />
            <button 
              type="submit" 
              disabled={loading || !input.trim()}
              className={loading ? 'sending' : ''}
            >
              {loading ? (
                <>
                  <span className="sending-spinner"></span>
                  Envoi...
                </>
              ) : 'Envoyer'}
            </button>
          </form>
        </div>

        <HistoryPanel 
          isOpen={showHistory} 
          onClose={() => setShowHistory(false)}
          onSelectConversation={handleSelectConversation}
          activeConversationId={activeConversationId}
          token={localStorage.getItem('token')}
        />
      </div>

      {/* Modal de confirmation de suppression */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{marginBottom: '15px', color: '#1f2937'}}>
              ⚠️ Supprimer votre compte
            </h3>
            <p style={{marginBottom: '25px', color: '#4b5563', lineHeight: '1.6'}}>
              Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est <strong style={{color: '#dc2626'}}>irréversible</strong>.
              Toutes vos conversations et données personnelles seront définitivement supprimées.
            </p>
            <div className="modal-actions">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="cancel-btn"
              >
                Annuler
              </button>
              <button 
                onClick={handleDeleteAccount}
                className="confirm-delete-btn"
              >
                Confirmer la suppression
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}