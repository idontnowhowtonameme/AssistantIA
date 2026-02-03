from datetime import datetime, timedelta, timezone

import bcrypt
from jose import jwt, JWTError

from app import config


# -------------------------
# Mot de passe (bcrypt)
# -------------------------

def hash_password(password: str) -> str:
    """
    Transforme un mot de passe en hash bcrypt.
    Pourquoi ?
    - On ne stocke JAMAIS les mots de passe en clair.
    """
    password_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    """
    Vérifie qu'un mot de passe correspond à un hash bcrypt.
    """
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except Exception:
        # hash invalide / corrompu
        return False


# -------------------------
# JWT
# -------------------------

def create_access_token(user_id: str) -> str:
    """
    Crée un JWT signé contenant l'identité user_id dans 'sub'.
    Pourquoi 'sub' ?
    - standard JWT : "subject" = identité du token
    """
    now = datetime.now(timezone.utc)
    exp = now + timedelta(minutes=config.JWT_EXPIRES_MINUTES)

    payload = {
        "sub": user_id,
        "iat": int(now.timestamp()),     # issued at
        "exp": int(exp.timestamp()),     # expiration
    }

    return jwt.encode(payload, config.JWT_SECRET, algorithm=config.JWT_ALGORITHM)


def get_user_id_from_token(token: str) -> str:
    """
    Décode et valide un JWT.
    Retourne l'user_id (sub) si tout est OK.
    Lève ValueError si token invalide / expiré.
    """
    try:
        payload = jwt.decode(token, config.JWT_SECRET, algorithms=[config.JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise ValueError("Token missing subject")
        return user_id
    except JWTError as e:
        # inclut signature invalide, token expiré, etc.
        raise ValueError("Invalid or expired token") from e
