import logging
from fastapi import FastAPI
from fastapi import HTTPException
from auth.utils.jwt_utils import authenticate_jwt
from fastapi.middleware.cors import CORSMiddleware

# List of allowed origins for CORS
allowed_origins = ["*"]


# Function to add CORS middleware to the FastAPI app
def add_cors_middleware(app: FastAPI):
    """
    Adds CORS middleware to the FastAPI application.

    Args:
    - app (FastAPI): The FastAPI app instance.

    This middleware allows the specified origins to access the API while restricting
    other origins. It also enables credentials, methods, and headers needed for security.
    """
    try:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=allowed_origins,  # Only allow requests from trusted domains
            allow_credentials=True,  # Allow credentials such as cookies and auth tokens
            allow_methods=["*"],  # Allow all HTTP methods (GET, POST, etc.)
            allow_headers=["*"],  # Allow all headers for CORS requests
        )
        logging.info("CORS middleware added successfully")
    except Exception as e:
        logging.error(f"Error adding CORS middleware: {str(e)}")
        raise Exception("Failed to add CORS middleware")
