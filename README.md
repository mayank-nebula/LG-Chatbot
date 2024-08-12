@app.middleware("http")
async def validate_origins(request: Request, call_next):
    security_header = request.headers.get("X-Security-Header")
    if security_header is None or security_header != os.environ.get("SECURITY_HEADER"):
        raise HTTPException(status_code=403, detail="Access Denied: Authentication Failed")
    response = await call_next(request)
    return response
