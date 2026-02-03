import os
import uuid
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from tinydb import Query, TinyDB
from llm import call_openrouter

# Charge BackEnd/.env (IMPORTANT: avant d'utiliser os.getenv dans security.py)
load_dotenv()

from security import create_access_token, get_user_id_from_token, hash_password, verify_password




app = FastAPI(title="AssistantIA API")

# CORS (React)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # CRA
        "http://localhost:5173",  # Vite
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- BDD (TinyDB) ---
BASE_DIR = Path(__file__).resolve().parent  # dossier BackEnd
BDD_DIR = BASE_DIR / "BDD"
BDD_DIR.mkdir(exist_ok=True)

# ⬇️ FICHIERS BDD (NOUVEAUX NOMS)
db_users = TinyDB(BDD_DIR / "users.json")
db_history = TinyDB(BDD_DIR / "historique.json")

# ⬇️ TABLES (noms logiques inchangés)
dbuser = db_users.table("dbuser")
dbhistorique = db_history.table("dbhistorique")

UserQ = Query()
HistQ = Query()

# --- Auth (JWT Bearer) ---
bearer = HTTPBearer(auto_error=True)

def get_current_user(creds: HTTPAuthorizationCredentials = Depends(bearer)) -> dict:
    token = creds.credentials
    try:
        user_id = get_user_id_from_token(token)
    except ValueError:
        raise HTTPException(status_code=401, detail="Votre Session a expiré veuillez vous déconnecter et reconnecter")

    user = dbuser.get(UserQ.id == user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


@app.get("/")
def health_check():
    return {"status": "online"}


# ---------- AUTH ----------
@app.post("/auth/register", status_code=201)
def register(email: str, password: str):
    email_norm = email.strip().lower()

    if dbuser.get(UserQ.email == email_norm):
        raise HTTPException(status_code=409, detail="Email already registered")

    user_id = f"usr_{uuid.uuid4().hex}"
    user_doc = {
        "id": user_id,
        "email": email_norm,
        "password_hash": hash_password(password),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    dbuser.insert(user_doc)
    return {"id": user_id, "email": email_norm, "created_at": user_doc["created_at"]}


@app.post("/auth/login")
def login(email: str, password: str):
    email_norm = email.strip().lower()
    user = dbuser.get(UserQ.email == email_norm)

    if not user or not verify_password(password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(user_id=user["id"])
    return {"access_token": token, "token_type": "bearer"}


@app.get("/auth/me")
def me(user=Depends(get_current_user)):
    return {"id": user["id"], "email": user["email"], "created_at": user["created_at"]}


# ---------- HISTORY ----------
@app.get("/history")
def history(limit: int = 50, offset: int = 0, user=Depends(get_current_user)):
    # garde-fous simples
    if limit < 1:
        limit = 1
    if limit > 200:
        limit = 200
    if offset < 0:
        offset = 0

    user_id = user["id"]
    all_items = dbhistorique.search(HistQ.user_id == user_id)

    # Tri par date (ISO) -> tri lexical OK
    all_items.sort(key=lambda x: x.get("created_at", ""))

    items = all_items[offset: offset + limit]
    return {"items": items, "limit": limit, "offset": offset}

# ---------- AI CHAT ----------
@app.post("/ai/chat")
async def ai_chat(message: str, user=Depends(get_current_user)):
    """
    Endpoint protégé :
    - nécessite un JWT valide (via get_current_user)
    - prend un message utilisateur
    - appelle OpenRouter
    - stocke question + réponse dans l'historique
    """
    user_id = user["id"]

    # 1) Sauvegarder le message utilisateur dans l'historique
    dbhistorique.insert({
        "id": f"msg_{uuid.uuid4().hex}",
        "user_id": user_id,
        "role": "user",
        "content": message,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    # 2) Appeler l'IA (OpenRouter)
    try:
        answer = await call_openrouter([
            {"role": "system", "content": "Tu es un assistant utile et concis."},
            {"role": "user", "content": message},
        ])
    except RuntimeError as e:
        # En cas d'erreur fournisseur, on renvoie une erreur propre côté API
        raise HTTPException(status_code=502, detail=str(e))

    # 3) Sauvegarder la réponse de l'assistant
    dbhistorique.insert({
        "id": f"msg_{uuid.uuid4().hex}",
        "user_id": user_id,
        "role": "assistant",
        "content": answer,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    # 4) Retourner la réponse au client (frontend)
    return {"answer": answer}

# ---------- delete ----------
@app.delete("/history")
def clear_history(user=Depends(get_current_user)):
    user_id = user["id"]
    removed = dbhistorique.remove(HistQ.user_id == user_id)
    return {"deleted": len(removed)}
