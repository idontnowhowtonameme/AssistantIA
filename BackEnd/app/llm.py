from typing import Any, Dict, List
import logging

import httpx
from fastapi import HTTPException, status

from app import config

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# Logger standard Python : permet d'avoir du détail côté terminal/serveur
# sans exposer les infos au frontend.
logger = logging.getLogger(__name__)


async def call_openrouter(messages: List[Dict[str, str]]) -> str:
    """
    Appelle OpenRouter (chat completions) et renvoie le texte de l'assistant.
    """
    if not config.OPENROUTER_API_KEY:
        # Erreur claire si la clé est absente
        # 503 est plus adapté que 500 : service externe non configuré.
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="LLM service is not configured (missing OPENROUTER_API_KEY).",
        )

    headers = {
        "Authorization": f"Bearer {config.OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        # Attribution (optionnel mais propre)
        "HTTP-Referer": config.OPENROUTER_SITE_URL,
        "X-Title": config.OPENROUTER_APP_NAME,
    }

    payload: Dict[str, Any] = {
        "model": config.OPENROUTER_MODEL,
        "messages": messages,
        "temperature": 0.7,
        "stream": False,
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(OPENROUTER_URL, headers=headers, json=payload)

    except httpx.TimeoutException:
        # Problème réseau (timeout) : OpenRouter ne répond pas à temps
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="LLM provider timed out.",
        )

    except httpx.RequestError as e:
        # Problème réseau (DNS, connexion refusée, etc.)
        logger.exception("LLM provider unreachable: %s", e)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="LLM provider unreachable.",
        )

    if resp.status_code != 200:
        # On ne renvoie pas resp.text au client (ça peut contenir des infos techniques)
        # MAIS on le log côté serveur pour debug.
        logger.error("OpenRouter error %s: %s", resp.status_code, resp.text)

        # 502 = notre backend marche, mais le fournisseur externe renvoie une erreur.
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="LLM provider returned an error.",
        )

    # Si OpenRouter renvoie un 200 mais un body non-JSON, resp.json() peut planter
    try:
        data = resp.json()
    except ValueError:
        logger.error("OpenRouter returned non-JSON: %s", resp.text)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="LLM provider returned an invalid response format.",
        )

    try:
        return data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError):
        # Format inattendu : on log la structure pour debug
        logger.error("Unexpected LLM response structure: %s", data)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="LLM response format unexpected.",
        )
