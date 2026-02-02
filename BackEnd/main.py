import os
from datetime import datetime, timedelta
from typing import Optional

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from tinydb import TinyDB, Query
from passlib.context import CryptContext
import jwt

# --- CONFIGURATION ---
SECRET_KEY = "TA_CLE_TRES_SECRETE_ICI" # À mettre dans un .env plus tard
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

app = FastAPI()

# Configuration CORS pour Vike/React (port 3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Sécurité : Hachage des mots de passe
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Initialisation des bases de données dans le dossier /bdd
if not os.path.exists('bdd'):
    os.makedirs('bdd')

db_users = TinyDB('bdd/users.json')
db_content = TinyDB('bdd/content.json')

# --- FONCTIONS UTILES ---
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# --- ROUTES ---

@app.get("/")
def health_check():
    return {"status": "online", "database": "bdd/ folder ready"}

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
        "created_at": datetime.utcnow().isoformat()
    }
    db_users.insert(new_user)
    return {"message": "Utilisateur créé avec succès !"}

@app.post("/login")
def login(username: str, password: str):
    User = Query()
    user = db_users.get(User.username == username)
    
    if not user or not pwd_context.verify(password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Identifiants incorrects")
    
    # Création du Token
    access_token = create_access_token(data={"sub": user['username'], "role": user['role']})
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "username": user['username']
    }

@app.post("/add-content")
def add_content(text: str, token: str):
    # Ici, on ajoutera plus tard une vérification de token
    db_content.insert({"text": text, "date": datetime.utcnow().isoformat()})
    return {"status": "Contenu ajouté"}