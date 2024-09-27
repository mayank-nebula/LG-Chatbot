@router.post("/register")
async def register(
    request: RegisterRequest,
    collection_user: AsyncIOMotorCollection = Depends(get_user_collection),
):
    try:
        logging.info("Register user attempt")
        return await register_user(request, collection_user)
    except Exception as e:
        logging.error(f"Error during registration: {e}")
        raise HTTPException(status_code=500, detail="Registration failed")
