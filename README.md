import os
import logging
import uvicorn
from dotenv import load_dotenv
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Depends
from routes.file_routes import router as file_router
from routes.chat_routes import router as chat_router
from auth.routes.auth_routes import router as auth_router
from routes.user_routes import router as user_management_router
from utils.db_utils import startup_db_client, shutdown_db_client
from utils.security_utils import add_cors_middleware, authenticate_jwt


# Load environment variables from .env file
load_dotenv()

# MongoDB connection setup
MONGO_API_KEY = os.getenv("MONGO_API_KEY")


# Define the lifespan of the application
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize the DB client
    startup_db_client()

    # Yield to keep the application running
    yield

    # Shutdown: Cleanup resources
    shutdown_db_client()


# Initialize FastAPI application with lifespan event handlers
app = FastAPI(lifespan=lifespan)

# Setup CORS middleware for the application
add_cors_middleware(app)

# Include authentication routes (JWT, Google, Azure AD, Microsoft AD)
app.include_router(
    auth_router,
    # prefix="/auth"
)

# Include additional secured routes (file handling)
app.include_router(
    file_router,
    prefix="/file",
    dependencies=[Depends(authenticate_jwt)],
)

# Include additional secured routes (user handling)
app.include_router(
    user_management_router,
    prefix="/chat",
    dependencies=[Depends(authenticate_jwt)],
)

# Include chat content generation routes
app.include_router(
    chat_router,
    prefix="/api/v1",
    dependencies=[Depends(authenticate_jwt)],
)


# Health check route - No authentication required
@app.get("/health", include_in_schema=False)
async def health_check():
    """
    Endpoint for health checks.
    Returns the health status of the API server.
    """
    return {"status": "healthy"}


# Global error handler middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """
    Middleware to handle errors globally and provide process time headers for requests.
    If an error occurs, returns a JSON response with a 500 status code.
    """
    try:
        response = await call_next(request)
        return response
    except Exception as exc:
        logging.error(f"Unhandled error: {str(exc)}")
        return JSONResponse(
            status_code=500, content={"message": "Internal server error"}
        )


# Default root route
@app.get("/")
async def root():
    """
    Root endpoint to verify the server is running.
    """
    return {"message": "Welcome to FastAPI Server"}


# Start the server (using Uvicorn if running locally)
if __name__ == "__main__":
    # SSL setup (optional, depends on configuration)
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8080,
        # ssl_keyfile=os.getenv("SSL_KEYFILE", None),
        # ssl_certfile=os.getenv("SSL_CERTFILE", None),
        # workers=1,
    )


# from auth.routes.user_routes import router as user_router

# Include additional secured routes (document handling)
# app.include_router(
#     document.router, prefix="/docs", dependencies=[Depends(get_jwt_dependency())]
# )

# Include user management routes (profile, role assignment)
# app.include_router(user_router, prefix="/user")
