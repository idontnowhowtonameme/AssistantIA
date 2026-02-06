# BackEnd/app/schemas.py
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


# ---------- AUTH ----------
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=200)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class MeOut(BaseModel):
    id: str
    email: EmailStr
    created_at: str
    role: Optional[str] = None


# ---------- CONVERSATIONS ----------
class ConversationCreateIn(BaseModel):
    # Titre optionnel (sinon on peut en générer un côté backend)
    title: Optional[str] = Field(default=None, max_length=80)


class ConversationOut(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str


class ConversationListOut(BaseModel):
    items: List[ConversationOut]


# ---------- CHAT ----------
class ChatIn(BaseModel):
    message: str = Field(min_length=1, max_length=5000)

    # Le frontend enverra l'id de conversation sélectionnée.
    # Si None : on peut créer une nouvelle conversation automatiquement.
    conversation_id: Optional[str] = None


class ChatOut(BaseModel):
    answer: str
    conversation_id: str


# ---------- HISTORY ----------
class HistoryItemOut(BaseModel):
    id: str
    user_id: str
    conversation_id: str
    role: str
    content: str
    created_at: str


class HistoryOut(BaseModel):
    items: list
    limit: int
    offset: int


class DeleteOut(BaseModel):
    deleted: int
