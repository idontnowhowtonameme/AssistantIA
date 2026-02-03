import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://127.0.0.1:8000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // FastAPI attend des query params par défaut, mais ici on force l'envoi en query string
        // ou on adapte le fetch selon la définition exacte de votre main.py
        // Pour être sûr avec votre main.py actuel :
      });
      
      // Note: Votre main.py actuel attend des query params pour /register
      // URL: /auth/register?email=...&password=...
      const url = new URL('http://127.0.0.1:8000/auth/register');
      url.searchParams.append('email', email);
      url.searchParams.append('password', password);

      const res = await fetch(url, { method: 'POST' });
      
      if (res.ok) {
        alert("Compte créé ! Connectez-vous.");
        navigate('/login');
      } else {
        const data = await res.json();
        alert(data.detail || "Erreur lors de l'inscription");
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '400px', margin: '0 auto' }}>
      <h2>Créer un compte</h2>
      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
          required 
        />
        <input 
          type="password" 
          placeholder="Mot de passe" 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          required 
        />
        <button type="submit">S'inscrire</button>
      </form>
      <p>Déjà un compte ? <Link to="/login">Se connecter</Link></p>
    </div>
  );
}