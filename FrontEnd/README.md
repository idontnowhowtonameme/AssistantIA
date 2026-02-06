AssistantIA - Frontend
Vue d'ensemble

Frontend React moderne pour l'application AssistantIA, offrant une interface utilisateur premium avec authentification JWT, gestion multi-conversationnelle et interactions en temps réel avec l'IA.

Technologies utilisées

React 18 avec Vite pour un développement rapide

React Router DOM v6 pour la navigation

Axios pour les requêtes HTTP

Context API pour la gestion d'état globale

CSS Modules avec animations modernes

JWT Decode pour la gestion des tokens

Glassmorphism pour l'interface

Architecture du projet
FrontEnd/
├── public/
│   ├── index.html
│   └── assets/
│
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── Chat/
│   │   │   ├── ChatContainer.jsx
│   │   │   ├── MessageBubble.jsx
│   │   │   ├── ChatInput.jsx
│   │   │   └── ChatHeader.jsx
│   │   ├── History/
│   │   │   ├── HistoryPanel.jsx
│   │   │   ├── HistoryItem.jsx
│   │   │   └── HistoryStats.jsx
│   │   ├── Modals/
│   │   │   ├── ConfirmModal.jsx
│   │   │   └── LoadingModal.jsx
│   │   └── UI/
│   │       ├── GlassCard.jsx
│   │       └── AnimatedButton.jsx
│   │
│   ├── contexts/
│   │   ├── AuthContext.jsx
│   │   ├── ChatContext.jsx
│   │   └── HistoryContext.jsx
│   │
│   ├── services/
│   │   ├── api.js
│   │   ├── auth.js
│   │   ├── chat.js
│   │   └── history.js
│   │
│   ├── utils/
│   │   ├── validators.js
│   │   ├── formatters.js
│   │   └── storage.js
│   │
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useChat.js
│   │   └── useHistory.js
│   │
│   ├── styles/
│   │   ├── App.css
│   │   └── animations.css
│   │
│   ├── App.jsx
│   ├── main.jsx
│   └── routes.jsx
│
├── .env
├── .gitignore
├── package.json
├── vite.config.js
└── README.md

Installation rapide
1. Prérequis

Node.js 18+ et npm/yarn
Backend AssistantIA en cours d'exécution (http://localhost:8000
)

2. Installation
# Clonez le projet
git clone https://github.com/idontnowhowtonameme/AssistantIA
cd AssistantIA/FrontEnd

# Installez les dépendances
npm install
# ou
yarn install

3. Configuration

Créez un fichier .env à la racine du dossier FrontEnd :

VITE_API_URL=http://localhost:8000
VITE_APP_NAME=AssistantIA
VITE_APP_VERSION=1.0.0

4. Lancement du serveur de développement
# Mode développement
npm run dev
# ou
yarn dev


L'application sera disponible sur http://localhost:5173

5. Build pour production
# Build pour production
npm run build
# ou
yarn build

# Preview du build
npm run preview
# ou
yarn preview

Architecture d'authentification
Flux JWT

Connexion : L'utilisateur se connecte via /auth/login
Token : Le backend retourne un token JWT valide 15 minutes
Stockage : Le token est stocké dans localStorage
Requêtes : Axios intercepte automatiquement les requêtes pour ajouter le header Authorization
Rafraîchissement : L'utilisateur doit se reconnecter après expiration du token

Sécurité côté client

Stockage sécurisé : JWT stocké avec vérification d'intégrité
Auto-déconnexion : Suppression automatique du token expiré
Protection des routes : Navigation conditionnelle basée sur l'authentification
CSRF Protection : Headers sécurisés sur toutes les requêtes

Système de chat
Caractéristiques principales

Messages en temps réel : Interface fluide avec animations
Multi-conversations : Gestion de plusieurs threads simultanés
Historique intelligent : Récupération contextuelle des conversations
Interface responsive : Optimisé pour mobile et desktop
Markdown supporté : Messages formatés avec mise en forme

Composants du chat
1. ChatContainer

Gestion de l'état global de la conversation
Orchestration des messages et de l'historique
Communication avec le backend via WebSocket-like polling

2. MessageBubble

Affichage des messages utilisateur/assistant
Animations d'entrée/sortie
Formatage du markdown
Indicateurs de statut (envoi, reçu, lu)

3. ChatInput

Zone de texte intelligente avec auto-extension
Suggestions contextuelles
Formatage markdown en direct
Envoi avec Enter/Ctrl+Enter

4. ChatHeader

Informations de la conversation
Boutons d'actions (historique, déconnexion)
Indicateur de connexion

Gestion des conversations
Création de conversation

Manuelle : Utilisateur clique sur "Nouvelle conversation"
Automatique : Créée au premier message sans conversation active
Import/Export : Possibilité d'exporter une conversation en JSON

Organisation

Titrage automatique : Basé sur le premier message
Tri intelligent : Par date de modification
Recherche : Filtrage en temps réel dans l'historique
Catégories : Tags et favoris

Historique Panel

Interface premium : Design glassmorphism avec animations
Statistiques : Nombre de messages, durée, activité
Recherche avancée : Filtrage par date, contenu, tags
Actions rapides : Épingler, archiver, supprimer
Synchronisation : Mise à jour en temps réel

Design System
Principes de design

Glassmorphism : Effets de transparence et flou
Micro-interactions : Animations subtiles pour le feedback
Responsive First : Mobile-first avec breakpoints adaptatifs
Accessibilité : Support WCAG 2.1 AA

Palette de couleurs
--primary: #6366f1;
--secondary: #8b5cf6;
--success: #10b981;
--danger: #ef4444;
--warning: #f59e0b;
--glass: rgba(255, 255, 255, 0.95);

