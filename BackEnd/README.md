## 🚀 En résumé

AssistantIA est un backend FastAPI sécurisé qui fournit :
- une authentification JWT
- une gestion multi-conversationnelle par utilisateur
- une interaction avec un LLM externe (OpenRouter)
- une mémoire conversationnelle limitée et maîtrisée
Conçu comme un backend propre, sécurisé et prêt à être consommé par un frontend SPA.

# AssistantIA – Backend API

Backend de l’application **AssistantIA**, une API REST sécurisée permettant :
- l’authentification utilisateur (JWT)
- l’accès à une IA via un service LLM externe (OpenRouter)
- la gestion des conversations (threads) et des messages associés par utilisateur

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
│   ├── __init__.py
│   ├── config.py            # Variables d’environnement et configuration globale
│   ├── database.py          # Initialisation TinyDB (users, conversations, messages)
│   ├── dependencies.py      # Dépendances FastAPI (auth JWT, rôles)
│   ├── llm.py               # Appel au LLM via OpenRouter
│   ├── schemas.py           # Schémas Pydantic (API & données)
│   ├── security.py          # Hash des mots de passe + JWT
│   ├── validators.py        # Validations métier (ex: domaine email)
│   └── routers/
│       ├── __init__.py
│       ├── auth.py          # Authentification (register, login, me)
│       ├── users.py         # Gestion des comptes utilisateurs (delete, admin)
│       ├── conversations.py # Gestion des conversations (threads)
│       ├── history.py       # Historique des messages par conversation
│       └── ai.py            # Endpoint IA (chat, contexte conversationnel)
│
├── BDD/
│   ├── users.json           # Base utilisateurs (TinyDB)
│   ├── conversations.json  # Conversations (threads)
│   └── historique.json     # Messages (historique par conversation)
│
├── .env                     # Variables d’environnement (non versionné)
├── .gitignore
├── main.py                  # Point d’entrée Uvicorn / FastAPI
├── requirements.txt
└── README.md
```

---

## ⚙️ Installation

### 1️⃣ Cloner le projet

```bash
git clone https://github.com/idontnowhowtonameme/AssistantIA
cd AssistantIA/BackEnd
```

2️⃣ Créer et activer un environnement virtuel

```bash
python -m venv .venv
Windows
.\.venv\Scripts\Activate.ps1
Linux / macOS
source .venv/bin/activate
```

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

# Contexte IA (mémoire conversationnelle)
CHAT_MEMORY_MESSAGES=8

⚠️ Le fichier .env ne doit jamais être versionné.

▶️ Lancer le serveur

Depuis le dossier BackEnd :
```bash
uvicorn app.main:app --reload
    API : http://127.0.0.1:8000
    Swagger : http://127.0.0.1:8000/docs
