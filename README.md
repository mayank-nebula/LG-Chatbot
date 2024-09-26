import os
import jwt
import logging
from pydantic import BaseModel
from dotenv import load_dotenv
from passlib.context import CryptContext
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jwt import ExpiredSignatureError, InvalidTokenError

load_dotenv()

# Load the secret key from environment variables for security
SECRET_KEY = os.getenv("SECRET_KEY", "your_jwt_secret")  # Ensure this is set securely
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30").split()[0]
)

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


# JWT token payload model
class TokenData(BaseModel):
    email: str


# Verify password using bcrypt hashing
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


# Hash password using bcrypt
def get_password_hash(password):
    return pwd_context.hash(password)


# Create a JWT access token
def create_access_token(data: dict, expires_delta: timedelta = None):
    try:
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        logging.info(f"JWT token created for user: {data.get('email', 'unknown')}")
        return encoded_jwt
    except Exception as e:
        logging.error(f"Error creating JWT token: {e}")
        raise HTTPException(status_code=500, detail="Token creation failed")


# Decode a JWT access token
def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("email")
        if email is None:
            raise HTTPException(status_code=401, detail="Token payload invalid")
        logging.info(f"JWT token decoded for user: {email}")
        return TokenData(email=email)
    except ExpiredSignatureError:
        logging.error("JWT token expired")
        raise HTTPException(status_code=401, detail="Token has expired")
    except InvalidTokenError as e:
        logging.error(f"JWT decoding error: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        logging.error(f"Error decoding token: {e}")
        raise HTTPException(status_code=401, detail="Token verification failed")


# JWT authentication function used as a FastAPI dependency
async def authenticate_jwt(token: str = Depends(oauth2_scheme)):
    try:
        token_data = decode_access_token(token)
        return token_data
    except HTTPException as e:
        raise e
    except Exception as e:
        logging.error(f"Unexpected error during token authentication: {e}")
        raise HTTPException(status_code=401, detail="Invalid or expired token")
