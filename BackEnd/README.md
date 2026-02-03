AssistantIA – Backend API

Backend de l’application AssistantIA, une API REST sécurisée permettant :

l’authentification utilisateur (JWT),

l’accès à une IA via un service LLM externe (OpenRouter),

la gestion de l’historique des conversations par utilisateur.

🧱 Stack technique

Python 3.11

FastAPI

Uvicorn

JWT (python-jose)

bcrypt (hash des mots de passe)

TinyDB (stockage JSON)

OpenRouter (LLM externe)

httpx (requêtes HTTP async)

📁 Architecture du projet
BackEnd/
├── app/
│   ├── main.py              # Point d’entrée FastAPI (factory)
│   ├── config.py            # Chargement et accès aux variables d’environnement
│   ├── database.py          # Initialisation TinyDB
│   ├── security.py          # Hash mot de passe + JWT
│   ├── dependencies.py      # Dépendances FastAPI (auth JWT)
│   ├── schemas.py           # Schémas Pydantic (request / response)
│   ├── llm.py               # Appel au LLM via OpenRouter
│   └── routers/
│       ├── auth.py          # Authentification (register / login / me)
│       ├── history.py       # Historique utilisateur
│       └── ai.py            # Endpoint IA
├── BDD/
│   ├── users.json           # Base utilisateurs (TinyDB)
│   └── historique.json      # Historique des conversations
├── .env                     # Variables d’environnement (non versionné)
├── .gitignore
├── requirements.txt
└── README.md

⚙️ Installation
1️⃣ Cloner le projet
git clone https://github.com/idontnowhowtonameme/AssistantIA
cd AssistantIA/BackEnd

2️⃣ Créer et activer un environnement virtuel
python -m venv .venv


Windows

.\.venv\Scripts\Activate.ps1


Linux / macOS

source .venv/bin/activate

3️⃣ Installer les dépendances
pip install -r requirements.txt

🔐 Configuration (.env)

Créer un fichier .env à la racine du dossier BackEnd :

# JWT
JWT_SECRET=super_secret_de_test
JWT_ALGORITHM=HS256
JWT_EXPIRES_MINUTES=15

# OpenRouter (LLM)
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxx
OPENROUTER_MODEL=openrouter/auto
OPENROUTER_SITE_URL=http://localhost:3000
OPENROUTER_APP_NAME=AssistantIA


⚠️ Le fichier .env ne doit jamais être versionné.

▶️ Lancer le serveur

Depuis le dossier BackEnd :

uvicorn app.main:app --reload


API : http://127.0.0.1:8000

Documentation Swagger : http://127.0.0.1:8000/docs

🔑 Authentification (JWT)
POST /auth/register

Créer un compte utilisateur.

{
  "email": "user@example.com",
  "password": "Password123!"
}

POST /auth/login

Connexion utilisateur.

{
  "email": "user@example.com",
  "password": "Password123!"
}


Réponse :

{
  "access_token": "JWT_TOKEN",
  "token_type": "bearer"
}

GET /auth/me

Retourne les informations de l’utilisateur connecté.
🔒 Route protégée (JWT requis).

🤖 IA (LLM)
POST /ai/chat

Envoie un message à l’IA et enregistre la conversation.

🔒 JWT requis

{
  "message": "Bonjour, peux-tu te présenter ?"
}


Réponse :

{
  "answer": "..."
}


⚠️ L’appel au LLM est effectué uniquement côté backend.
La clé API n’est jamais exposée au frontend.

🗂️ Historique
GET /history

Récupère l’historique des messages de l’utilisateur connecté.

DELETE /history

Supprime l’historique de l’utilisateur connecté.

🔐 Sécurité

Mots de passe :

jamais stockés en clair

hashés avec bcrypt

Authentification :

JWT avec expiration

routes sensibles protégées via dépendances FastAPI

Clé IA :

stockée uniquement côté serveur

jamais exposée au client

📌 Notes

Ce backend est conçu pour être consommé par un frontend React (SPA) utilisant un token JWT stocké côté client et transmis via l’en-tête :

Authorization: Bearer <token>