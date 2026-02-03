import os
import uuid
import httpx  # Ajout pour l'appel IA
from datetime import datetime, timezone
from pathlib import Path
from pydantic import BaseModel # Pour valider le corps de la requête

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from tinydb import Query, TinyDB

load_dotenv()

from security import create_access_token, get_user_id_from_token, hash_password, verify_password

app = FastAPI(title="AssistantIA API")

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- BDD (TinyDB) ---
BASE_DIR = Path(__file__).resolve().parent
BDD_DIR = BASE_DIR / "BDD"
BDD_DIR.mkdir(exist_ok=True)

db_users = TinyDB(BDD_DIR / "users.json")
db_history = TinyDB(BDD_DIR / "historique.json")
dbuser = db_users.table("dbuser")
dbhistorique = db_history.table("dbhistorique")

UserQ = Query()
HistQ = Query()

# --- Modèles de données ---
class ChatRequest(BaseModel):
    message: str

# --- Auth Dependency ---
bearer = HTTPBearer()

def get_current_user(creds: HTTPAuthorizationCredentials = Depends(bearer)) -> dict:
    token = creds.credentials
    try:
        user_id = get_user_id_from_token(token)
    except ValueError:
        raise HTTPException(status_code=401, detail="Token invalide ou expiré")

    user = dbuser.get(UserQ.id == user_id)
    if not user:
        raise HTTPException(status_code=401, detail="Utilisateur non trouvé")
    return user

# ---------- ROUTES ----------

@app.post("/auth/register", status_code=201)
def register(email: str, password: str):
    email_norm = email.strip().lower()
    if dbuser.get(UserQ.email == email_norm):
        raise HTTPException(status_code=409, detail="Cet email est déjà utilisé")

    user_id = f"usr_{uuid.uuid4().hex}"
    user_doc = {
        "id": user_id,
        "email": email_norm,
        "password_hash": hash_password(password),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    dbuser.insert(user_doc)
    return {"id": user_id, "email": email_norm}

@app.post("/auth/login")
def login(email: str, password: str):
    email_norm = email.strip().lower()
    user = dbuser.get(UserQ.email == email_norm)

    if not user or not verify_password(password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Identifiants incorrects")

    token = create_access_token(user_id=user["id"])
    return {"access_token": token, "token_type": "bearer"}

@app.get("/history")
def history(user=Depends(get_current_user)):
    items = dbhistorique.search(HistQ.user_id == user["id"])
    # Tri par date du plus récent au plus ancien
    items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return {"items": items}

@app.post("/ai/chat")
async def ai_chat(request: ChatRequest, user=Depends(get_current_user)):
    user_id = user["id"]
    api_key = os.getenv("OPENROUTER_API_KEY")

    # 1. Sauvegarde du message utilisateur
    dbhistorique.insert({
        "id": f"msg_{uuid.uuid4().hex}",
        "user_id": user_id,
        "role": "user",
        "content": request.message,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    # 2. Appel réel à l'IA via OpenRouter
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}"},
                json={
                    "model": "mistralai/mistral-7b-instruct:free", # Modèle gratuit
                    "messages": [{"role": "user", "content": request.message}]
                },
                timeout=30.0
            )
            response.raise_for_status()
            data = response.json()
            answer = data["choices"][0]["message"]["content"]
    except Exception as e:
        answer = "Désolé, je rencontre une difficulté technique pour répondre."

    # 3. Sauvegarde de la réponse de l'IA
    dbhistorique.insert({
        "id": f"msg_{uuid.uuid4().hex}",
        "user_id": user_id,
        "role": "assistant",
        "content": answer,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    return {"answer": answer}