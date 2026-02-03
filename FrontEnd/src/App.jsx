import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';
import './App.css';

/**
 * Composant de protection des routes.
 * Il vérifie la présence du token dans le localStorage.
 */
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  
  // Si le token n'existe pas, on redirige vers la page de login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Sinon, on affiche le composant demandé (le Chat)
  return children;
};

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          {/* --- Routes Publiques --- */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* --- Route Privée (Chat) --- */}
          <Route 
            path="/" 
            element={
              <PrivateRoute>
                <Chat />
              </PrivateRoute>
            } 
          />

          {/* --- Redirection de secours --- */}
          {/* Si l'utilisateur tape une URL inconnue, on le renvoie à l'accueil */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;