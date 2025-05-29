from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


class File(BaseModel):
    message_id: Optional[str] = Field(
        default=None, alias="Message-ID", description="Unique ID of the email message"
    )
    in_reply_to: Optional[str] = Field(
        default=None, alias="In-Reply-to", description="Message ID this file is replying to"
    )
    references: List[str] = Field(
        default_factory=list, description="List of referenced message IDs"
    )
    userEmailId: EmailStr = Field(..., description="Email of the user associated with the file")
    filename: str = Field(..., description="Name of the file")
    status: str = Field(..., description="Processing status of the file")
    size: int = Field(..., description="Size of the file in bytes")
    folder: str = Field(..., description="Folder where the file is stored")
    type: str = Field(..., description="Type/category of the file")
    createdAt: Optional[datetime] = Field(
        default_factory=datetime.utcnow,
        description="Timestamp when the file was created (set automatically)"
    )
    updatedAt: Optional[datetime] = Field(
        default_factory=datetime.utcnow,
        description="Timestamp when the file was last updated (set automatically)"
    )


class FailedFile(BaseModel):
    userEmailId: EmailStr = Field(..., description="Email of the user associated with the file")
    filename: str = Field(..., description="Name of the file")
    status: str = Field(..., description="Processing status of the file")
    size: int = Field(..., description="Size of the file in bytes")
    folder: str = Field(..., description="Folder where the file is stored")
    type: str = Field(..., description="Type/category of the file")
    createdAt: Optional[datetime] = Field(
        default_factory=datetime.utcnow,
        description="Timestamp when the file was created (set automatically)"
    )
    updatedAt: Optional[datetime] = Field(
        default_factory=datetime.utcnow,
        description="Timestamp when the file was last updated (set automatically)"
    )


class NormalFile(BaseModel):
    userEmailId: EmailStr = Field(..., description="Email of the user associated with the file")
    filename: str = Field(..., description="Name of the file")
    status: str = Field(..., description="Processing status of the file")
    size: int = Field(..., description="Size of the file in bytes")
    folder: str = Field(..., description="Folder where the file is stored")
    type: str = Field(..., description="Type/category of the file")
    createdAt: Optional[datetime] = Field(
        default_factory=datetime.utcnow,
        description="Timestamp when the file was created (set automatically)"
    )
    updatedAt: Optional[datetime] = Field(
        default_factory=datetime.utcnow,
        description="Timestamp when the file was last updated (set automatically)"
    )
