from pydantic import BaseModel, EmailStr, Field


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


class ChatIn(BaseModel):
    message: str = Field(min_length=1, max_length=5000)


class ChatOut(BaseModel):
    answer: str


class HistoryOut(BaseModel):
    items: list
    limit: int
    offset: int


class DeleteOut(BaseModel):
    deleted: int
