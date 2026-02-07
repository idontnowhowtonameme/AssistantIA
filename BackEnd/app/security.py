from datetime import datetime, timedelta, timezone

import bcrypt
from jose import jwt, JWTError

from app import config


def hash_password(password: str) -> str:
    password_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str) -> str:
    now = datetime.now(timezone.utc)
    exp = now + timedelta(minutes=config.JWT_EXPIRES_MINUTES)

    payload = {
        "sub": user_id,
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
    }

    return jwt.encode(payload, config.JWT_SECRET, algorithm=config.JWT_ALGORITHM)


def get_user_id_from_token(token: str) -> str:
    try:
        payload = jwt.decode(token, config.JWT_SECRET, algorithms=[config.JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise ValueError("Token missing subject")
        return user_id
    except JWTError as e:
        raise ValueError("Invalid or expired token") from e
