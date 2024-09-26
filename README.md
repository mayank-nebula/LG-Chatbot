import logging
import secrets
from fastapi import APIRouter
from pydantic import BaseModel
from auth.models.user_model import User
from datetime import datetime, timedelta
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorCollection
from utils.mail_utils import send_register_email, send_reset_email
from auth.utils.jwt_utils import (
    create_access_token,
    verify_password,
    get_password_hash,
)
from auth.models.message_model import (
    RegisterRequest,
    LoginRequest,
    ResetPassword,
    NewPassword,
    ChangePassword,
)

router = APIRouter()


# Token response model
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# Custom error response
def custom_error_response(detail: str, status_code: int = 400):
    return JSONResponse(status_code=status_code, content={"detail": detail})


# Register a new user with more robust error handling and logging
async def register_user(
    request: RegisterRequest,
    collection_user: AsyncIOMotorCollection,
):
    try:
        # Check if user already exists
        existing_user = await collection_user.find_one(
            {
                "email": request.email,
            }
        )
        if existing_user:
            return custom_error_response("User already exists", 400)

        hashed_password = get_password_hash(request.password)

        verify_token = secrets.token_hex(32)

        user = User(
            email=request.email,
            userFullName=request.full_name,
            loginMethod="Manual",
            hashed_password=hashed_password,
            role="user",
            verifyToken=verify_token,
            createdAt=str(datetime.utcnow()),
            updatedAt=str(datetime.utcnow()),
        )

        await collection_user.insert_one(user.dict())

        send_register_email(request.email, verify_token)

        return {"message": "User registered successfully"}

    except Exception as e:
        logging.error(f"Error occurred while registering user: {e}")
        return custom_error_response("Registration failed. Please try again.", 500)


# Login and generate JWT token with logging and enhanced error handling
async def login_user(
    request: LoginRequest,
    collection_user: AsyncIOMotorCollection,
):
    try:
        user = await collection_user.find_one(
            {"email": request.email, "loginMethod": "Manual"}
        )

        # Return an error if the user doesn't exist or password is invalid
        if not user or not verify_password(request.password, user["hashed_password"]):
            logging.warning(f"Failed login attempt for email: {request.email}")
            return custom_error_response("Invalid email or password", 400)

        if not user["verified"]:
            logging.warning(f"User not verified: {request.email}")
            return custom_error_response("User not verified", 400)

        # Create JWT token (30-minute expiration)
        access_token = create_access_token(
            data={"email": user["email"]}, expires_delta=timedelta(minutes=30)
        )
        return {"access_token": access_token, "token_type": "bearer"}

    except Exception as e:
        logging.error(f"Error occurred during login for user {request.email}: {e}")
        return custom_error_response("Login failed. Please try again.", 500)


# To generate password reset token
async def reset_password(
    request: ResetPassword,
    collection_user: AsyncIOMotorCollection,
):
    try:
        user = await collection_user.find_one(
            {"email": request.email, "loginMethod": "Manual"}
        )

        # Return an error if the user doesn't exist
        if not user:
            logging.warning(
                f"Failed password token generation attempt for email: {request.email}"
            )
            return custom_error_response("No user exists", 400)

        token = secrets.token_hex(32)
        reset_token_expiration = datetime.utcnow() + timedelta(hours=1)

        update_user = await collection_user.update_one(
            {"email": request.email},
            {
                "$set": {
                    "resetToken": token,
                    "resetTokenExpiration": reset_token_expiration,
                    "updatedAt": datetime.utcnow(),
                }
            },
        )

        if update_user.modified_count == 1:
            logging.info(f"Reset token set for {request.email}")
        else:
            return custom_error_response(
                "Failed to update the user token. Please try again.", 500
            )

        send_reset_email(request.email, token)

        return {"msg": "Password reset email sent"}

    except Exception as e:
        logging.error(
            f"Error occurred during password token generation for user {request.email}: {e}"
        )
        return custom_error_response(
            "Password token generation failed. Please try again.", 500
        )


async def new_password(
    request: NewPassword,
    collection_user: AsyncIOMotorCollection,
):
    try:
        current_time = datetime.utcnow()
        user = await collection_user.find_one(
            {
                "resetToken": request.token,
                "resetTokenExpiration": {"$gt": current_time},
            }
        )

        if not user:
            logging.warning(f"Failed password reset attempt for unknown user.")
            return custom_error_response("No user exists", 400)

        if verify_password(request.password, user["hashed_password"]):
            logging.warning(
                f"New password must be different from the old password for email: {user['email']}"
            )
            return custom_error_response(
                "New password must be different from the old password", 400
            )

        hashed_password = get_password_hash(request.password)

        update_result = await collection_user.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "hashed_password": hashed_password,
                    "resetToken": None,
                    "updatedAt": datetime.utcnow(),
                },
                "$unset": {
                    "resetTokenExpiration": "",
                },
            },
        )
        if update_result.modified_count == 1:
            logging.info(f"Password reset successfully for email: {user['email']}")
            return {"msg": "Password reset successfully"}
        else:
            logging.error(f"Failed to update password for email: {user['email']}")
            return custom_error_response(
                "Failed to reset password, please try again", 500
            )
    except Exception as e:
        user_email = user["email"] if user else "Unknown"
        logging.error(
            f"Error occurred during password reset for user {user_email}: {e}"
        )
        return custom_error_response("Password reset failed. Please try again.", 500)


async def change_password(
    request: ChangePassword,
    user_email_id: str,
    collection_user: AsyncIOMotorCollection,
):
    try:
        user = await collection_user.find_one(
            {"email": user_email_id, "loginMethod": "Manual"}
        )

        # Return an error if the user doesn't exist
        if not user:
            logging.warning(
                f"Failed password token generation attempt for email: {user_email_id}"
            )
            return custom_error_response("No user exists", 400)

        if not verify_password(request.old_password, user["hashed_password"]):
            logging.warning(f"Wrong password provided of the user: {user_email_id}")
            return custom_error_response("Wrong password provided of the user", 400)

        hashed_password = get_password_hash(request.new_password)

        update_result = await collection_user.update_one(
            {"email": user_email_id},
            {
                "$set": {
                    "hashed_password": hashed_password,
                    "updatedAt": datetime.utcnow(),
                },
            },
        )
        if update_result.modified_count == 1:
            logging.info(f"Password change successfully for email: {user_email_id}")
            return {"msg": "Password reset successfully"}
        else:
            logging.error(f"Failed to change password for email: {user_email_id}")
            return custom_error_response(
                "Failed to change password, please try again", 500
            )
    except Exception as e:
        logging.error(
            f"Error occurred during password reset for user {user_email_id}: {e}"
        )
        return custom_error_response("Password reset failed. Please try again.", 500)


async def verify_account(token: str, collection_user: AsyncIOMotorCollection):
    try:
        user = await collection_user.find_one(
            {"verifyToken": token, "loginMethod": "Manual"}
        )

        if not user:
            logging.warning(f"Failed to verify user.")
            return custom_error_response("No user exists", 400)

        update_result = await collection_user.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "verified": "Yes",
                    "verifyToken": None,
                    "updatedAt": datetime.utcnow(),
                },
            },
        )
        if update_result.modified_count == 1:
            logging.info(f"User Verified: {user['email']}")
            return {"msg": "User Verified successfully"}
        else:
            logging.error(f"Failed to verify user for email: {user['email']}")
            return custom_error_response("Failed to verify user, please try again", 500)
    except Exception as e:
        logging.error(f"Failed to verify user: {e}")
        return custom_error_response("Failed to verify user. Please try again.", 500)
