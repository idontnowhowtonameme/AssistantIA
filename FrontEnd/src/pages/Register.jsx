import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    
    // --- AJOUT : Vérification de l'email ---
    // Cette regex impose : texte + @ + texte + . + extension (2 lettres min)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    if (!emailRegex.test(email)) {
      alert("Format d'email invalide. Exemple attendu : nom@domaine.com");
      return; // On stoppe l'exécution ici
    }

    if (password.length < 6) {
      alert("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    // --------------------------------------

    const url = new URL('http://127.0.0.1:8000/auth/register');
    url.searchParams.append('email', email);
    url.searchParams.append('password', password);

    try {
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
      alert("Erreur serveur");
    }
  };

  return (
    <div className="glass-card auth-card">
      <h2>Créer un compte</h2>
      <form onSubmit={handleRegister}>
        <div className="form-group">
          <input 
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
          />
        </div>
        <div className="form-group">
          <input 
            type="password" 
            placeholder="Mot de passe" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
          />
        </div>
        <button type="submit" className="btn-primary">S'inscrire</button>
      </form>
      <p style={{marginTop: '20px', textAlign: 'center', color: '#1f2937'}}>
        Déjà un compte ? <Link to="/login" style={{color: '#6366f1', fontWeight: 'bold'}}>Se connecter</Link>
      </p>
    </div>
  );
}