from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.database import dbuser, UserQ
from app.security import get_user_id_from_token

# -------------------------------------------------------------------
# Schéma HTTP Bearer
# -------------------------------------------------------------------
# FastAPI va lire automatiquement l'en-tête :
#   Authorization: Bearer <token>
#
# auto_error=True :
# - si le header est absent ou mal formé, FastAPI renvoie directement 401
# - évite de devoir gérer ce cas manuellement dans toutes les routes
bearer = HTTPBearer(auto_error=True)


def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(bearer),
) -> dict:
    """
    Dépendance d'authentification :
    - extrait le JWT depuis le header Authorization
    - vérifie le token (signature + expiration)
    - récupère l'utilisateur en base (TinyDB)
    - renvoie l'objet user si tout est OK

    Pourquoi on relit l'utilisateur en DB ?
    - un token peut être valide mais l'utilisateur peut avoir été supprimé
    - on veut que la DB reste la "source de vérité"
    """

    # Le token se trouve dans creds.credentials (sans le mot "Bearer")
    token = creds.credentials

    # 1) Valider le token et récupérer l'identité (user_id) depuis le payload
    try:
        user_id = get_user_id_from_token(token)
    except ValueError:
        # ValueError = token invalide / expiré / signature incorrecte / sub manquant
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    # 2) Charger l'utilisateur en base via son identifiant interne
    user = dbuser.get(UserQ.id == user_id)
    if not user:
        # Token OK mais utilisateur inexistant => accès refusé
        # (ex: compte supprimé mais token encore dans le navigateur)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    # 3) Tout est OK => on retourne l'objet user, injecté dans la route
    return user


def require_admin(user: dict = Depends(get_current_user)) -> dict:
    """
    Dépendance d'autorisation "admin" :

    - dépend de get_current_user => garantit que l'utilisateur est authentifié
    - vérifie ensuite le rôle en base (user["role"])

    Pourquoi un 403 ici et pas 401 ?
    - 401 = pas authentifié / token absent ou invalide
    - 403 = authentifié MAIS pas autorisé (droits insuffisants)
    """

    # On lit le champ role en base (et pas dans le JWT),
    # ce qui évite des soucis si un rôle change côté serveur.
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )

    # On retourne aussi l'utilisateur admin (utile pour logguer / auditer)
    return user
