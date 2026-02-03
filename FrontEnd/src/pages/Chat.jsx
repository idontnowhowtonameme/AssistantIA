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
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('http://127.0.0.1:8000/ai/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ message: input })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Erreur de connexion." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card chat-card">
      <div className="chat-header">
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Assistant IA</h2>
        <button onClick={handleLogout} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600 }}>
          Déconnexion
        </button>
      </div>

      <div className="messages-area" ref={scrollRef}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#9ca3af', marginTop: '20%' }}>
            Posez-moi n'importe quelle question !
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            {m.content}
          </div>
        ))}
        {loading && <div className="bubble assistant">En train de réfléchir...</div>}
      </div>

      <form className="chat-input-wrapper" onSubmit={sendMessage}>
        <input 
          type="text" 
          placeholder="Écrivez votre message..." 
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '0 25px' }}>
          Envoyer
        </button>
      </form>
    </div>
  );
}