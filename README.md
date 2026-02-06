# AssistantIA - Plateforme Complète

AssistantIA est une application complète d'assistant conversationnel IA, composée d'un backend FastAPI sécurisé et d'un frontend React moderne. La plateforme offre une interface utilisateur premium avec authentification JWT, gestion multi-conversationnelle et interactions en temps réel avec l'IA.

## 🌐 Vue d'ensemble complète

### **Frontend** - Interface utilisateur moderne
Application React offrant une expérience utilisateur fluide avec design glassmorphism, gestion d'état avancée et interactions en temps réel.

### **Backend** - API sécurisée FastAPI
Backend robuste fournissant :
- Authentification JWT sécurisée
- Gestion multi-conversationnelle par utilisateur
- Interaction avec LLM externe (OpenRouter)
- Mémoire conversationnelle limitée et maîtrisée
- Isolation complète des données utilisateur

## 🛠️ Stack technique complète

### Frontend
- **React 18** avec Vite pour un développement rapide
- **React Router DOM v6** pour la navigation
- **Axios** pour les requêtes HTTP
- **Context API** pour la gestion d'état globale
- **CSS Modules** avec animations modernes
- **JWT Decode** pour la gestion des tokens
- **Glassmorphism** pour l'interface premium

### Backend
- **Python 3.11** avec FastAPI
- **Uvicorn** pour le serveur ASGI
- **JWT (python-jose)** pour l'authentification
- **bcrypt** pour le hash des mots de passe
- **TinyDB** pour le stockage JSON léger
- **OpenRouter** pour l'accès aux LLM
- **httpx** pour les requêtes HTTP async

## 📁 Architecture du projet

### Structure complète

```text
AssistantIA/
├── FrontEnd/                    # Application React
│   ├── public/
│   │   ├── index.html
│   │   └── assets/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Auth/
│   │   │   │   ├── Login.jsx
│   │   │   │   └── Register.jsx
│   │   │   ├── Chat.jsx
│   │   │   ├── HistoryPanel.jsx
│   │   │   └── Profile.jsx
│   │   ├── contexts/           # Contextes React
│   │   │   ├── AuthContext.js
│   │   │   ├── ChatContext.js
│   │   │   └── HistoryContext.js
│   │   ├── components/         # Composants réutilisables
│   │   │   ├── ChatContainer.jsx
│   │   │   ├── MessageBubble.jsx
│   │   │   ├── ChatInput.jsx
│   │   │   └── ChatHeader.jsx
│   │   ├── services/          # Services API
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── main.jsx
│   │   └── routes.jsx
│   ├── .env
│   ├── .gitignore
│   ├── package.json
│   ├── vite.config.js
│   └── README.md
│
└── BackEnd/                    # API FastAPI
    ├── app/
    │   ├── __init__.py
    │   ├── config.py           # Configuration globale
    │   ├── database.py         # Initialisation TinyDB
    │   ├── dependencies.py     # Dépendances FastAPI
    │   ├── llm.py              # Appel au LLM
    │   ├── schemas.py          # Schémas Pydantic
    │   ├── security.py         # Hash + JWT
    │   ├── validators.py       # Validations métier
    │   └── routers/
    │       ├── __init__.py
    │       ├── auth.py         # Authentification
    │       ├── users.py        # Gestion utilisateurs
    │       ├── conversations.py # Conversations
    │       ├── history.py      # Historique
    │       └── ai.py           # Endpoint IA
    ├── BDD/                   # Stockage JSON
    │   ├── users.json
    │   ├── conversations.json
    │   └── historique.json
    ├── .env                   # Variables d'environnement
    ├── .gitignore
    ├── main.py                # Point d'entrée
    ├── requirements.txt
    └── README.md
```

🚀 Installation et configuration
Prérequis globaux
Node.js 18+ et npm/yarn pour le frontend

Python 3.11+ et pip pour le backend

Git pour le versionnement

1. Clonage du projet
bash
git clone https://github.com/idontnowhowtonameme/AssistantIA
cd AssistantIA
2. Installation du Backend
bash
cd BackEnd

# Créer et activer un environnement virtuel
python -m venv .venv

# Windows
.\.venv\Scripts\Activate.ps1

# Linux / macOS
source .venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt
3. Configuration du Backend
Créer un fichier .env dans BackEnd/ :

env
# JWT
JWT_SECRET=super_secret_de_test
JWT_ALGORITHM=HS256
JWT_EXPIRES_MINUTES=15

