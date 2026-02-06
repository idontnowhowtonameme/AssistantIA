import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from app.database import dbconversations, dbhistorique, ConvQ, HistQ
from app.dependencies import get_current_user
from app.schemas import ConversationCreateIn, ConversationUpdateIn, ConversationOut, ConversationListOut

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
    """
    items = dbconversations.search(ConvQ.user_id == user["id"])
    items.sort(key=lambda x: x.get("updated_at", ""), reverse=True)
    return {"items": items}


@router.patch("/{conversation_id}", response_model=ConversationOut)
def rename_conversation(conversation_id: str, payload: ConversationUpdateIn, user=Depends(get_current_user)):
    """
    Renomme une conversation (si elle appartient à l'utilisateur).
    """
    conv = dbconversations.get((ConvQ.id == conversation_id) & (ConvQ.user_id == user["id"]))
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    new_title = (payload.title or "").strip()
    if not new_title:
        raise HTTPException(status_code=422, detail="Title cannot be empty")

    now = datetime.now(timezone.utc).isoformat()

    dbconversations.update(
        {"title": new_title, "updated_at": now},
        (ConvQ.id == conversation_id) & (ConvQ.user_id == user["id"]),
    )

    conv["title"] = new_title
    conv["updated_at"] = now
    return conv


@router.delete("/{conversation_id}")
def delete_conversation(conversation_id: str, user=Depends(get_current_user)):
    """
    Supprime une conversation (si elle appartient à l'utilisateur),
    + supprime tous les messages associés.
    """
    conv = dbconversations.get((ConvQ.id == conversation_id) & (ConvQ.user_id == user["id"]))
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # 1) supprimer les messages liés
    removed_msgs = dbhistorique.remove((HistQ.user_id == user["id"]) & (HistQ.conversation_id == conversation_id))

    # 2) supprimer la conversation
    dbconversations.remove((ConvQ.id == conversation_id) & (ConvQ.user_id == user["id"]))

    return {"deleted_messages": len(removed_msgs), "deleted_conversation": True}
