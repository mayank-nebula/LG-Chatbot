@app.middleware("http")
async def validate_origins_and_cors(request: Request, call_next):
    security_header = request.headers.get("X-Security-Header")
    if security_header is None or security_header != os.environ.get("SECURITY_HEADER"):
        return JSONResponse(
            status_code=403,
            content={"message":"Access Denied: Authentication Failed"}
        )

    origin = request.headers.get("origin")
    if origin not in allowed_origins:
        return JSONResponse(
            status_code=403,
            content={"message": "Access Denied: Authentication Failed"}
        )
    
    response = await call_next(request)
    
    response.headers["Access-Control-Allow-Origin"] = origin
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Security-Header"
    
    return response
