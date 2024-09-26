import logging
from utils.db_utils import get_user_collection
from fastapi import APIRouter, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorCollection
from auth.utils.jwt_utils import TokenData, authenticate_jwt
from auth.models.message_model import (
    RegisterRequest,
    LoginRequest,
    ResetPassword,
    NewPassword,
    ChangePassword,
)
from auth.controller.auth_controller import (
    register_user,
    login_user,
    reset_password,
    new_password,
    change_password,
    verify_account,
)


# from auth.oauth.google import google_login, google_callback
# from auth.oauth.azure_ad import azure_login, azure_callback
from auth.oauth.ms_ad import ms_ad_login, ms_ad_callback

router = APIRouter()


# JWT-based authentication
@router.post("/register")
async def register(
    request: RegisterRequest,
    collection_user: AsyncIOMotorCollection = Depends(get_user_collection),
):
    try:
        logging.info("Register user attempt")
        return await register_user(request, collection_user)
    except Exception as e:
        logging.error(f"Error during registration: {e}")
        raise HTTPException(status_code=500, detail="Registration failed")


@router.get("/verify-account")
async def verifyAccount(
    token: str,
    collection_user: AsyncIOMotorCollection = Depends(get_user_collection),
):
    try:
        logging.info("Password reset attempt")
        return await verify_account(token, collection_user)
    except Exception as e:
        logging.error(f"Error during password reset: {e}")
        raise HTTPException(status_code=500, detail="Password rest failed")


@router.post("/login")
async def login(
    request: LoginRequest,
    collection_user: AsyncIOMotorCollection = Depends(get_user_collection),
):
    try:
        logging.info("Login attempt")
        return await login_user(request, collection_user)
    except Exception as e:
        logging.error(f"Error during login: {e}")
        raise HTTPException(status_code=500, detail="Login failed")


@router.post("/reset-password")
async def resetPassword(
    request: ResetPassword,
    collection_user: AsyncIOMotorCollection = Depends(get_user_collection),
):
    try:
        logging.info("Password token generation attempt")
        return await reset_password(request, collection_user)
    except Exception as e:
        logging.error(f"Error during password token generation: {e}")
        raise HTTPException(status_code=500, detail="Password token generation failed")


@router.post("/new-password")
async def newPassword(
    request: NewPassword,
    collection_user: AsyncIOMotorCollection = Depends(get_user_collection),
):
    try:
        logging.info("Password reset attempt")
        return await new_password(request, collection_user)
    except Exception as e:
        logging.error(f"Error during password reset: {e}")
        raise HTTPException(status_code=500, detail="Password rest failed")


@router.post("/change-password")
async def changePassword(
    request: ChangePassword,
    token_data: TokenData = Depends(authenticate_jwt),
    collection_user: AsyncIOMotorCollection = Depends(get_user_collection),
):
    try:
        logging.info("Password change attempt")
        user_email_id = token_data.email
        return await change_password(request, user_email_id, collection_user)
    except Exception as e:
        logging.error(f"Error during password change: {e}")
        raise HTTPException(status_code=500, detail="Password change failed")


# Microsoft AD authentication
@router.get("/login/ms-ad")
async def ms_ad_oauth_login():
    try:
        logging.info("Microsoft AD login attempt")
        return await ms_ad_login()
    except Exception as e:
        logging.error(f"Error during Microsoft AD OAuth login: {e}")
        raise HTTPException(status_code=500, detail="Microsoft AD login failed")


@router.get("/callback/ms-ad")
async def ms_ad_oauth_callback(
    code: str, collection_user: AsyncIOMotorCollection = Depends(get_user_collection)
):
    try:
        logging.info("Microsoft AD callback attempt")
        return await ms_ad_callback(code, collection_user)
    except Exception as e:
        logging.error(f"Error during Microsoft AD OAuth callback: {e}")
        raise HTTPException(status_code=500, detail="Microsoft AD callback failed")


# Google OAuth2 authentication
# @router.get("/login/google")
# async def google_oauth_login():
#     try:
#         logging.info("Google login attempt")
#         return await google_login()
#     except Exception as e:
#         logging.error(f"Error during Google OAuth login: {e}")
#         raise HTTPException(status_code=500, detail="Google login failed")


# @router.get("/callback/google")
# async def google_oauth_callback(
#     code: str, collection_user: AsyncIOMotorCollection = Depends(get_user_collection)
# ):
#     try:
#         logging.info("Google callback attempt")
#         return await google_callback(code, collection_user)
#     except Exception as e:
#         logging.error(f"Error during Google OAuth callback: {e}")
#         raise HTTPException(status_code=500, detail="Google callback failed")


# Azure AD authentication
# @router.get("/login/azure")
# async def azure_oauth_login():
#     try:
#         logging.info("Azure AD login attempt")
#         return await azure_login()
#     except Exception as e:
#         logging.error(f"Error during Azure AD OAuth login: {e}")
#         raise HTTPException(status_code=500, detail="Azure AD login failed")


# @router.get("/callback/azure")
# async def azure_oauth_callback(
#     code: str, collection_user: AsyncIOMotorCollection = Depends(get_user_collection)
# ):
#     try:
#         logging.info("Azure AD callback attempt")
#         return await azure_callback(code, collection_user)
#     except Exception as e:
#         logging.error(f"Error during Azure AD OAuth callback: {e}")
#         raise HTTPException(status_code=500, detail="Azure AD callback failed")
