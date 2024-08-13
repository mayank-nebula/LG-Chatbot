import os
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

app = FastAPI()

allowed_origins = ["https://example1.com", "https://example2.com"]

@app.middleware("http")
async def validate_origins_and_cors(request: Request, call_next):
    # Validate X-Security-Header
    security_header = request.headers.get("X-Security-Header")
    if security_header is None or security_header != os.environ.get("SECURITY_HEADER"):
        return JSONResponse(
            status_code=403,
            content={"message": "Access Denied: Authentication Failed"}
        )

    # Validate Origin Header
    origin = request.headers.get("origin")
    if origin not in allowed_origins:
        return JSONResponse(
            status_code=403,
            content={"message": "Access Denied: Origin Not Allowed"}
        )

    # Handle preflight requests (OPTIONS method)
    if request.method == "OPTIONS":
        response = JSONResponse(status_code=204)
    else:
        response = await call_next(request)
    
    # Add CORS headers to the response
    response.headers["Access-Control-Allow-Origin"] = origin
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Security-Header"
    
    return response
