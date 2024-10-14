import os
import msal
import logging
from datetime import datetime
from auth.models.user_model import User
from fastapi.concurrency import run_in_threadpool
from auth.utils.jwt_utils import create_access_token
from motor.motor_asyncio import AsyncIOMotorCollection
from fastapi.responses import JSONResponse, RedirectResponse


AZURE_AD_CLIENT_ID = os.getenv("AZURE_AD_CLIENT_ID")
AZURE_AD_CLIENT_SECRET = os.getenv("AZURE_AD_CLIENT_SECRET")
AZURE_AD_TENANT_ID = os.getenv("AZURE_AD_TENANT_ID")
AZURE_AD_REDIRECT_URI = os.getenv("AZURE_AD_REDIRECT_URI")


def custom_error_response(detail: str, status_code: int = 400):
    return JSONResponse(status_code=status_code, content={"detail": detail})


if not all(
    [
        AZURE_AD_CLIENT_ID,
        AZURE_AD_CLIENT_SECRET,
        AZURE_AD_TENANT_ID,
        AZURE_AD_REDIRECT_URI,
    ]
):
    logging.error(
        "Missing Azure AD environment variables. Ensure all required variables are set."
    )
    raise RuntimeError("Azure AD environment variables are not configured properly.")

try:
    app = msal.ConfidentialClientApplication(
        AZURE_AD_CLIENT_ID,
        authority=f"https://login.microsoftonline.com/{AZURE_AD_TENANT_ID}",
        client_credential=AZURE_AD_CLIENT_SECRET,
    )
except Exception as e:
    logging.error(f"Error initializing Azure AD client: {e}")
    raise RuntimeError("Failed to initialize Azure AD client application")


async def azure_ad_login():
    try:
        # authorization_url = app.get_authorization_request_url(
        #     scopes=["User.Read"], redirect_uri=AZURE_AD_REDIRECT_URI
        # )

        authorization_url = await run_in_threadpool(
            app.get_authorization_request_url,
            scopes=["User.Read"],
            redirect_uri=AZURE_AD_REDIRECT_URI,
        )
        logging.info("Azure AD authorization URL generated")
        return RedirectResponse(authorization_url)
    except Exception as e:
        logging.error(f"Error generating Azure AD authorization URL: {e}")
        return custom_error_response(
            "Unable to generate Azure AD authorization URL", 500
        )


async def azure_ad_callback(code: str, collection_user: AsyncIOMotorCollection):
    try:
        # result = app.acquire_token_by_authorization_code(
        #     code, scopes=["User.Read"], redirect_uri=AZURE_AD_REDIRECT_URI
        # )

        result = await run_in_threadpool(
            app.acquire_token_by_authorization_code,
            code,
            scopes=["User.Read"],
            redirect_uri=AZURE_AD_REDIRECT_URI,
        )

        if "error" in result:
            logging.warning(
                f"Azure AD authentication error: {result.get('error_description', 'Unknown error')}"
            )
            return custom_error_response("Azure AD authentication failed", 400)

        user_info = result.get("id_token_claims", {})
        user_email = (
            user_info.get("email")
            or user_info.get("preferred_username")
            or user_info.get("upn")
        )

        if not user_email:
            logging.error("No valid user email found")
            return custom_error_response("No valid user email found", 400)

        user = await collection_user.find_one({"userEmailId": user_email})
        if not user:
            user = User(
                userEmailId=user_email,
                userFullName=user_info.get("name"),
                loginMethod="AZURE_AD",
                role=user_info.get("roles", []),
                createdAt=str(datetime.utcnow()),
                updatedAt=str(datetime.utcnow()),
            )
            user_inserted = await collection_user.insert_one(user.dict())
            user_id = str(user_inserted.inserted_id)
            logging.info(f"New user registered via Azure AD: {user_email}")
        else:
            user_id = str(user["_id"])

        access_token = create_access_token(data={"email": user_email})

        logging.info(f"Azure AD authentication successful for user: {user_email}")
        return {
            "user": {
                "id": user_id,
                "userEmailId": user["userEmailId"],
                "userFullName": user["userFullName"],
                "role": user["role"],
            },
            "access_token": access_token,
            "token_type": "bearer",
        }

    except Exception as e:
        logging.error(f"Azure AD authentication failed: {e}")
        return custom_error_response("Azure AD authentication failed", 400)






import os
import msal
import logging
from datetime import datetime
from auth.models.user_model import User
from fastapi.concurrency import run_in_threadpool
from auth.utils.jwt_utils import create_access_token
from motor.motor_asyncio import AsyncIOMotorCollection
from fastapi.responses import JSONResponse, RedirectResponse


AZURE_AD_CLIENT_ID = os.getenv("AZURE_AD_CLIENT_ID")
AZURE_AD_CLIENT_SECRET = os.getenv("AZURE_AD_CLIENT_SECRET")
AZURE_AD_TENANT_ID = os.getenv("AZURE_AD_TENANT_ID")
AZURE_AD_REDIRECT_URI = os.getenv("AZURE_AD_REDIRECT_URI")


def custom_error_response(detail: str, status_code: int = 400):
    return JSONResponse(status_code=status_code, content={"detail": detail})


if not all(
    [
        AZURE_AD_CLIENT_ID,
        AZURE_AD_CLIENT_SECRET,
        AZURE_AD_TENANT_ID,
        AZURE_AD_REDIRECT_URI,
    ]
):
    logging.error(
        "Missing Azure AD environment variables. Ensure all required variables are set."
    )
    raise RuntimeError("Azure AD environment variables are not configured properly.")

