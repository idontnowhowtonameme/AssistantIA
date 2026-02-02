import os
from datetime import datetime, timedelta, timezone
from typing import Optional  # Pour définir des paramètres optionnels

from fastapi import FastAPI, HTTPException, Depends  # Depends sert à la sécurité plus tard
from fastapi.middleware.cors import CORSMiddleware
from tinydb import TinyDB, Query
from passlib.context import CryptContext  # Pour le hachage des mots de passe
import jwt  # C'est PyJWT qui fournit cet import

# --- CONFIGURATION ---
SECRET_KEY = "TA_CLE_TRES_SECRETE_ICI"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Utilise un nom de dossier cohérent (tout en minuscules c'est mieux)
FOLDER_NAME = 'BDD'
if not os.path.exists(FOLDER_NAME):
    os.makedirs(FOLDER_NAME)

db_users = TinyDB(f'{FOLDER_NAME}/users.json')
db_history = TinyDB(f'{FOLDER_NAME}/historique.json') # Changé ici

# --- FONCTIONS UTILES ---
def create_access_token(data: dict):
    to_encode = data.copy()
    # Correction pour Python 3.12+
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# --- ROUTES ---

@app.get("/")
def health_check():
    return {"status": "online", "folder": FOLDER_NAME}

@app.post("/register")
def register(username: str, password: str, email: str):
    User = Query()
    if db_users.search(User.username == username):
        raise HTTPException(status_code=400, detail="Cet utilisateur existe déjà")
    
    hashed_password = pwd_context.hash(password)
    new_user = {
        "username": username,
        "email": email,
        "password_hash": hashed_password,
        "role": "user",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    db_users.insert(new_user)
    return {"message": "Utilisateur créé avec succès !"}

@app.post("/login")
def login(username: str, password: str):
    User = Query()
    user = db_users.get(User.username == username)
    
    if not user or not pwd_context.verify(password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Identifiants incorrects")
    
    access_token = create_access_token(data={"sub": user['username'], "role": user['role']})
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "username": user['username']
    }

@app.post("/save-history")
def save_history(user_id: str, user_message: str, llm_response: str):
    # Route avec tes noms de champs complets
    db_history.insert({
        "id_user": user_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "user_message": user_message,
        "llm_response": llm_response
    })
    return {"status": "success"}