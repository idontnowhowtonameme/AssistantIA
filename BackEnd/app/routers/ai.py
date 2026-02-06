# backend/app/routers/ai.py
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import get_current_user
from app.database import dbhistorique, dbconversations, HistQ, ConvQ
from app.llm import call_openrouter
from app.schemas import ChatIn, ChatOut
from app import config

router = APIRouter()

SYSTEM_PROMPT = "Tu es un assistant utile et concis."


@router.post("/chat", response_model=ChatOut)
async def ai_chat(payload: ChatIn, user=Depends(get_current_user)):
    user_id = user["id"]
    is_admin = user.get("role") == "admin"
    now_iso = datetime.now(timezone.utc).isoformat()

    # 1) conversation_id : si absent => créer conversation
    conversation_id = payload.conversation_id

    if conversation_id:
        conv = dbconversations.get(ConvQ.id == conversation_id)
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")

        if (not is_admin) and conv.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Forbidden")
    else:
        conversation_id = f"conv_{uuid.uuid4().hex}"
        dbconversations.insert(
            {
                "id": conversation_id,
                "user_id": user_id,
                "title": "Nouvelle conversation",
                "created_at": now_iso,
                "updated_at": now_iso,
            }
        )

    # 2) Sauvegarder le message user
    dbhistorique.insert(
        {
            "id": f"msg_{uuid.uuid4().hex}",
            "user_id": user_id,
            "conversation_id": conversation_id,
            "role": "user",
            "content": payload.message,
            "created_at": now_iso,
        }
    )

    # 3) Construire le contexte : derniers N messages de CETTE conversation
    history = dbhistorique.search(HistQ.conversation_id == conversation_id)
    history.sort(key=lambda x: x.get("created_at", ""))

    n = getattr(config, "CHAT_MEMORY_MESSAGES", 8)
    last = history[-n:] if isinstance(n, int) and n > 0 else []

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages.extend(
        {"role": item.get("role", "user"), "content": item.get("content", "")} for item in last
    )

    # 4) Appeler l'IA
    try:
        answer = await call_openrouter(messages)
    except HTTPException:
        raise
    except Exception as e:
        # Optionnel : log minimal
        raise HTTPException(status_code=502, detail=f"LLM call failed: {type(e).__name__}")

    # 5) Sauvegarder la réponse assistant
    dbhistorique.insert(
        {
            "id": f"msg_{uuid.uuid4().hex}",
            "user_id": user_id,
            "conversation_id": conversation_id,
            "role": "assistant",
            "content": answer,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    )

    # 6) updated_at
    dbconversations.update(
        {"updated_at": datetime.now(timezone.utc).isoformat()},
        ConvQ.id == conversation_id,
    )

    # 7) IMPORTANT : retour garanti conforme à ChatOut
    return {"answer": answer, "conversation_id": conversation_id}
