# BackEnd/app/routers/history.py
from datetime import datetime, timezone
import uuid

from fastapi import APIRouter, Depends, HTTPException

from app.database import dbhistorique, dbconversations, HistQ, ConvQ
from app.dependencies import get_current_user
from app.schemas import (
    ConversationCreateIn,
    ConversationListOut,
    ConversationOut,
    HistoryOut,
    DeleteOut,
)

router = APIRouter()


@router.get("/conversations", response_model=ConversationListOut)
def list_conversations(user=Depends(get_current_user)):
    """
    Liste les conversations de l'utilisateur connecté.
    """
    user_id = user["id"]
    items = dbconversations.search(ConvQ.user_id == user_id)

    # Plus récentes en premier (updated_at)
    items.sort(key=lambda x: x.get("updated_at", ""), reverse=True)

    return {"items": items}


@router.post("/conversations", response_model=ConversationOut, status_code=201)
def create_conversation(payload: ConversationCreateIn, user=Depends(get_current_user)):
    """
    Crée une nouvelle conversation (thread).
    Le frontend peut ensuite envoyer conversation_id à /ai/chat.
    """
    user_id = user["id"]
    now = datetime.now(timezone.utc).isoformat()

    conv_id = f"conv_{uuid.uuid4().hex}"
    title = payload.title.strip() if payload.title else "Nouvelle conversation"

    doc = {
        "id": conv_id,
        "user_id": user_id,
        "title": title,
        "created_at": now,
        "updated_at": now,
    }
    dbconversations.insert(doc)
    return doc


@router.get("/{conversation_id}", response_model=HistoryOut)
def get_conversation_history(conversation_id: str, limit: int = 50, offset: int = 0, user=Depends(get_current_user)):
    """
    Récupère l'historique d'une conversation précise.
    """
    if limit < 1:
        limit = 1
    if limit > 200:
        limit = 200
    if offset < 0:
        offset = 0

    user_id = user["id"]

    # Vérifie que la conversation appartient au user
    conv = dbconversations.get((ConvQ.id == conversation_id) & (ConvQ.user_id == user_id))
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    all_items = dbhistorique.search((HistQ.user_id == user_id) & (HistQ.conversation_id == conversation_id))
    all_items.sort(key=lambda x: x.get("created_at", ""))  # chrono

    items = all_items[offset : offset + limit]
    return {"items": items, "limit": limit, "offset": offset}


@router.delete("/{conversation_id}", response_model=DeleteOut)
def delete_conversation(conversation_id: str, user=Depends(get_current_user)):
    """
    Supprime une conversation ET tous ses messages.
    """
    user_id = user["id"]

    conv = dbconversations.get((ConvQ.id == conversation_id) & (ConvQ.user_id == user_id))
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # 1) supprimer messages liés
    removed_msgs = dbhistorique.remove((HistQ.user_id == user_id) & (HistQ.conversation_id == conversation_id))

    # 2) supprimer conversation
    removed_conv = dbconversations.remove((ConvQ.id == conversation_id) & (ConvQ.user_id == user_id))

    return {"deleted": len(removed_msgs) + len(removed_conv)}


@router.delete("", response_model=DeleteOut)
def clear_all_history(user=Depends(get_current_user)):
    """
    Supprime TOUT :
    - toutes les conversations de l'utilisateur
    - tous les messages associés
    """
    user_id = user["id"]
    removed_msgs = dbhistorique.remove(HistQ.user_id == user_id)
    removed_convs = dbconversations.remove(ConvQ.user_id == user_id)
    return {"deleted": len(removed_msgs) + len(removed_convs)}
