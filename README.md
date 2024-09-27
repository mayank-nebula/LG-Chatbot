async def register_user(
    request: RegisterRequest,
    collection_user: AsyncIOMotorCollection,
):
    try:
        # Check if user already exists
        existing_user = await collection_user.find_one(
            {
                "email": request.email,
            }
        )
        if existing_user:
            return custom_error_response("User already exists", 400)

        hashed_password = get_password_hash(request.password)

        verify_token = secrets.token_hex(32)

        user = User(
            email=request.email,
            userFullName=request.full_name,
            loginMethod="Manual",
            hashed_password=hashed_password,
            role="user",
            verifyToken=verify_token,
            createdAt=str(datetime.utcnow()),
            updatedAt=str(datetime.utcnow()),
        )

        await collection_user.insert_one(user.dict())

        send_register_email(request.email, verify_token)

        return {"message": "User registered successfully"}

    except Exception as e:
        logging.error(f"Error occurred while registering user: {e}")
        return custom_error_response("Registration failed. Please try again.", 500)
