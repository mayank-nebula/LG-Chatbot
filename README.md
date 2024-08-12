@app.middleware("https")
async def validate_origins(request: Request, call_next):
    security_header = request.headers.get("security_header")
    # if security_header and security_header != os.environ["SECURITY_HEADER"]:
        # raise HTTPException(status_code=403, detail="Access Denied: Authentication Failed")
    if security_header is None or security_header != os.environ["SECURITY_HEADER"]:
        raise HTTPException(status_code=403, detail="Access Denied: Authentication Failed")
    response = await call_next(request)
    return response
