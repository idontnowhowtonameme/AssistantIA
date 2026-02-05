import React, { useState, useEffect, useRef } from 'react';
import HistoryPanel from './HistoryPanel';
import './HistoryPanel.css';

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
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

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const handleDeleteAccount = async () => {
    setShowDeleteModal(false);
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://127.0.0.1:8000/auth/me', {
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
      // 2. Appel API
      const res = await fetch('http://127.0.0.1:8000/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ message: text })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
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

  return (
    <>
      <div className="chat-container">
        <div className="glass-card chat-card">
          <div className="chat-header">
            <h2>Assistant IA</h2>
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
            {messages.length === 0 && (
              <div className="bubble assistant">
                Bonjour ! Je suis votre assistant IA. Posez-moi n'importe quelle question.
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
          onLoadMessage={(content, role) => setMessages(prev => [...prev, {role, content}])}
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