```

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
  "message": "Bonjour, peux-tu te présenter ?",
  "conversation_id": "conv_xxxxx"
}

conversation_id est optionnel.
S’il est absent, le backend crée une nouvelle conversation et renvoie le conversation_id.

Réponse :
{
  "answer": "...",
  "conversation_id": "conv_xxxxx"
}

⚠️ L’appel au LLM est effectué uniquement côté backend.
La clé API n’est jamais exposée au frontend.

🧵 Conversations (threads)

GET /conversations : liste les conversations de l’utilisateur (triées par updated_at décroissant)
POST /conversations : crée une conversation (title optionnel)
DELETE /conversations/{conversation_id} : supprime une conversation + ses messages

🗂️ Historique (messages)

GET /history/{conversation_id}
Récupère les messages d’une conversation précise.

DELETE /history/{conversation_id}
Supprime tous les messages d’une conversation.

DELETE /history
Supprime toutes les conversations et tous les messages de l’utilisateur.

🔒 JWT requis

🔐 Sécurité et garanties

Authentification
    JWT avec expiration
    routes sensibles protégées via dépendances FastAPI
    identification fiable de l’utilisateur courant

Mots de passe
    jamais stockés en clair
    hashés avec bcrypt

Gestion des rôles
    rôles user / admin définis côté backend
    aucune élévation de privilèges possible via l’API

Clé IA
    stockée uniquement côté serveur
    jamais exposée au client

Isolation des données
    un utilisateur n’accède qu’à ses propres conversations
    aucune fuite de contexte entre conversations

Suppression des données
    suppression atomique côté backend :
        - utilisateur
        - conversations associées
        - messages associés
    aucune donnée orpheline n’est conservée

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
        monte les routers (/auth, /users, /conversations, /history, /ai)

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

### 🧠 Contexte conversationnel et mémoire limitée

L’IA dispose d’un contexte de conversation basé sur l’historique utilisateur.

À chaque requête :
- les derniers messages de l’utilisateur sont récupérés depuis l’historique
- seuls les N derniers échanges sont transmis au LLM
- cela permet de conserver une continuité de dialogue tout en maîtrisant la taille du prompt

💬 Gestion multi-conversationnelle

Le backend implémente une gestion multi-conversationnelle par utilisateur, permettant de gérer plusieurs discussions distinctes avec l’IA (threads).

🧩 Principe général

Un utilisateur peut posséder plusieurs conversations
Chaque conversation est identifiée par un conversation_id
Chaque message appartient à une seule conversation
Les conversations sont totalement isolées entre elles

Exemple :

Utilisateur A
 ├── Conversation A (conv_x1)
 │    ├── user: Bonjour
 │    ├── assistant: Bonjour !
 │
 ├── Conversation B (conv_x2)
 │    ├── user: Explique-moi FastAPI
 │    ├── assistant: ...

🗂️ Modèle de données (TinyDB)
Conversation

Une conversation représente un thread de discussion.

{
  "id": "conv_xxxxx",
  "user_id": "usr_xxxxx",
  "title": "Nouvelle conversation",
  "created_at": "2026-02-05T10:12:00Z",
  "updated_at": "2026-02-05T10:15:42Z"
}


user_id : propriétaire de la conversation
updated_at : mis à jour à chaque nouveau message (utile pour le tri côté frontend)

Message (historique)
Chaque message est stocké individuellement et rattaché à une conversation.

{
  "id": "msg_xxxxx",
  "user_id": "usr_xxxxx",
  "conversation_id": "conv_xxxxx",
  "role": "user",
  "content": "Bonjour",
  "created_at": "2026-02-05T10:15:42Z"
}


role : user ou assistant
conversation_id : lien explicite vers la conversation
les messages sont stockés chronologiquement

🔁 Cycle de vie d’une conversation
1️⃣ Création explicite
POST /conversations

{
  "title": "Discussion FastAPI"
}

Retourne un conversation_id que le frontend conserve.

2️⃣ Création implicite (auto)

Si le frontend appelle l’IA sans fournir de conversation_id :

{
  "message": "Bonjour"
}


➡️ le backend crée automatiquement une nouvelle conversation
➡️ et retourne le conversation_id généré

{
  "answer": "...",
  "conversation_id": "conv_xxxxx"
}

3️⃣ Envoi d’un message dans une conversation existante
POST /ai/chat

{
  "conversation_id": "conv_xxxxx",
  "message": "Peux-tu m’aider ?"
}

🧠 Contexte IA par conversation

Pour chaque appel à l’IA :
seuls les messages de la conversation active sont pris en compte
le contexte est limité aux N derniers messages

N est configurable via :
CHAT_MEMORY_MESSAGES = 8

➡️ Cela garantit :
une continuité de dialogue cohérente
une consommation maîtrisée du prompt
aucune fuite de contexte entre conversations

📜 Accès à l’historique
GET /history/{conversation_id}

Retourne les messages d’une conversation précise (pagination possible).

🗑️ Suppression et cohérence des données

Supprimer une conversation entraîne :
la suppression de tous les messages associés

Supprimer un utilisateur entraîne :
la suppression de toutes ses conversations
la suppression de tout son historique

➡️ Aucun message ou conversation orpheline n’est conservé.

📌 Notes

Ce backend est conçu pour être consommé par un frontend React (SPA) utilisant un token JWT stocké côté client et transmis via l’en-tête :

Authorization: Bearer <token>