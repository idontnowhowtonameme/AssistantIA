import os
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET is missing in environment (.env)")

JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

JWT_EXPIRES_MINUTES = int(os.getenv("JWT_EXPIRES_MINUTES", "15"))

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "openrouter/auto")

OPENROUTER_SITE_URL = os.getenv("OPENROUTER_SITE_URL", "http://localhost:3000")
OPENROUTER_APP_NAME = os.getenv("OPENROUTER_APP_NAME", "AssistantIA")

CHAT_MEMORY_MESSAGES = int(os.getenv("CHAT_MEMORY_MESSAGES", "8"))
