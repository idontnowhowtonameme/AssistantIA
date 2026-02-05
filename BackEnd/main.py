from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Chaque router expose un objet `router`
from app.routers.auth import router as auth_router
from app.routers.history import router as history_router
from app.routers.ai import router as ai_router


def create_app() -> FastAPI:
    """
    Factory FastAPI (bonne pratique):
    - facilite les tests
    - évite les effets de bord à l'import
    - centralise la configuration de l'application
    """
    app = FastAPI(title="AssistantIA API", version="1.0.0")

    # --- CORS ---
    # Pourquoi ?
    # Le frontend (React) tourne sur un autre port => navigateur bloque sans CORS.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000",  # CRA
            "http://localhost:5173",  # Vite
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # --- Routers ---
    # Pourquoi ?
    # On branche chaque "domaine" de l'API dans son propre fichier.
    app.include_router(auth_router, prefix="/auth", tags=["auth"])
    app.include_router(history_router, prefix="/history", tags=["history"])
    app.include_router(ai_router, prefix="/ai", tags=["ai"])

    # Route simple de santé (utile pour vérifier que l'API répond)
    @app.get("/")
    def health_check():
        return {"status": "online"}

    return app


# Uvicorn cherche un objet `app`
<<<<<<< HEAD
# Commande: uvicorn app.main:app --reload
=======
# Commande: uvicorn main:app --reload
>>>>>>> b6532ed56bd33968f9ac0937f5c2f794c77e4a28
app = create_app()
