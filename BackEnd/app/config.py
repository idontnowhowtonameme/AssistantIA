import os
from dotenv import load_dotenv, find_dotenv

# -------------------------------------------------------------------
# Chargement des variables d'environnement
# -------------------------------------------------------------------
# find_dotenv() :
#   - cherche automatiquement un fichier .env en remontant les dossiers
#   - utile si tu lances uvicorn depuis un dossier différent
#
# load_dotenv() :
#   - charge les variables du fichier .env dans os.environ
#
# 👉 Résultat : os.getenv(...) fonctionnera partout dans le projet
load_dotenv(find_dotenv())

# -------------------------------------------------------------------
# Configuration JWT (authentification)
# -------------------------------------------------------------------

# Clé secrète utilisée pour signer les JWT
# ⚠️ OBLIGATOIRE : si absente, on bloque le démarrage du backend
JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET is missing in environment (.env)")

# Algorithme de signature JWT
# HS256 = HMAC + SHA-256 (classique et suffisant pour ce projet)
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

# Durée de validité du token JWT (en minutes)
# Converti en int car os.getenv retourne toujours une chaîne
JWT_EXPIRES_MINUTES = int(os.getenv("JWT_EXPIRES_MINUTES", "15"))

# -------------------------------------------------------------------
# Configuration OpenRouter (IA / LLM)
# -------------------------------------------------------------------

# Clé API OpenRouter
# ⚠️ Elle doit rester STRICTEMENT côté backend
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")

# Modèle utilisé par OpenRouter
# "openrouter/auto" laisse OpenRouter choisir un modèle gratuit/dispo
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "openrouter/auto")

# URL du site frontend (informationnelle pour OpenRouter)
OPENROUTER_SITE_URL = os.getenv("OPENROUTER_SITE_URL", "http://localhost:3000")

# Nom de l'application envoyé à OpenRouter
OPENROUTER_APP_NAME = os.getenv("OPENROUTER_APP_NAME", "AssistantIA")
