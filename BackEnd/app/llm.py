# BackEnd/app/llm.py
from typing import Any, Dict, List

import httpx
from fastapi import HTTPException

from app import config

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"


async def call_openrouter(messages: List[Dict[str, str]]) -> str:
    """
    Appelle OpenRouter (chat completions) et renvoie le texte de l'assistant.

    On centralise ici :
    - la clé API (serveur uniquement)
    - la configuration modèle
    - la gestion d'erreurs réseau / fournisseur
    """
    if not config.OPENROUTER_API_KEY:
        # 500 = erreur de configuration serveur
        raise HTTPException(status_code=500, detail="OPENROUTER_API_KEY missing")

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

    # Timeout :
    # - connect: temps max pour établir la connexion
    # - read: temps max pour recevoir la réponse
    timeout = httpx.Timeout(connect=10.0, read=30.0, write=30.0, pool=30.0)

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.post(OPENROUTER_URL, headers=headers, json=payload)
    except httpx.RequestError:
        # Problème réseau / DNS / firewall / offline
        raise HTTPException(status_code=502, detail="LLM provider unreachable")

    # Erreurs OpenRouter : 401/403/429/500...
    if resp.status_code != 200:
        # 502 : backend agit comme "gateway" vers un fournisseur externe
        raise HTTPException(status_code=502, detail=f"OpenRouter error: {resp.status_code} - {resp.text}")

    data = resp.json()

    # Parsing robuste
    try:
        content = data["choices"][0]["message"]["content"]
        if not isinstance(content, str) or not content.strip():
            raise KeyError("empty content")
        return content
    except (KeyError, IndexError, TypeError):
        raise HTTPException(status_code=502, detail="LLM response format unexpected")
