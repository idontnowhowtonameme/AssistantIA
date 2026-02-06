# BackEnd/app/routers/ai.py
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import get_current_user
from app.database import dbhistorique, dbconversations, HistQ, ConvQ
from app.llm import call_openrouter
from app.schemas import ChatIn, ChatOut
from app import config

router = APIRouter()


@router.post("/chat", response_model=ChatOut)
async def ai_chat(payload: ChatIn, user=Depends(get_current_user)):
    """
    Endpoint protégé :
    - nécessite un JWT valide
    - prend un message + (optionnel) conversation_id
    - appelle OpenRouter
    - stocke question + réponse dans l'historique AVEC conversation_id
    """
    user_id = user["id"]
    now_iso = datetime.now(timezone.utc).isoformat()

    # 1) conversation_id : si absent => créer conversation
    conversation_id = payload.conversation_id

    if conversation_id:
        conv = dbconversations.get((ConvQ.id == conversation_id) & (ConvQ.user_id == user_id))
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        # Création auto d'un thread
        conversation_id = f"conv_{uuid.uuid4().hex}"
        conv_doc = {
            "id": conversation_id,
            "user_id": user_id,
            "title": "Nouvelle conversation",
            "created_at": now_iso,
            "updated_at": now_iso,
        }
        dbconversations.insert(conv_doc)

    # 2) Sauvegarder le message user (lié à conversation_id)
    dbhistorique.insert({
        "id": f"msg_{uuid.uuid4().hex}",
        "user_id": user_id,
        "conversation_id": conversation_id,
        "role": "user",
        "content": payload.message,
        "created_at": now_iso,
    })

    # 3) Construire le contexte LLM : derniers N messages de CETTE conversation
    history = dbhistorique.search((HistQ.user_id == user_id) & (HistQ.conversation_id == conversation_id))
    history.sort(key=lambda x: x.get("created_at", ""))

    # N derniers messages (par défaut 8 via config)
    n = getattr(config, "CHAT_MEMORY_MESSAGES", 8)
    last = history[-n:] if n > 0 else []

    messages = [{"role": "system", "content": "Tu es un assistant utile et concis."}]
    for item in last:
        messages.append({
            "role": item.get("role", "user"),
            "content": item.get("content", ""),
        })

    # 4) Appeler l'IA
    try:
        answer = await call_openrouter(messages)
    except HTTPException:
        # On relaie proprement l'erreur HTTPException (502, 500...)
        raise
    except Exception:
        # Fallback si une erreur inattendue arrive
        raise HTTPException(status_code=502, detail="LLM call failed unexpectedly")

    # 5) Sauvegarder la réponse assistant
    dbhistorique.insert({
        "id": f"msg_{uuid.uuid4().hex}",
        "user_id": user_id,
        "conversation_id": conversation_id,
        "role": "assistant",
        "content": answer,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    # 6) Toucher updated_at de la conversation
    dbconversations.update(
        {"updated_at": datetime.now(timezone.utc).isoformat()},
        (ConvQ.id == conversation_id) & (ConvQ.user_id == user_id)
    )

    return {"answer": answer, "conversation_id": conversation_id}
