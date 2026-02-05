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
      // 2. Appel API corrigé (Envoi JSON au lieu de Query Param)
      const res = await fetch('http://127.0.0.1:8000/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ message: text }) // Correction ici : On envoie un objet JSON
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
      } else {
        const error = await res.json();
        console.error("Erreur API:", error);
        setMessages(prev => [...prev, { role: 'assistant', content: "Votre session a expiré veuillez vous reconnecter." }]);
      }
    } catch (err) {
      console.error("Erreur réseau:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-container" style={{width: '100%', display: 'flex', justifyContent: 'center'}}>
      <div className="glass-card chat-card">
        <div className="chat-header">
          <h2>Assistant IA</h2>
          <div className="chat-header-buttons">
            <button onClick={() => setShowHistory(!showHistory)} className="history-btn">Historique</button>
            <button onClick={handleLogout} className="logout-btn">Déconnexion</button>
          </div>
        </div>

        <div className="messages-area" ref={scrollRef}>
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
            onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e); }}}
          />
          <button type="submit" disabled={loading}>Envoyer</button>
        </form>
      </div>

      <HistoryPanel 
        isOpen={showHistory} 
        onClose={() => setShowHistory(false)} 
        onLoadMessage={(content, role) => setMessages(prev => [...prev, {role, content}])}
        token={localStorage.getItem('token')}
      />
    </div>
  );
}