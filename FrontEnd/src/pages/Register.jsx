import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://127.0.0.1:8000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (res.ok) {
        alert("Compte créé ! Connectez-vous.");
        navigate('/login');
      } else {
        const data = await res.json();
        alert(data.detail || "Erreur lors de l'inscription. Note : vérifiez que votre email est réel (MX record).");
      }
    } catch (error) {
      alert("Erreur serveur");
    }
  };

  return (
    <div className="glass-card auth-card">
      <h2>Créer un compte</h2>
      <form onSubmit={handleRegister}>
        <div className="form-group">
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div className="form-group">
          <input type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <button type="submit" className="btn-primary">S'inscrire</button>
      </form>
      <p style={{marginTop: '20px'}}>Déjà un compte ? <Link to="/login">Se connecter</Link></p>
    </div>
  );
}