import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiFetch } from "../api.js";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email.includes("@") || !email.includes(".")) {
      alert("Veuillez entrer un email valide.");
      return;
    }

    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: { email, password },
      });

      localStorage.setItem("token", data.access_token);
      navigate("/");
    } catch (err) {
      alert(err.message || "Identifiants incorrects");
    }
  };

  return (
    <div className="glass-card auth-card">
      <h2>Connexion</h2>
      <form onSubmit={handleLogin}>
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
        <button type="submit" className="btn-primary">Se connecter</button>
      </form>

      <p style={{ marginTop: "20px", textAlign: "center", color: "#1f2937" }}>
        Pas de compte ?{" "}
        <Link to="/register" style={{ color: "#6366f1", fontWeight: "bold" }}>
          S'inscrire
        </Link>
      </p>
    </div>
  );
}
