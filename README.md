import os
import msal
import logging
from datetime import datetime
from auth.models.user_model import User
from fastapi import APIRouter, HTTPException
from auth.utils.jwt_utils import create_access_token
from motor.motor_asyncio import AsyncIOMotorCollection

router = APIRouter()

# Microsoft AD environment variables
MS_AD_CLIENT_ID = os.getenv("MS_AD_CLIENT_ID")
MS_AD_CLIENT_SECRET = os.getenv("MS_AD_CLIENT_SECRET")
MS_AD_TENANT_ID = os.getenv("MS_AD_TENANT_ID")
MS_AD_REDIRECT_URI = os.getenv("MS_AD_REDIRECT_URI")

# Check for missing environment variables
if not all([MS_AD_CLIENT_ID, MS_AD_CLIENT_SECRET, MS_AD_TENANT_ID, MS_AD_REDIRECT_URI]):
    logging.error(
        "Missing Microsoft AD environment variables. Ensure all required variables are set."
    )
    raise RuntimeError(
        "Microsoft AD environment variables are not configured properly."
    )

# MSAL Confidential Client application for Microsoft AD
try:
    app = msal.ConfidentialClientApplication(
        MS_AD_CLIENT_ID,
        authority=f"https://login.microsoftonline.com/{MS_AD_TENANT_ID}",
        client_credential=MS_AD_CLIENT_SECRET,
    )
except Exception as e:
    logging.error(f"Error initializing Microsoft AD client: {e}")
    raise RuntimeError("Failed to initialize Microsoft AD client application")


# Microsoft AD login route
async def ms_ad_login():
    try:
        authorization_url = app.get_authorization_request_url(
            scopes=["User.Read"], redirect_uri=MS_AD_REDIRECT_URI
        )
        logging.info("Microsoft AD authorization URL generated")
        return {"authorization_url": authorization_url}
    except Exception as e:
        logging.error(f"Error generating Microsoft AD authorization URL: {e}")
        raise HTTPException(
            status_code=500, detail="Unable to generate Microsoft AD authorization URL"
        )


# Microsoft AD callback
async def ms_ad_callback(code: str, collection_user: AsyncIOMotorCollection):
    try:
        # Exchange the authorization code for tokens

        result = app.acquire_token_by_authorization_code(
            code, scopes=["User.Read"], redirect_uri=MS_AD_REDIRECT_URI
        )

        if "error" in result:
            logging.warning(
                f"Microsoft AD authentication error: {result.get('error_description', 'Unknown error')}"
            )
            raise HTTPException(
                status_code=400, detail="Microsoft AD authentication failed"
            )

        # Fetch user information
        user_info = result.get("id_token_claims", {})
        user_email = (
            user_info.get("email")
            or user_info.get("preferred_username")
            or user_info.get("upn")
        )

        # Check if user exists in DB
        user = await collection_user.find_one(
            {"email": user_email, "loginMethod": "MSAD"}
        )
        if not user:
            user = User(
                email=user_email,
                verified="Yes",
                loginMethod="MSAD",
                userFullName=user_info.get("name"),
                role=user_info.get("roles")[0],
                created_at=str(datetime.utcnow()),
            )
            await collection_user.insert_one(user.dict())
            logging.info(f"New user registered via Microsoft AD: {user_email}")

        # Generate JWT token
        access_token = create_access_token(data={"email": user_email})

        logging.info(f"Microsoft AD authentication successful for user: {user_email}")
        return {"access_token": access_token, "token_type": "bearer"}

    except Exception as e:
        logging.error(f"Microsoft AD authentication failed: {e}")
        raise HTTPException(
            status_code=400, detail="Microsoft AD authentication failed"
        )
