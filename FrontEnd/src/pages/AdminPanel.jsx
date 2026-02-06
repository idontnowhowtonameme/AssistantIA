import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api.js";

export default function AdminPanel({ isOpen, onClose, currentUserId }) {
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const data = await apiFetch("/users"); // admin-only
      setUsers(data.items || []);
    } catch (e) {
      setErr(e.message || "Impossible de charger les utilisateurs.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return users;
    return users.filter((u) => {
      const hay = `${u.email} ${u.id} ${u.role || ""}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [users, q]);

  const deleteUser = async (userId, email) => {
    if (userId === currentUserId) {
      alert("Tu ne peux pas supprimer ton propre compte depuis cette fenêtre. Utilise 'Supprimer compte'.");
      return;
    }
    if (!window.confirm(`Supprimer l'utilisateur ${email} ? Cette action est irréversible.`)) return;

    try {
      await apiFetch(`/users/${userId}`, { method: "DELETE" });
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      alert("Utilisateur supprimé.");
    } catch (e) {
      alert(e.message || "Erreur suppression.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal-content" onMouseDown={(e) => e.stopPropagation()}>
        <h3 style={{ marginBottom: 12 }}>🛠️ Gestion des comptes (Admin)</h3>

        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <input
            placeholder="Rechercher (email, id, rôle)..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className="history-btn" onClick={load} disabled={loading} title="Rafraîchir">
            🔄
          </button>
        </div>

        {loading && <div className="history-empty">Chargement...</div>}

        {!loading && err && (
          <div className="history-error">
            <p>{err}</p>
            <button className="btn-primary" onClick={load}>Réessayer</button>
          </div>
        )}

        {!loading && !err && filtered.length === 0 && (
          <div className="history-empty">Aucun utilisateur.</div>
        )}

        {!loading && !err && filtered.length > 0 && (
          <div style={{ maxHeight: 420, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((u) => (
              <div
                key={u.id}
                style={{
                  background: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: "10px 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {u.email}
                    {u.id === currentUserId ? " (moi)" : ""}
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>{u.id}</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>role: {u.role || "user"}</div>
                </div>

                <button
                  className="delete-account-btn"
                  onClick={() => deleteUser(u.id, u.email)}
                  disabled={u.id === currentUserId}
                  title={u.id === currentUserId ? "Impossible" : "Supprimer"}
                >
                  Supprimer
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  );
}
