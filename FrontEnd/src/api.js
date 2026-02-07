const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export function getToken() {
  return localStorage.getItem("token");
}

export function clearToken() {
  localStorage.removeItem("token");
}

export async function apiFetch(path, { method = "GET", body, token, headers } = {}) {
  const finalToken = token ?? getToken();

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(finalToken ? { Authorization: `Bearer ${finalToken}` } : {}),
      ...(headers || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  const data = text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : null;

  if (!res.ok) {
    const detail =
      (data && typeof data === "object" && data.detail) ? data.detail : `Erreur HTTP ${res.status}`;
    const err = new Error(detail);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}