try:
    app = msal.ConfidentialClientApplication(
        AZURE_AD_CLIENT_ID,
        authority=f"https://login.microsoftonline.com/{AZURE_AD_TENANT_ID}",
        client_credential=AZURE_AD_CLIENT_SECRET,
    )
except Exception as e:
    logging.error(f"Error initializing Azure AD client: {e}")
    raise RuntimeError("Failed to initialize Azure AD client application")


async def microsoft_login():
    try:
        # authorization_url = app.get_authorization_request_url(
        #     scopes=["User.Read"], redirect_uri=AZURE_AD_REDIRECT_URI
        # )

        authorization_url = await run_in_threadpool(
            app.get_authorization_request_url,
            scopes=["openid", "User.Read"],
            redirect_uri=AZURE_AD_REDIRECT_URI,
        )
        logging.info("Microsoft SSO authorization URL generated")
        return RedirectResponse(authorization_url)
    except Exception as e:
        logging.error(f"Error generating Microsoft SSO authorization URL: {e}")
        return custom_error_response(
            "Unable to generate Microsoft SSO authorization URL", 500
        )


async def microsoft_callback(code: str, collection_user: AsyncIOMotorCollection):
    try:
        # result = app.acquire_token_by_authorization_code(
        #     code, scopes=["User.Read"], redirect_uri=AZURE_AD_REDIRECT_URI
        # )

        result = await run_in_threadpool(
            app.acquire_token_by_authorization_code,
            code,
            scopes=["openid", "User.Read"],
            redirect_uri=AZURE_AD_REDIRECT_URI,
        )

        if "error" in result:
            logging.warning(
                f"Microsoft SSO authentication error: {result.get('error_description', 'Unknown error')}"
            )
            return custom_error_response("Microsoft SSO authentication failed", 400)

        user_info = result.get("id_token_claims", {})
        user_email = (
            user_info.get("email")
            or user_info.get("preferred_username")
            or user_info.get("upn")
        )

        if not user_email:
            logging.error("No valid user email found")
            return custom_error_response("No valid user email found", 400)

        user = await collection_user.find_one({"userEmailId": user_email})
        if not user:
            user = User(
                userEmailId=user_email,
                userFullName=user_info.get("name"),
                loginMethod="MICROSOFT_SSO",
                role=user_info.get("roles", []),
                createdAt=str(datetime.utcnow()),
                updatedAt=str(datetime.utcnow()),
            )
            user_inserted = await collection_user.insert_one(user.dict())
            user_id = str(user_inserted.inserted_id)
            logging.info(f"New user registered via Microsoft SSO: {user_email}")
        else:
            user_id = str(user["_id"])

        access_token = create_access_token(data={"email": user_email})

        logging.info(f"Microsoft SSO authentication successful for user: {user_email}")
        return {
            "user": {
                "id": user_id,
                "userEmailId": user["userEmailId"],
                "userFullName": user["userFullName"],
                "role": user["role"],
            },
            "access_token": access_token,
            "token_type": "bearer",
        }

    except Exception as e:
        logging.error(f"Microsoft SSO authentication failed: {e}")
        return custom_error_response("Microsoft SSO authentication failed", 400)






import logging
from utils.db_utils import get_user_collection
from fastapi import APIRouter, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorCollection
from auth.utils.jwt_utils import TokenData, authenticate_jwt
from auth.oauth.azure_ad import azure_ad_callback, azure_ad_login
from auth.oauth.microsoft_sso import microsoft_callback, microsoft_login
from auth.models.message_model import LoginRequest, RegisterRequest, ChangePassword
from auth.controller.auth_controller import login_user, change_password, register_user


router = APIRouter()


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


@router.post("/change-password")
async def changePassword(
    request: ChangePassword,
    token_data: TokenData = Depends(authenticate_jwt),
    collection_user: AsyncIOMotorCollection = Depends(get_user_collection),
):
    try:
        logging.info("Password change attempt")
        userEmailId = token_data.email
        return await change_password(request, userEmailId, collection_user)
    except Exception as e:
        logging.error(f"Error during password change: {e}")
        raise HTTPException(status_code=500, detail="Password change failed")


@router.post("/login/azure-ad")
async def azure_ad_oauth_login():
    try:
        logging.info("Azure AD login attempt")
        return await azure_ad_login()
    except Exception as e:
        logging.error(f"Azure AD login failed: {e}")
        raise HTTPException(status_code=500, detail="Azure AD login failed")


@router.post("/callback/azure-ad")
async def azure_ad_oauth_callback(
    code: str,
    collection_user: AsyncIOMotorCollection = Depends(get_user_collection),
):
    try:
        logging.info("Azure AD callback attempt")
        return await azure_ad_callback(code, collection_user)
    except Exception as e:
        logging.error(f"Azure AD callback failed: {e}")
        raise HTTPException(status_code=500, detail="Azure AD callback failed")


@router.post("/login/sso")
async def sso_oauth_login():
    try:
        logging.info("Microsoft SSO login attempt")
        return await microsoft_login()
    except Exception as e:
        logging.error(f"Microsoft SSO login failed: {e}")
        raise HTTPException(status_code=500, detail="Microsoft SSO login failed")


@router.post("/callback/sso")
async def sso_oauth_callback(
    code: str,
    collection_user: AsyncIOMotorCollection = Depends(get_user_collection),
):
    try:
        logging.info("Microsoft SSO callback attempt")
        return await microsoft_callback(code, collection_user)
    except Exception as e:
        logging.error(f"Microsoft SSO callback failed: {e}")
        raise HTTPException(status_code=500, detail="Microsoft SSO callback failed")

