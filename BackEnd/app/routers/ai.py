import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from app.database import dbhistorique, HistQ
from app.dependencies import get_current_user
from app.llm import call_openrouter
from app.schemas import ChatIn, ChatOut


router = APIRouter()

@router.post("/chat", response_model=ChatOut)
async def ai_chat(payload: ChatIn, user=Depends(get_current_user)):
    """
    Chat IA protégé :
    - enregistre le message user
    - appelle OpenRouter
    - enregistre la réponse assistant
    - renvoie la réponse
    """
    user_id = user["id"]
    now_iso = datetime.now(timezone.utc).isoformat()

    # 1) Sauvegarde message user
    dbhistorique.insert({
        "id": f"msg_{uuid.uuid4().hex}",
        "user_id": user_id,
        "role": "user",
        "content": payload.message,
        "created_at": now_iso,
    })

    # (Option pro) Contexte minimal : derniers messages (ex: 8 derniers)
    # Pourquoi ?
    # - sinon l'IA n'a aucune mémoire de la conversation
    # - limiter évite d'envoyer trop de texte (coût/latence)
    history = dbhistorique.search(HistQ.user_id == user_id)
    history.sort(key=lambda x: x.get("created_at", ""))

    last = history[-8:]  # 8 derniers messages
    messages = [{"role": "system", "content": "Tu es un assistant utile et concis."}]
    for item in last:
        # On ne garde que role/content pour l'API LLM
        messages.append({"role": item.get("role", "user"), "content": item.get("content", "")})

    # 2) Appel LLM
    answer = await call_openrouter(messages)

    # 3) Sauvegarde réponse assistant
    dbhistorique.insert({
        "id": f"msg_{uuid.uuid4().hex}",
        "user_id": user_id,
        "role": "assistant",
        "content": answer,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    return {"answer": answer}
