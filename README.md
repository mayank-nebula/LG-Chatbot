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
        logging.info("Azure AD authorization URL generated")
        return RedirectResponse(authorization_url)
    except Exception as e:
        logging.error(f"Error generating Azure AD authorization URL: {e}")
        return custom_error_response(
            "Unable to generate Azure AD authorization URL", 500
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

        user = await collection_user.find_one(
            {"userEmailId": user_email, "loginMethod": "MICROSOFT_SSO"}
        )
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
