@app.middleware("http")
async def cors_error_handling(request, call_next):
    origin = request.headers.get("origin")
    if origin and origin not in allowed_origins:
        raise HTTPException(status_code=403, detail="Access Denied: Authentication Failed")
    return await call_next(request)
