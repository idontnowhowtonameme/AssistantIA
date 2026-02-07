from fastapi import APIRouter, Depends, HTTPException

from app.database import dbuser, dbhistorique, UserQ, HistQ
from app.dependencies import get_current_user, require_admin
from app.schemas import UserListOut

router = APIRouter()


@router.get("", response_model=UserListOut)
def admin_list_users(admin=Depends(require_admin)):
    users = dbuser.all()

    items = [
        {
            "id": u["id"],
            "email": u["email"],
            "created_at": u.get("created_at", ""),
            "role": u.get("role"),
        }
        for u in users
    ]

    return {"items": items}


@router.delete("/me")
def delete_my_account(user=Depends(get_current_user)):
    user_id = user["id"]

    removed_hist = dbhistorique.remove(HistQ.user_id == user_id)

    removed_user = dbuser.remove(UserQ.id == user_id)

    if not removed_user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "deleted_user": len(removed_user),
        "deleted_history": len(removed_hist),
        "user_id": user_id,
    }


@router.delete("/{user_id}")
def admin_delete_user(user_id: str, admin=Depends(require_admin)):
    target = dbuser.get(UserQ.id == user_id)
    if not target:
        raise HTTPException(status_code=404, detail="Target user not found")

    removed_hist = dbhistorique.remove(HistQ.user_id == user_id)
    removed_user = dbuser.remove(UserQ.id == user_id)

    return {
        "deleted_user": len(removed_user),
        "deleted_history": len(removed_hist),
        "user_id": user_id,
    }
