# BackEnd/app/routers/users.py
from fastapi import APIRouter, Depends, HTTPException

from app.database import dbuser, dbhistorique, dbconversations, UserQ, HistQ, ConvQ
from app.dependencies import get_current_user, require_admin

router = APIRouter()


@router.delete("/me")
def delete_my_account(user=Depends(get_current_user)):
    """
    Supprime SON compte (tout utilisateur).
    - JWT requis
    - supprime aussi :
      - toutes ses conversations
      - tous ses messages
    """
    user_id = user["id"]

    # 1) Supprimer les messages
    removed_hist = dbhistorique.remove(HistQ.user_id == user_id)

    # 2) Supprimer les conversations
    removed_convs = dbconversations.remove(ConvQ.user_id == user_id)

    # 3) Supprimer l'utilisateur
    removed_user = dbuser.remove(UserQ.id == user_id)

    if not removed_user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "deleted_user": len(removed_user),
        "deleted_conversations": len(removed_convs),
        "deleted_messages": len(removed_hist),
        "user_id": user_id,
    }


@router.delete("/{user_id}")
def admin_delete_user(user_id: str, admin=Depends(require_admin)):
    """
    Supprime un utilisateur (ADMIN uniquement).
    - supprime aussi :
      - toutes ses conversations
      - tous ses messages
    """
    target = dbuser.get(UserQ.id == user_id)
    if not target:
        raise HTTPException(status_code=404, detail="Target user not found")

    removed_hist = dbhistorique.remove(HistQ.user_id == user_id)
    removed_convs = dbconversations.remove(ConvQ.user_id == user_id)
    removed_user = dbuser.remove(UserQ.id == user_id)

    return {
        "deleted_user": len(removed_user),
        "deleted_conversations": len(removed_convs),
        "deleted_messages": len(removed_hist),
        "user_id": user_id,
    }
