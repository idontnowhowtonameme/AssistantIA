# BackEnd/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Routers
from app.routers.auth import router as auth_router
from app.routers.history import router as history_router
from app.routers.ai import router as ai_router


def create_app() -> FastAPI:
    """
    Factory FastAPI (bonne pratique) :
    - facilite les tests
    - évite les effets de bord à l'import
    - centralise la config app (middlewares, routers)
    """
    app = FastAPI(title="AssistantIA API", version="1.0.0")

    # CORS : autorise le frontend React (ports dev)
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

    # On branche les routers
    app.include_router(auth_router, prefix="/auth", tags=["auth"])
    app.include_router(history_router, prefix="/history", tags=["history"])
    app.include_router(ai_router, prefix="/ai", tags=["ai"])

    @app.get("/")
    def health_check():
        return {"status": "online"}

    return app


# Uvicorn cherche un objet nommé "app"
app = create_app()
