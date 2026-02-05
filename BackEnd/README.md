# AssistantIA – Backend API

Backend de l’application **AssistantIA**, une API REST sécurisée permettant :

- l’authentification utilisateur (JWT)
- l’accès à une IA via un service LLM externe (OpenRouter)
- la gestion de l’historique des conversations par utilisateur

---

## 🧱 Stack technique

- Python 3.11
- FastAPI
- Uvicorn
- JWT (python-jose)
- bcrypt (hash des mots de passe)
- TinyDB (stockage JSON)
- OpenRouter (LLM externe)
- httpx (requêtes HTTP async)

---

## 📁 Architecture du projet

```text
BackEnd/
├── app/
│   ├── main.py              # Point d’entrée FastAPI (factory)
│   ├── config.py            # Variables d’environnement
│   ├── database.py          # Initialisation TinyDB
│   ├── security.py          # Hash + JWT
│   ├── dependencies.py      # Dépendances FastAPI (auth JWT)
│   ├── schemas.py           # Schémas Pydantic
│   ├── llm.py               # Appel LLM via OpenRouter
│   └── routers/
│       ├── auth.py          # Authentification
│       ├── history.py       # Historique utilisateur
│       └── ai.py            # Endpoint IA
├── BDD/
│   ├── users.json           # Base utilisateurs
│   └── historique.json      # Historique des conversations
├── .env                     # Variables d’environnement (non versionné)
├── .gitignore
├── requirements.txt
└── README.md
```

---

## ⚙️ Installation

### 1️⃣ Cloner le projet

```bash
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

    Swagger : http://127.0.0.1:8000/docs

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
Mots de passe

    jamais stockés en clair

    hashés avec bcrypt

Authentification

    JWT avec expiration

    routes sensibles protégées via dépendances FastAPI

Clé IA

    stockée uniquement côté serveur

    jamais exposée au client

🚪 Déconnexion (Logout)
Pourquoi il n’y a pas de /logout côté backend ?

La déconnexion n’est pas gérée par une route backend, ce qui est un choix volontaire et standard avec les JWT.
Fonctionnement

    le backend génère un token JWT à la connexion

    le token est stateless

    le backend ne stocke pas les sessions

Déconnexion côté frontend

La déconnexion consiste simplement à :

    supprimer le token JWT côté client
    (ex. localStorage.removeItem("token"))

    ne plus envoyer l’en-tête :

Authorization: Bearer <token>

Toute tentative d’accès à une route protégée retournera 401 Unauthorized.
Cas hors périmètre

Un /logout backend serait utile uniquement pour :

    blacklist de tokens

    refresh tokens

    révocation forcée (admin)

👉 Ces mécanismes sont volontairement hors périmètre du backend de ce projet.
🔄 Fonctionnement global de l’API

    FastAPI (main.py)

        initialise l’application

        charge la configuration

        monte les routers (/auth, /ai, /history)

    Routers (routers/*.py)

        reçoivent les requêtes HTTP

        valident les données via schemas.py

        appliquent les dépendances (JWT)

    Sécurité

        vérification JWT

        identification de l’utilisateur courant

    Données

        persistance via TinyDB

        isolation de la logique de stockage

    IA

        appel OpenRouter via llm.py

        clé API strictement côté serveur

👥 Gestion des comptes utilisateurs

Le backend implémente une gestion des comptes basée sur des rôles (user / admin) et des règles de sécurité strictes.

🔑 Rôles utilisateur

Chaque utilisateur possède un champ role stocké en base (TinyDB) :

{
  "id": "usr_xxxxx",
  "email": "user@example.com",
  "password_hash": "...",
  "role": "user",
  "created_at": "..."
}


user : rôle par défaut à l’inscription

admin : rôle avec privilèges étendus

👉 Le rôle n’est jamais fourni par le client :
il est défini côté backend pour éviter toute élévation de privilèges.

🧑‍💻 Attribution du rôle admin

Par conception, ce projet ne prévoit pas d’endpoint public pour devenir admin.

Un utilisateur peut être promu admin :

manuellement (édition de users.json en environnement local)

ou via un script / seed interne (hors périmètre du projet)

Ce choix garantit :

un contrôle total côté serveur

l’absence de failles liées à l’auto-attribution de privilèges

🗑️ Suppression de comptes utilisateurs

Le backend permet deux types de suppression de comptes :

1️⃣ Suppression de son propre compte (self-delete)

Un utilisateur authentifié (admin ou non) peut supprimer son propre compte uniquement.

Caractéristiques :

l’identification se fait via le JWT

aucun identifiant utilisateur n’est fourni par le client

l’utilisateur ne peut supprimer que son compte

🔒 Route protégée par JWT

2️⃣ Suppression d’un compte par un administrateur

Un utilisateur ayant le rôle admin peut supprimer n’importe quel compte utilisateur.

Caractéristiques :

la route est protégée par une dépendance require_admin

l’identification du compte se fait via le user_id

le backend vérifie systématiquement les droits

🧹 Nettoyage automatique de l’historique

Lorsqu’un compte utilisateur est supprimé (par lui-même ou par un admin) :

✅ toutes les conversations associées à cet utilisateur sont supprimées automatiquement

Cela garantit :

la cohérence des données

le respect de la confidentialité

l’absence de données orphelines

L’association est basée sur le champ :

"user_id": "usr_xxxxx"


présent dans chaque message de l’historique.

🆔 Pourquoi utiliser un user_id plutôt que l’email ?

Le backend repose sur un identifiant interne unique (user_id) plutôt que sur l’email.

Avantages :

l’email peut changer

le user_id est immuable

les relations (historique, permissions) restent cohérentes

meilleure séparation entre données métier et données utilisateur

L’email reste :

un identifiant fonctionnel (login)

mais jamais une clé primaire

🔐 Sécurité et garanties

impossible pour un utilisateur de supprimer un autre compte

impossible de devenir admin via l’API

suppression atomique : utilisateur + historique

toutes les routes sensibles sont protégées par JWT

📌 Notes

Ce backend est conçu pour être consommé par un frontend React (SPA) utilisant un token JWT stocké côté client et transmis via l’en-tête :

Authorization: Bearer <token>