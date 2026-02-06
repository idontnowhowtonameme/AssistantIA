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
  const [conversations, setConversations] = useState([]);
  const [conversationLoading, setConversationLoading] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 100)}px`;
    }
  }, [input]);

  // Charger les conversations au démarrage
  useEffect(() => {
    if (!showHistory) return;
    loadConversations();
  }, [showHistory]);

  const loadConversations = async () => {
    setConversationLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://127.0.0.1:8000/history/conversations', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setConversations(data.items || []);
      } else {
        console.error('Erreur lors du chargement des conversations');
      }
    } catch (err) {
      console.error('Erreur réseau:', err);
    } finally {
      setConversationLoading(false);
    }
  };

  const createNewConversation = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://127.0.0.1:8000/history/conversations', {
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
        setActiveConversationId(newConv.id);
        setMessages([]); // Vider les messages actuels
        loadConversations(); // Recharger la liste
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

  const loadConversationMessages = async (conversationId) => {
    if (!conversationId) return;
    
    setActiveConversationId(conversationId);
    setMessages([]); // Vider avant de charger
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://127.0.0.1:8000/history/${conversationId}?limit=50&offset=0`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
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
        console.error('Erreur chargement messages');
        setMessages([{ role: 'assistant', content: 'Erreur lors du chargement de la conversation.' }]);
      }
    } catch (err) {
      console.error('Erreur réseau:', err);
      setMessages([{ role: 'assistant', content: 'Erreur de connexion au serveur.' }]);
    }
  };

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
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        alert("Votre compte a été supprimé avec succès.");
        localStorage.clear();
        window.location.href = "/login";
      } else {
        const error = await res.json();
        alert("Erreur lors de la suppression : " + (error.detail || "Erreur inconnue"));
      }
    } catch (err) {
      console.error("Erreur:", err);
      alert("Erreur réseau lors de la suppression.");
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

      const res = await fetch('http://127.0.0.1:8000/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
        
        // Si nouvelle conversation créée
        if (!activeConversationId && data.conversation_id) {
          setActiveConversationId(data.conversation_id);
          loadConversations(); // Recharger la liste des conversations
        }
      } else {
        const error = await res.json();
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

  const getConversationTitle = () => {
    if (!activeConversationId) return "Nouvelle conversation";
    const conv = conversations.find(c => c.id === activeConversationId);
    return conv ? conv.title : "Conversation";
  };

  return (
    <>
      <div className="chat-container">
        <div className="glass-card chat-card">
          <div className="chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2>{getConversationTitle()}</h2>
              {activeConversationId && (
                <button 
                  onClick={() => createNewConversation()}
                  style={{
                    padding: '4px 8px',
                    background: 'var(--success)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  + Nouvelle
                </button>
              )}
            </div>
            <div className="chat-header-buttons">
              <button onClick={() => setShowHistory(!showHistory)} className="history-btn">
                Historique
              </button>
              <button onClick={() => setShowDeleteModal(true)} className="delete-account-btn">
                Supprimer mon compte
              </button>
              <button onClick={handleLogout} className="logout-btn">
                Déconnexion
              </button>
            </div>
          </div>

          <div className="messages-area" ref={scrollRef}>
            {messages.length === 0 && !activeConversationId && (
              <div className="bubble assistant">
                Bonjour ! Je suis votre assistant IA. Posez-moi n'importe quelle question pour démarrer une nouvelle conversation.
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`bubble ${m.role}`}>{m.content}</div>
            ))}
            {loading && <div className="bubble assistant">Réflexion...</div>}
          </div>

          <form className="chat-input-wrapper" onSubmit={sendMessage}>
            <textarea 
              ref={inputRef}
              placeholder="Écrivez votre message..." 
              value={input} 
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { 
                if(e.key === 'Enter' && !e.shiftKey) { 
                  e.preventDefault(); 
                  sendMessage(e); 
                }
              }}
              disabled={loading}
            />
            <button type="submit" disabled={loading || !input.trim()}>
              {loading ? 'Envoi...' : 'Envoyer'}
            </button>
          </form>
        </div>

        <HistoryPanel 
          isOpen={showHistory} 
          onClose={() => setShowHistory(false)}
          conversations={conversations}
          loading={conversationLoading}
          onSelectConversation={loadConversationMessages}
          onCreateConversation={createNewConversation}
          activeConversationId={activeConversationId}
          onRefresh={loadConversations}
          token={localStorage.getItem('token')}
        />
      </div>

      {/* Modal de confirmation de suppression */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{marginBottom: '15px', color: '#1f2937'}}>
              Supprimer votre compte
            </h3>
            <p style={{marginBottom: '25px', color: '#4b5563', lineHeight: '1.6'}}>
              Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est <strong style={{color: '#dc2626'}}>irréversible</strong>.
              Tous vos messages et données personnelles seront définitivement supprimés.
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
                Supprimer mon compte
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}