blocked_user_agents = ["PostmanRuntime", "curl"]

# Middleware to check the origin and optionally block specific user-agents
@app.middleware("http")
async def validate_request(request: Request, call_next):
    origin = request.headers.get('origin')
    user_agent = request.headers.get('user-agent')

    # Reject requests from blocked user agents (optional)
    if any(ua in user_agent for ua in blocked_user_agents):
        raise HTTPException(status_code=403, detail="Access Denied: Unauthorized User-Agent")

    # Reject requests without an Origin header
    if not origin:
        raise HTTPException(status_code=403, detail="Access Denied: Missing Origin Header")

    # Reject requests with an invalid origin
    if origin not in allowed_origins:
        raise HTTPException(status_code=403, detail="Access Denied: Invalid Origin")

    response = await call_next(request)
    return response
