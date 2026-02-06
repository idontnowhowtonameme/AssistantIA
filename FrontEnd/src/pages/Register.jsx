import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiFetch } from "../api.js";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await apiFetch("/auth/register", {
        method: "POST",
        body: { email, password },
      });

      alert("Compte créé ! Connectez-vous.");
      navigate("/login");
    } catch (err) {
      alert(err.message || "Erreur lors de l'inscription.");
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
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn-primary">S'inscrire</button>
      </form>

      <p style={{ marginTop: "20px" }}>
        Déjà un compte ? <Link to="/login">Se connecter</Link>
      </p>
    </div>
  );
}