# OpenRouter (LLM)
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxx
OPENROUTER_MODEL=openrouter/auto
OPENROUTER_SITE_URL=http://localhost:3000
OPENROUTER_APP_NAME=AssistantIA

# Contexte IA
CHAT_MEMORY_MESSAGES=8
4. Installation du Frontend
bash
cd ../FrontEnd

# Installer les dépendances
npm install
# ou
yarn install
5. Configuration du Frontend
Créer un fichier .env dans FrontEnd/ :

env
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=AssistantIA
VITE_APP_VERSION=1.0.0
🏃 Lancement des services
1. Démarrer le Backend
bash
cd BackEnd
uvicorn app.main:app --reload
API : http://localhost:8000

Documentation Swagger : http://localhost:8000/docs

2. Démarrer le Frontend
bash
cd FrontEnd
npm run dev
# ou
yarn dev
Application : http://localhost:5173

🔐 Architecture d'authentification
Flux JWT complet
graph LR
    A[Login Page] --> B{Valid Credentials?}
    B -->|Yes| C[Backend: Génère JWT]
    B -->|No| A
    C --> D[Frontend: Stocke token]
    D --> E[Redirection vers Chat]
    E --> F[Protected Routes]
    F --> G[Axios: Auto-auth Header]
    G --> H[Backend: Vérifie JWT]
Sécurité multi-couches
Frontend : Validation côté client + sanitization

Backend : Hash bcrypt + vérification JWT

Stockage : Tokens non persistants côté serveur

Isolation : Données utilisateur strictement séparées

🤖 Système de chat intelligent
Caractéristiques principales
Messages en temps réel : Interface fluide avec animations

Multi-conversations : Gestion de plusieurs threads simultanés

Historique contextuel : Récupération intelligente des conversations

Markdown supporté : Messages formatés avec mise en forme

Mémoire limitée : Contexte conversationnel maîtrisé (8 derniers messages)

Architecture conversationnelle
graph TD
    A[Utilisateur] --> B[Conversation A]
    A --> C[Conversation B]
    A --> D[Conversation C]
    
    B --> E[Message 1]
    B --> F[Message 2]
    B --> G[Message N]
    
    C --> H[Message 1]
    C --> I[Message 2]
    
    D --> J[Message 1]
    
    E --> K[LLM OpenRouter]
    F --> K
    G --> K
    
    K --> L[Réponse IA]
    L --> B
📊 Gestion des données
Modèle de données TinyDB
Utilisateurs
json
{
  "id": "usr_xxxxx",
  "email": "user@example.com",
  "password_hash": "bcrypt_hash",
  "role": "user",
  "created_at": "2026-02-05T10:12:00Z"
}
Conversations
json
{
  "id": "conv_xxxxx",
  "user_id": "usr_xxxxx",
  "title": "Discussion IA",
  "created_at": "2026-02-05T10:12:00Z",
  "updated_at": "2026-02-05T10:15:42Z"
}
Messages
json
{
  "id": "msg_xxxxx",
  "user_id": "usr_xxxxx",
  "conversation_id": "conv_xxxxx",
  "role": "user",
  "content": "Bonjour, comment ça va ?",
  "created_at": "2026-02-05T10:15:42Z"
}
🔄 API Endpoints
Authentification
text
POST   /auth/register     # Créer un compte
POST   /auth/login        # Connexion (retourne JWT)
GET    /auth/me           # Infos utilisateur (protégé)
Chat & IA
text
POST   /ai/chat           # Envoyer un message à l'IA
GET    /ai/models         # Liste des modèles disponibles
Conversations
text
GET    /conversations     # Liste des conversations
POST   /conversations     # Créer une conversation
DELETE /conversations/:id # Supprimer une conversation
Historique
text
GET    /history/:conversation_id  # Messages d'une conversation
DELETE /history/:conversation_id  # Supprimer l'historique d'une conversation
DELETE /history                  # Supprimer tout l'historique
Utilisateurs (Admin)
text
DELETE /users/me          # Supprimer son propre compte
DELETE /users/:id         # Supprimer un compte (admin seulement)
🎨 Design System
Palette de couleurs
css
--primary: #6366f1;      /* Bleu-violet principal */
--secondary: #8b5cf6;    /* Violet secondaire */
--success: #10b981;      /* Vert succès */
--danger: #ef4444;       /* Rouge erreur */
--warning: #f59e0b;      /* Orange avertissement */
--glass: rgba(255, 255, 255, 0.95); /* Fond glass */
Animations et transitions
Entrée/sortie : Slide, fade, scale animations

