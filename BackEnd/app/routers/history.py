from fastapi import APIRouter, Depends

from app.database import dbhistorique, HistQ
from app.dependencies import get_current_user
from app.schemas import HistoryOut, DeleteOut


router = APIRouter()

@router.get("", response_model=HistoryOut)
def history(limit: int = 50, offset: int = 0, user=Depends(get_current_user)):
    """
    Retourne l'historique de l'utilisateur courant.

    Garde-fous :
    - limit min 1 / max 200
    - offset min 0
    """
    if limit < 1:
        limit = 1
    if limit > 200:
        limit = 200
    if offset < 0:
        offset = 0

    user_id = user["id"]
    all_items = dbhistorique.search(HistQ.user_id == user_id)

    # created_at en ISO => tri lexical OK si format complet
    all_items.sort(key=lambda x: x.get("created_at", ""))

    items = all_items[offset : offset + limit]
    return {"items": items, "limit": limit, "offset": offset}


@router.delete("", response_model=DeleteOut)
def clear_history(user=Depends(get_current_user)):
    """
    Supprime tout l'historique de l'utilisateur courant.
    """
    user_id = user["id"]
    removed = dbhistorique.remove(HistQ.user_id == user_id)
    return {"deleted": len(removed)}
