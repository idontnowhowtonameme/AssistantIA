import React, { useState, useEffect, useRef } from 'react';
import HistoryPanel from './HistoryPanel';
import './HistoryPanel.css';

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll automatique vers le bas
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // Ajuster la hauteur du textarea automatiquement
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

  // Fonction pour basculer l'affichage de l'historique
  const toggleHistory = () => {
    setShowHistory(!showHistory);
  };

  // Fonction pour charger un message depuis l'historique
  const loadMessageFromHistory = (content, role) => {
    setMessages(prev => [...prev, { role, content }]);
    setShowHistory(false);
  };

  // Gérer la touche Entrée (Shift+Entrée pour nouvelle ligne)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    const textToSend = input;
    setInput('');
    setLoading(true);

    // Réinitialiser la hauteur du textarea
    if (inputRef.current) {
      inputRef.current.style.height = '30px';
    }

    try {
      const url = new URL('http://127.0.0.1:8000/ai/chat');
      url.searchParams.append('message', textToSend);

      const res = await fetch(url, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        }
      });

      const data = await res.json();

      if (res.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: `Erreur ${res.status}: ${data.detail || "Problème de communication"}` }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Impossible de contacter le serveur." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="glass-card chat-card">
        <div className="chat-header">
          <h2>Assistant IA</h2>
          <div className="chat-header-buttons">
            <button onClick={toggleHistory} className="history-btn">
              Historique
            </button>
            <button onClick={handleLogout} className="logout-btn">
              Déconnexion
            </button>
          </div>
        </div>

        <div className="messages-area" ref={scrollRef}>
          {messages.map((m, i) => (
            <div 
              key={i} 
              className={`bubble ${m.role}`}
            >
              {m.content}
            </div>
          ))}
          {loading && <div className="bubble assistant">Réflexion...</div>}
        </div>

        <form className="chat-input-wrapper" onSubmit={sendMessage}>
          <textarea 
            ref={inputRef}
            placeholder="Écrivez votre message... (Shift+Entrée pour nouvelle ligne)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows="1"
          />
          <button type="submit" disabled={loading}>
            Envoyer
          </button>
        </form>
      </div>

      {/* Panneau d'historique */}
      <HistoryPanel 
        isOpen={showHistory}
        onClose={toggleHistory}
        onLoadMessage={loadMessageFromHistory}
        token={localStorage.getItem('token')}
      />
    </div>
  );
}