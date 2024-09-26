from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ResetPassword(BaseModel):
    email: EmailStr


class NewPassword(BaseModel):
    token: str
    password: str


class ChangePassword(BaseModel):
    old_password: str
    new_password: str