Chargement : Squelettes et spinners progressifs

Feedback : Hover effects et micro-interactions

Transitions : Smooth transitions entre états

Responsive Design
css
/* Mobile First */
sm: 640px   /* Mobile */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large Desktop */
⚡ Gestion d'état Frontend
Contextes React
AuthContext
javascript
{
  user: User | null,
  token: string | null,
  login: (email, password) => Promise,
  logout: () => void,
  register: (email, password) => Promise
}
ChatContext
javascript
{
  currentConversation: Conversation | null,
  messages: Message[],
  conversations: Conversation[],
  sendMessage: (content) => Promise,
  newConversation: () => void,
  switchConversation: (id) => void
}
HistoryContext
javascript
{
  history: Conversation[],
  stats: HistoryStats,
  loadHistory: () => Promise,
  clearHistory: () => Promise,
  deleteConversation: (id) => Promise
}
🔒 Sécurité avancée
Frontend
Validation côté client : Prévention des injections

Sanitization : Nettoyage des entrées utilisateur

CSP Headers : Protection contre XSS

Rate Limiting UI : Feedback visuel lors de nombreuses requêtes

Chiffrement localStorage : Données sensibles chiffrées

Backend
JWT avec expiration : Tokens valides 15 minutes

bcrypt : Hash fort des mots de passe

Isolation des données : Un utilisateur ne voit que ses données

Validation Pydantic : Validation stricte des entrées

Clé API sécurisée : Jamais exposée au client

🧪 Tests
Stratégie de test complète
bash
# Tests unitaires frontend
npm run test:unit

# Tests E2E
npm run test:e2e

# Performance (Lighthouse)
npm run test:performance

# Tests backend Python
pytest
Couverture de test
Frontend : Jest + Testing Library + Cypress

Backend : Pytest avec couverture complète

Performance : Lighthouse CI intégré

Sécurité : Tests de pénétration basiques

🚢 Déploiement
Build pour production
bash
# Frontend
npm run build

# Backend
uvicorn app.main:app --host 0.0.0.0 --port 8000
Variables d'environnement production
env
# Frontend
VITE_API_URL=https://api.assistantia.com
VITE_ENV=production

# Backend
JWT_SECRET=production_secret_strong
OPENROUTER_API_KEY=production_key
CHAT_MEMORY_MESSAGES=10
Intégration continue
yaml
# Exemple GitHub Actions
name: Deploy
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: npm run test
      - uses: peaceiris/actions-gh-pages@v3
📊 Monitoring & Analytics
Métriques collectées
Performance : FCP, LCP, CLS, FID

Usage : Nombre de messages, temps de session

Erreurs : Frontend/backend errors avec stack traces

Analytics : Événements utilisateur anonymisés

Outils intégrés
Sentry : Error tracking

Google Analytics : Analytics utilisateur

Hotjar : Heatmaps et enregistrements

LogRocket : Session replay

🛠️ Dépannage
Problèmes courants
1. Échec d'authentification
bash
# Vérifier que le backend est en cours d'exécution
# Vérifier les logs de la console
# Vider le localStorage et réessayer
2. Messages non envoyés
bash
# Vérifier la connexion Internet
# Vérifier que le token JWT n'a pas expiré
# Consulter les logs du réseau dans DevTools
3. Interface lente
bash
# Vider le cache du navigateur
# Vérifier les extensions de navigateur
# Réduire le nombre de conversations chargées
4. Backend ne démarre pas
bash
# Vérifier que Python 3.11+ est installé
# Vérifier que toutes les dépendances sont installées
# Vérifier que le fichier .env existe et est correct
Mode debug
javascript
// Activez le mode debug dans la console
localStorage.setItem('debug', 'true')
// Rechargez la page pour voir les logs détaillés
📝 Notes importantes
Pourquoi pas de route /logout côté backend ?
Les JWT sont stateless : le backend ne stocke pas les sessions

La déconnexion est gérée côté client en supprimant le token

Ceci est un choix architectural standard avec JWT

Gestion des rôles admin
Le rôle admin est attribué manuellement (édition de users.json)

Aucun endpoint public pour devenir admin

Garantit un contrôle total côté serveur

Isolation des données
Chaque utilisateur ne voit que ses propres conversations

Les messages sont strictement liés à un utilisateur et une conversation

Suppression en cascade automatique lors de la suppression d'un compte
