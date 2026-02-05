import React, { useState, useEffect, useRef } from 'react';

export default function HistoryPanel({ isOpen, onClose, onLoadMessage, token }) {
  const [historyMessages, setHistoryMessages] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const historyScrollRef = useRef(null);

  // Charger l'historique quand le panneau s'ouvre
  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  // Scroll automatique pour l'historique
  useEffect(() => {
    if (historyScrollRef.current && isOpen) {
      historyScrollRef.current.scrollTop = historyScrollRef.current.scrollHeight;
    }
  }, [historyMessages, isOpen]);

  // Fonction pour charger l'historique depuis l'API
  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/history', {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}` 
        }
      });

      if (res.ok) {
        const data = await res.json();
        // Note: le backend renvoie maintenant {items: [...]}
        setHistoryMessages(data.items || []);
      } else {
        console.error('Erreur lors du chargement de l\'historique');
        setHistoryMessages([]);
      }
    } catch (err) {
      console.error('Erreur réseau:', err);
      setHistoryMessages([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Fonction pour effacer l'historique
  const clearHistory = async () => {
    if (window.confirm('Voulez-vous vraiment effacer tout l\'historique ?')) {
      try {
        const res = await fetch('http://127.0.0.1:8000/history', {
          method: 'DELETE',
          headers: { 
            'Authorization': `Bearer ${token}` 
          }
        });

        if (res.ok) {
          setHistoryMessages([]);
          alert('Historique effacé avec succès');
        } else {
          alert('Erreur lors de l\'effacement de l\'historique');
        }
      } catch (err) {
        console.error('Erreur:', err);
        alert('Erreur réseau');
      }
    }
  };

  // Formater la date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) return null;

  return (
    <div className="history-panel">
      <div className="history-header">
        <h3>Historique</h3>
        <div className="history-actions">
          <button 
            onClick={loadHistory}
            className="refresh-history-btn"
            disabled={loadingHistory}
          >
            🔄
          </button>
          <button 
            onClick={clearHistory}
            className="clear-history-btn"
          >
            Effacer
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
        {loadingHistory ? (
          <div className="history-loading">
            <div className="loading-spinner"></div>
            Chargement de l'historique...
          </div>
        ) : historyMessages.length === 0 ? (
          <div className="history-empty">
            Aucun message dans l'historique
          </div>
        ) : (
          historyMessages.map((msg, i) => (
            <div 
              key={i} 
              className={`history-bubble ${msg.role}`}
              onClick={() => onLoadMessage(msg.content, msg.role)}
              title="Cliquer pour ajouter au chat"
            >
              <div className="history-meta">
                <span className="history-role">
                  {msg.role === 'user' ? 'Vous' : 'Assistant'}
                </span>
                <span className="history-time">
                  {formatDate(msg.created_at)}
                </span>
              </div>
              <div className="history-content">
                {msg.content.length > 100 ? `${msg.content.substring(0, 100)}...` : msg.content}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="history-footer">
        {historyMessages.length} message(s) dans l'historique
      </div>
    </div>
  );
}