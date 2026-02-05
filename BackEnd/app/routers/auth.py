import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Depends, status

from app.database import dbuser, dbhistorique, UserQ, HistQ
from app.security import hash_password, verify_password, create_access_token
from app.dependencies import get_current_user, require_admin
from app.schemas import RegisterIn, LoginIn, TokenOut, MeOut
from app.validators import domain_has_mx

router = APIRouter()

# -------------------------
# REGISTER
# -------------------------
@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(payload: RegisterIn):
    """
    Crée un compte utilisateur.
    """
    email_norm = payload.email.strip().lower()

    # Vérification domaine email (MX record)
    domain = email_norm.split("@")[-1]
    if not domain_has_mx(domain):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email domain is not valid (no MX record)",
        )

    # Email déjà existant
    if dbuser.get(UserQ.email == email_norm):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user_id = f"usr_{uuid.uuid4().hex}"

    user_doc = {
        "id": user_id,
        "email": email_norm,
        "password_hash": hash_password(payload.password),
        "role": "user",  # rôle par défaut
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    dbuser.insert(user_doc)

    return {
        "id": user_id,
        "email": email_norm,
        "created_at": user_doc["created_at"],
    }


# -------------------------
# LOGIN
# -------------------------
@router.post("/login", response_model=TokenOut)
def login(payload: LoginIn):
    """
    Connexion utilisateur :
    - vérifie email + mot de passe
    - renvoie un JWT
    """
    email_norm = payload.email.strip().lower()
    user = dbuser.get(UserQ.email == email_norm)

    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    token = create_access_token(user_id=user["id"])
    return {"access_token": token, "token_type": "bearer"}


# -------------------------
# ME
# -------------------------
@router.get("/me", response_model=MeOut)
def me(user=Depends(get_current_user)):
    """
    Retourne l'utilisateur courant.
    """
    return {
        "id": user["id"],
        "email": user["email"],
        "created_at": user["created_at"],
    }


# -------------------------
# DELETE MY ACCOUNT
# -------------------------
@router.delete("/me", status_code=status.HTTP_200_OK)
def delete_my_account(user=Depends(get_current_user)):
    """
    Supprime le compte de l'utilisateur connecté.
    - accessible à tous (admin ou non)
    """
    user_id = user["id"]

    # Supprimer l'utilisateur
    dbuser.remove(UserQ.id == user_id)

    # Supprimer son historique
    dbhistorique.remove(HistQ.user_id == user_id)

    return {"detail": "Your account has been deleted"}


# -------------------------
# ADMIN DELETE USER
# -------------------------
@router.delete(
    "/users/{user_id}",
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_admin)],
)
def admin_delete_user(user_id: str):
    """
    Suppression d'un compte utilisateur par un ADMIN.
    """
    user = dbuser.get(UserQ.id == user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    dbuser.remove(UserQ.id == user_id)
    dbhistorique.remove(HistQ.user_id == user_id)

    return {"detail": f"User {user_id} has been deleted"}