Animations

Entrée/sortie : Slide, fade, scale
Chargement : Squelettes, spinners progressifs
Transitions : Smooth transitions entre états
Feedback : Hover effects, pulsations

Services API
Configuration Axios
// Intercepteurs pour JWT et erreurs
api.interceptors.request.use()    // Ajout du token
api.interceptors.response.use()   // Gestion des erreurs

Endpoints consommés
// Authentication
POST   /auth/register
POST   /auth/login
GET    /auth/me

// Chat & AI
POST   /ai/chat
GET    /ai/models

// Conversations
GET    /conversations
POST   /conversations
DELETE /conversations/:id

// History
GET    /history/:conversation_id
DELETE /history/:conversation_id
DELETE /history

// Users
DELETE /users/me
DELETE /users/:id   (admin only)

Gestion des erreurs

Feedback utilisateur : Messages d'erreur contextualisés
Reconnexion automatique : Tentative de reconnexion sur erreur réseau
Fallback UI : États d'erreur élégants
Logging : Journalisation des erreurs côté client

Responsive Design
Breakpoints
/* Mobile First */
sm: 640px
md: 768px
lg: 1024px
xl: 1280px

Optimisations mobiles

Touch-friendly : Cibles tactiles de 44px minimum
Performance : Lazy loading des images
PWA Ready : Manifest et service worker
Orientation : Support portrait/paysage

Sécurité frontend
Bonnes pratiques implémentées

Validation côté client : Prévention des injections
Sanitization : Nettoyage des entrées utilisateur
CSP Headers : Protection contre XSS
HTTP Only Cookies : Configuration recommandée
Rate Limiting UI : Feedback lors de trop nombreuses requêtes

Protection des données

Chiffrement localStorage : Données sensibles chiffrées
Clear on Logout : Nettoyage complet au logout
Session Timeout : Déconnexion automatique après inactivité

Workflows
Flux d'authentification
graph LR
    A[Login Page] --> B{Valid Credentials?}
    B -->|Yes| C[Get JWT Token]
    B -->|No| A
    C --> D[Store Token]
    D --> E[Redirect to Chat]
    E --> F[Protected Routes]
    F --> G[Auto-append Authorization Header]

Flux de conversation
graph LR
    A[User Input] --> B[Validate Input]
    B --> C[Send to Backend]
    C --> D[Receive AI Response]
    D --> E[Update Local State]
    E --> F[Update Conversation History]
    F --> G[Update UI]

Gestion d'état
Contextes React
AuthContext
{
  user: User | null,
  token: string | null,
  login: (email, password) => Promise,
  logout: () => void,
  register: (email, password) => Promise
}

ChatContext
{
  currentConversation: Conversation | null,
  messages: Message[],
  conversations: Conversation[],
  sendMessage: (content) => Promise,
  newConversation: () => void,
  switchConversation: (id) => void
}

HistoryContext
{
  history: Conversation[],
  stats: HistoryStats,
  loadHistory: () => Promise,
  clearHistory: () => Promise,
  deleteConversation: (id) => Promise
}

Tests
Stratégie de test

Unitaires : Composants individuels avec Jest + Testing Library
Intégration : Flux utilisateur avec Cypress
E2E : Scénarios complets avec Playwright
Performance : Lighthouse CI pour les métriques Core Web Vitals

Commandes de test
# Tests unitaires
npm run test:unit

# Tests E2E
npm run test:e2e

# Performance
npm run test:performance

# Tous les tests
npm run test

Déploiement
Build optimisé
# Production build avec optimisations
npm run build:prod

# Analyse du bundle
npm run analyze

Variables d'environnement
VITE_API_URL=https://api.assistantia.com
VITE_ENV=production
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
VITE_GA_ID=UA-XXXXX-Y

Intégration continue
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

Monitoring & Analytics
Métriques collectées

Performance : FCP, LCP, CLS, FID
Usage : Nombre de messages, temps de session
Erreurs : Frontend errors avec stack traces
Analytics : Événements utilisateur anonymisés

Outils intégrés

Sentry : Error tracking
Google Analytics : Analytics
Hotjar : Heatmaps
LogRocket : Session replay

Dépannage
Problèmes courants
1. Échec d'authentification
# Vérifiez que le backend est en cours d'exécution
# Vérifiez les logs de la console
# Videz le localStorage et réessayez

2. Messages non envoyés
# Vérifiez la connexion Internet
# Vérifiez que le token JWT n'a pas expiré
# Consultez les logs du réseau dans DevTools

3. Interface lente
# Videz le cache du navigateur
# Vérifiez les extensions de navigateur
# Réduisez le nombre de conversations chargées

Debug mode
// Activez le mode debug dans la console
localStorage.setItem('debug', 'true')
// Rechargez la page pour voir les logs détaillés

Documentation supplémentaire
Composants personnalisés

Chaque composant dispose d'une documentation Props et d'exemples d'utilisation dans le dossier docs/components/.

Hooks personnalisés

Les hooks réutilisables sont documentés avec des exemples dans docs/hooks/.

Contribution

Voir CONTRIBUTING.md pour les guidelines de contribution.

Contribution

Forkez le projet
Créez une branche (git checkout -b feature/AmazingFeature)
Committez vos changements (git commit -m 'Add some AmazingFeature')
Pushez (git push origin feature/AmazingFeature)
Ouvrez une Pull Request

Licence

Ce projet est sous licence MIT - voir le fichier LICENSE pour plus de détails.

Remerciements

FastAPI pour le backend
OpenRouter pour les modèles IA
React pour la bibliothèque frontend
Vite pour l'outillage de développement
