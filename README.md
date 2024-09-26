from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field


class User(BaseModel):
    """
    Pydantic model for representing a user in the system.

    Attributes:
    - email (EmailStr): The user's email address (validated for correct format).
    - userFullName (str): The full name of the user.
    - userPermissions (List[str]): List of permissions assigned to the user.
    - hashed_password (Optional[str]): The hashed password for the user (used for authentication).
    - role (str): The role of the user (e.g., 'user', 'admin'). Defaults to 'user'.
    - resetToken (Optional[str]): Token for resetting the user's password.
    - resetTokenExpiration (Optional[datetime]): Expiration time for the password reset token.
    - createdAt (Optional[datetime]): Timestamp for when the user was created.
    - updatedAt (Optional[datetime]): Timestamp for when the user's information was last updated.
    """

    email: EmailStr = Field(..., description="The user's email address")
    userFullName: str = Field(..., description="The full name of the user")
    verified: Optional[str] = Field(None, description="Verified User")
    loginMethod: str = Field(..., description="Login Method")
    userPermissions: Optional[List[str]] = Field(
        default_factory=list, description="List of user permissions"
    )
    hashed_password: Optional[str] = Field(
        None, description="Hashed password for authentication"
    )
    role: str = Field(default="user", description="Role of the user, default is 'user'")
    resetToken: Optional[str] = Field(
        None, description="Token for resetting the user's password"
    )
    resetTokenExpiration: Optional[datetime] = Field(
        None, description="Expiration time for the reset token"
    )
    verifyToken: Optional[str] = Field(
        None, description="Token for resetting the user's password"
    )
    # verifyResetTokenExpiration: Optional[datetime] = Field(
    #     None, description="Expiration time for the reset token"
    # )
    createdAt: Optional[datetime] = Field(
        default_factory=datetime.utcnow, description="Timestamp for user creation"
    )
    updatedAt: Optional[datetime] = Field(
        default_factory=datetime.utcnow, description="Timestamp for the last update"
    )
