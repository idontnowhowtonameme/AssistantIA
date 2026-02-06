# BackEnd/app/routers/conversations.py
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from app.database import dbconversations, dbhistorique, ConvQ, HistQ
from app.dependencies import get_current_user
from app.schemas import ConversationCreateIn, ConversationOut, ConversationListOut

router = APIRouter()


@router.post("", response_model=ConversationOut, status_code=201)
def create_conversation(payload: ConversationCreateIn, user=Depends(get_current_user)):
    """
    Crée une conversation pour l'utilisateur courant.
    - title optionnel : sinon on met un titre par défaut.
    """
    now = datetime.now(timezone.utc).isoformat()
    conv_id = f"conv_{uuid.uuid4().hex}"

    title = (payload.title or "Nouvelle conversation").strip()
    if not title:
        title = "Nouvelle conversation"

    doc = {
        "id": conv_id,
        "user_id": user["id"],
        "title": title,
        "created_at": now,
        "updated_at": now,
    }
    dbconversations.insert(doc)
    return doc


@router.get("", response_model=ConversationListOut)
def list_conversations(user=Depends(get_current_user)):
    """
    Liste les conversations de l'utilisateur (triées par updated_at DESC).
    (L'admin, lui, verra seulement les siennes ici — c'est un choix.
     Si tu veux "admin voit tout", on peut ajouter un query param.)
    """
    items = dbconversations.search(ConvQ.user_id == user["id"])
    items.sort(key=lambda x: x.get("updated_at", ""), reverse=True)
    return {"items": items}


@router.delete("/{conversation_id}")
def delete_conversation(conversation_id: str, user=Depends(get_current_user)):
    """
    Supprime une conversation :
    - owner OU admin
    + supprime tous les messages associés.
    """
    is_admin = user.get("role") == "admin"

    conv = dbconversations.get(ConvQ.id == conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if (not is_admin) and conv.get("user_id") != user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")

    # 1) supprimer les messages liés
    removed_msgs = dbhistorique.remove(HistQ.conversation_id == conversation_id)

    # 2) supprimer la conversation
    removed_conv = dbconversations.remove(ConvQ.id == conversation_id)

    return {
        "deleted_messages": len(removed_msgs),
        "deleted_conversation": len(removed_conv) > 0,
    }
