# BackEnd/app/security.py
from datetime import datetime, timedelta, timezone

import bcrypt
from jose import jwt, JWTError

from app import config


# -------------------------
# Mot de passe (bcrypt)
# -------------------------
def hash_password(password: str) -> str:
    """
    Hash un mot de passe avec bcrypt.
    Pourquoi ?
    - On ne stocke JAMAIS un mot de passe en clair.
    - Un hash bcrypt est lent (volontairement), donc plus dur à brute-force.
    """
    password_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt(rounds=12)  # 12 = bon compromis dev/projet
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    """
    Compare un mot de passe "clair" avec un hash bcrypt stocké.
    """
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except Exception:
        # hash invalide/corrompu
        return False


# -------------------------
# JWT
# -------------------------
def create_access_token(user_id: str) -> str:
    """
    Crée un JWT signé contenant l'identité user_id dans 'sub'.
    'sub' = subject (standard JWT).
    """
    now = datetime.now(timezone.utc)
    exp = now + timedelta(minutes=config.JWT_EXPIRES_MINUTES)

    payload = {
        "sub": user_id,
        "iat": int(now.timestamp()),  # issued at
        "exp": int(exp.timestamp()),  # expiration
    }

    return jwt.encode(payload, config.JWT_SECRET, algorithm=config.JWT_ALGORITHM)


def get_user_id_from_token(token: str) -> str:
    """
    Décode/valide un JWT (signature + exp).
    Retourne l'user_id (sub) si OK, sinon ValueError.
    """
    try:
        payload = jwt.decode(token, config.JWT_SECRET, algorithms=[config.JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise ValueError("Token missing subject")
        return user_id
    except JWTError as e:
        raise ValueError("Invalid or expired token") from e
