# BackEnd/app/config.py
import os
from dotenv import load_dotenv, find_dotenv

# Charge automatiquement le bon .env quel que soit le dossier courant.
# Exemple : si tu lances Uvicorn depuis BackEnd/ ou depuis la racine du repo.
load_dotenv(find_dotenv())

# ---------- JWT ----------
# JWT_SECRET :
# - clé de signature du token
# - doit rester côté serveur (jamais commit)
JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    # On crash volontairement au démarrage si absent :
    # mieux qu'un backend qui tourne mais signe/valide mal les tokens.
    raise RuntimeError("JWT_SECRET is missing in environment (.env)")

# Algo de signature (HS256 = HMAC-SHA256)
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

# Durée de validité du token (en minutes)
# Exemple : 15 => le client devra se reconnecter après ~15 minutes (ou gérer refresh token si tu en ajoutes plus tard)
JWT_EXPIRES_MINUTES = int(os.getenv("JWT_EXPIRES_MINUTES", "15"))

# ---------- OpenRouter ----------
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "openrouter/auto")

# Headers d'attribution (optionnels mais propres)
OPENROUTER_SITE_URL = os.getenv("OPENROUTER_SITE_URL", "http://localhost:3000")
OPENROUTER_APP_NAME = os.getenv("OPENROUTER_APP_NAME", "AssistantIA")

# ---------- Chat memory ----------
# Nombre de messages d'historique envoyés au LLM POUR LA CONVERSATION COURANTE.
CHAT_MEMORY_MESSAGES = int(os.getenv("CHAT_MEMORY_MESSAGES", "8"))
