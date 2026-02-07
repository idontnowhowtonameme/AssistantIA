from fastapi import APIRouter, Depends, HTTPException

from app.database import dbhistorique, dbconversations, HistQ, ConvQ
from app.dependencies import get_current_user
from app.schemas import HistoryOut, DeleteOut

router = APIRouter()


@router.get("/{conversation_id}", response_model=HistoryOut)
def get_conversation_history(
    conversation_id: str,
    limit: int = 50,
    offset: int = 0,
    user=Depends(get_current_user),
):
    if limit < 1:
        limit = 1
    if limit > 200:
        limit = 200
    if offset < 0:
        offset = 0

    user_id = user["id"]
    is_admin = user.get("role") == "admin"

    conv = dbconversations.get(ConvQ.id == conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if (not is_admin) and conv.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    all_items = dbhistorique.search(HistQ.conversation_id == conversation_id)
    all_items.sort(key=lambda x: x.get("created_at", ""))  # chrono

    items = all_items[offset : offset + limit]
    return {"items": items, "limit": limit, "offset": offset}


@router.delete("/{conversation_id}", response_model=DeleteOut)
def delete_conversation_history(conversation_id: str, user=Depends(get_current_user)):
    user_id = user["id"]
    is_admin = user.get("role") == "admin"

    conv = dbconversations.get(ConvQ.id == conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if (not is_admin) and conv.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    removed = dbhistorique.remove(HistQ.conversation_id == conversation_id)
    return {"deleted": len(removed)}


@router.delete("", response_model=DeleteOut)
def clear_all_history(user=Depends(get_current_user)):
    user_id = user["id"]
    removed_msgs = dbhistorique.remove(HistQ.user_id == user_id)
    removed_convs = dbconversations.remove(ConvQ.user_id == user_id)

    return {"deleted": len(removed_msgs) + len(removed_convs)}
