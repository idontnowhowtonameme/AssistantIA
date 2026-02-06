# BackEnd/app/routers/auth.py
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Depends

from app.database import dbuser, UserQ
from app.security import hash_password, verify_password, create_access_token
from app.dependencies import get_current_user
from app.schemas import RegisterIn, LoginIn, TokenOut, MeOut
from app.validators import domain_has_mx

router = APIRouter()


@router.post("/register", status_code=201)
def register(payload: RegisterIn):
    """
    Crée un compte utilisateur.
    - email/password en JSON (body), plus standard en REST.
    """
    email_norm = payload.email.strip().lower()

    # Option : validation domaine (MX)
    domain = email_norm.split("@")[-1]
    if not domain_has_mx(domain):
        raise HTTPException(status_code=400, detail="Email domain is not valid (no MX record)")

    if dbuser.get(UserQ.email == email_norm):
        raise HTTPException(status_code=409, detail="Email already registered")

    user_id = f"usr_{uuid.uuid4().hex}"
    user_doc = {
        "id": user_id,
        "email": email_norm,
        "password_hash": hash_password(payload.password),
        "role": "user",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    dbuser.insert(user_doc)
    return {"id": user_id, "email": email_norm, "created_at": user_doc["created_at"]}


@router.post("/login", response_model=TokenOut)
def login(payload: LoginIn):
    """
    Connexion :
    - vérifie email + password
    - renvoie un JWT
    """
    email_norm = payload.email.strip().lower()
    user = dbuser.get(UserQ.email == email_norm)

    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(user_id=user["id"])
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=MeOut)
def me(user=Depends(get_current_user)):
    """
    Route protégée :
    - retourne l'utilisateur courant depuis le token
    """
    return {
        "id": user["id"],
        "email": user["email"],
        "created_at": user["created_at"],
        "role": user.get("role"),
    }
