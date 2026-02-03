import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const bottomRef = useRef(null);

  const token = localStorage.getItem('token');

  // 1. Charger l'historique au démarrage
  useEffect(() => {
    fetch('http://127.0.0.1:8000/history', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
        if (res.status === 401) handleLogout();
        return res.json();
    })
    .then(data => {
        // On inverse l'ordre pour avoir les messages chronologiques (ancien en haut)
        if(data && data.items) setMessages(data.items.reverse());
    });
  }, []);

  // Scroll automatique vers le bas
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');
    setLoading(true);

    // Ajout optimiste du message utilisateur dans l'interface
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);

    try {
      const res = await fetch('http://127.0.0.1:8000/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: userMsg })
      });

      if (res.status === 401) {
        handleLogout();
        return;
      }

      const data = await res.json();
      
      // Ajout de la réponse IA
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
      
    } catch (error) {
      console.error("Erreur chat:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', maxWidth: '800px', margin: '0 auto', borderLeft: '1px solid #ccc', borderRight: '1px solid #ccc' }}>
      
      {/* Header */}
      <header style={{ padding: '1rem', borderBottom: '1px solid #ccc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f5f5f5' }}>
        <h3>🤖 Assistant IA</h3>
        <button onClick={handleLogout} style={{ padding: '5px 10px', background: '#ff4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Déconnexion</button>
      </header>

      {/* Zone de Chat */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ 
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '70%',
            background: msg.role === 'user' ? '#007bff' : '#e9ecef',
            color: msg.role === 'user' ? 'white' : 'black',
            padding: '10px 15px',
            borderRadius: '15px',
            lineHeight: '1.4'
          }}>
            <strong>{msg.role === 'user' ? 'Moi' : 'IA'}:</strong> <br/>
            {msg.content}
          </div>
        ))}
        {loading && <div style={{ alignSelf: 'flex-start', color: '#888' }}>L'IA écrit...</div>}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} style={{ padding: '1rem', borderTop: '1px solid #ccc', display: 'flex', gap: '10px' }}>
        <input 
          type="text" 
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Posez votre question..."
          style={{ flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
          disabled={loading}
        />
        <button 
          type="submit" 
          disabled={loading}
          style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
        >
          Envoyer
        </button>
      </form>
    </div>
  );
}