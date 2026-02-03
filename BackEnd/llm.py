import os
from typing import Any, Dict, List

import httpx


# Endpoint officiel OpenRouter (API "chat completions")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"


def _get_required_env(name: str) -> str:
    """
    Récupère une variable d'environnement obligatoire.
    Pourquoi ?
    - Si elle manque, on préfère échouer immédiatement avec un message clair
      plutôt que d'avoir une erreur obscure plus tard.
    """
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing environment variable: {name}")
    return value


async def call_openrouter(messages: List[Dict[str, str]]) -> str:
    """
    Appelle OpenRouter et retourne la réponse texte de l'assistant.

    messages: liste du format :
    [
      {"role": "system", "content": "..."},
      {"role": "user", "content": "..."}
    ]

    Pourquoi ce format ?
    - C'est le format "Chat Completions" utilisé par OpenAI et par OpenRouter.
    """
    api_key = _get_required_env("OPENROUTER_API_KEY")
    model = os.getenv("OPENROUTER_MODEL", "openrouter/auto")

    # Headers :
    # - Authorization est obligatoire : Bearer <clé>
    # - HTTP-Referer et X-Title sont recommandés par OpenRouter (attribution)
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": os.getenv("OPENROUTER_SITE_URL", "http://localhost"),
        "X-Title": os.getenv("OPENROUTER_APP_NAME", "AssistantIA"),
    }

    # Corps de la requête.
    # temperature : contrôle la créativité (0 = très factuel, 1 = plus créatif)
    payload: Dict[str, Any] = {
        "model": model,
        "messages": messages,
        "temperature": 0.7,
        "stream": False,
    }

    # On met un timeout pour éviter que le backend se bloque si le fournisseur est lent.
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(OPENROUTER_URL, headers=headers, json=payload)

    # Si OpenRouter renvoie une erreur, on remonte un message explicite.
    if resp.status_code != 200:
        # On évite d'afficher la clé ou trop de détails sensibles.
        raise RuntimeError(f"OpenRouter error: {resp.status_code} - {resp.text}")

    data = resp.json()

    # Le texte de réponse est dans choices[0].message.content
    return data["choices"][0]["message"]["content"]
