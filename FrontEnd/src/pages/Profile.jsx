import { useNavigate } from "react-router-dom";
import { apiFetch, clearToken } from "../api.js";

export default function Profile() {
  const navigate = useNavigate();

  const handleDeleteAccount = async () => {
    if (
      !window.confirm(
        "Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible et supprimera tous vos messages."
      )
    ) {
      return;
    }

    try {
      await apiFetch("/users/me", { method: "DELETE" });
      alert("Votre compte a été supprimé avec succès.");
      localStorage.clear();
      navigate("/login");
    } catch (err) {
      alert("Erreur lors de la suppression : " + (err.message || "Erreur"));
    }
  };

  const handleLogout = () => {
    clearToken();
    navigate("/login");
  };

  return (
    <div className="app-container">
      <div className="glass-card auth-card" style={{ maxWidth: "500px" }}>
        <h2>Mon Profil</h2>

        <div style={{ marginBottom: "30px", padding: "20px", background: "#f3f4f6", borderRadius: "12px" }}>
          <p style={{ marginBottom: "10px", color: "#4b5563" }}>
            <strong>Attention :</strong> La suppression de compte est une action irréversible.
          </p>
          <p style={{ color: "#6b7280", fontSize: "0.9rem" }}>
            Tous vos messages, votre historique de conversation et vos données personnelles seront définitivement supprimés.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <button
            onClick={() => navigate("/")}
            style={{
              padding: "12px",
              borderRadius: "8px",
              background: "#f3f4f6",
              border: "1px solid #d1d5db",
              color: "#1f2937",
              cursor: "pointer",
              fontWeight: "500",
            }}
          >
            ← Retour au chat
          </button>

          <button
            onClick={handleLogout}
            style={{
              padding: "12px",
              borderRadius: "8px",
              background: "#6366f1",
              border: "none",
              color: "white",
              cursor: "pointer",
              fontWeight: "500",
            }}
          >
            Déconnexion
          </button>

          <button
            onClick={handleDeleteAccount}
            style={{
              padding: "12px",
              borderRadius: "8px",
              background: "#26dc38",
              border: "none",
              color: "white",
              cursor: "pointer",
              fontWeight: "500",
            }}
          >
            Supprimer mon compte
          </button>
        </div>
      </div>
    </div>
  );
}
