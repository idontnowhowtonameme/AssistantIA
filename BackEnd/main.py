# BackEnd/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.auth import router as auth_router
from app.routers.history import router as history_router
from app.routers.ai import router as ai_router
from app.routers.users import router as users_router
from app.routers.conversations import router as conversations_router

app = FastAPI(title="AssistantIA API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(users_router, prefix="/users", tags=["users"])
app.include_router(conversations_router, prefix="/conversations", tags=["conversations"])
app.include_router(history_router, prefix="/history", tags=["history"])
app.include_router(ai_router, prefix="/ai", tags=["ai"])
