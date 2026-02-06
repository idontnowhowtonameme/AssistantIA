# BackEnd/app/dependencies.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.database import dbuser, UserQ
from app.security import get_user_id_from_token

# HTTPBearer :
# - lit l'en-tête "Authorization: Bearer <token>"
# - si absent et auto_error=True => 403 "Not authenticated" géré par FastAPI
bearer = HTTPBearer(auto_error=True)


def get_current_user(creds: HTTPAuthorizationCredentials = Depends(bearer)) -> dict:
    """
    Dépendance "utilisateur connecté".
    - récupère le token Bearer
    - le décode/valide (signature + expiration)
    - charge l'utilisateur depuis TinyDB
    """
    token = creds.credentials

    # 1) Valider / décoder le JWT -> user_id (sub)
    try:
        user_id = get_user_id_from_token(token)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    # 2) Charger l'utilisateur correspondant
    user = dbuser.get(UserQ.id == user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user


def require_admin(user: dict = Depends(get_current_user)) -> dict:
    """
    Dépendance "admin only".
    - bloque si role != admin
    """
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return user
