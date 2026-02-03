from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.database import dbuser, UserQ
from app.security import get_user_id_from_token

# Schéma Bearer : attend "Authorization: Bearer <token>"
bearer = HTTPBearer(auto_error=True)

def get_current_user(creds: HTTPAuthorizationCredentials = Depends(bearer)) -> dict:
    """
    Dépendance FastAPI réutilisable :
    - récupère le token Bearer
    - le valide (JWT)
    - récupère l'utilisateur en base
    """
    token = creds.credentials
    try:
        user_id = get_user_id_from_token(token)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = dbuser.get(UserQ.id == user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user
