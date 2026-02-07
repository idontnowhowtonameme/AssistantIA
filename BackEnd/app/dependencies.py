from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.database import dbuser, UserQ
from app.security import get_user_id_from_token

bearer = HTTPBearer(auto_error=True)


def get_current_user(creds: HTTPAuthorizationCredentials = Depends(bearer)) -> dict:
    token = creds.credentials

    try:
        user_id = get_user_id_from_token(token)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    user = dbuser.get(UserQ.id == user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user


def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return user
