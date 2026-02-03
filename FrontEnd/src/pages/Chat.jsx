import React, { useState, useEffect, useRef } from 'react';

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  // Scroll automatique vers le bas
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    const textToSend = input;
    setInput('');
    setLoading(true);

    try {
      // --- CETTE PARTIE EST LA CLÉ ---
      // Ton backend attend : POST /ai/chat?message=...
      const url = new URL('http://127.0.0.1:8000/ai/chat');
      url.searchParams.append('message', textToSend);

      const res = await fetch(url, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        }
        // On n'envoie PAS de body ici car tout est dans l'URL
      });

      const data = await res.json();

      if (res.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
      } else {
        // Si le serveur répond 502, on affiche le détail pour comprendre
        setMessages(prev => [...prev, { role: 'assistant', content: `Erreur ${res.status}: ${data.detail || "Problème de communication"}` }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Impossible de contacter le serveur." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card chat-card">
      <div className="chat-header">
        <h2 style={{ color: '#1f2937', fontSize: '1.2rem', fontWeight: 700 }}>🤖 Assistant IA</h2>
        <button onClick={handleLogout} className="logout-btn">
          Déconnexion
        </button>
      </div>

      <div className="messages-area" ref={scrollRef}>
        {messages.map((m, i) => (
          <div 
            key={i} 
            className={`bubble ${m.role}`} 
            style={{ color: m.role === 'assistant' ? '#1f2937' : '#ffffff' }}
          >
            {m.content}
          </div>
        ))}
        {loading && <div className="bubble assistant" style={{color: '#1f2937'}}>Réflexion...</div>}
      </div>

      <form className="chat-input-wrapper" onSubmit={sendMessage}>
        <input 
          type="text" 
          placeholder="Écrivez votre message..." 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ color: '#000', backgroundColor: '#fff' }} // Force texte noir
        />
        <button type="submit" className="btn-primary" disabled={loading}>
          Envoyer
        </button>
      </form>
    </div>
  );
}