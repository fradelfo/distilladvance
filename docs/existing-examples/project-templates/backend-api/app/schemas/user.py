"""
Pydantic schemas for user-related API endpoints.
Provides request validation, response serialization, and documentation.
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field, validator
from enum import Enum

from app.models.user import UserRole


class UserCreate(BaseModel):
    """Schema for creating a new user."""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="Password (8-128 characters)"
    )
    full_name: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Full name"
    )
    accept_terms: bool = Field(
        ...,
        description="Must accept terms and conditions"
    )

    @validator('accept_terms')
    def terms_must_be_accepted(cls, v):
        if not v:
            raise ValueError('Terms and conditions must be accepted')
        return v

    @validator('full_name')
    def validate_full_name(cls, v):
        if not v.strip():
            raise ValueError('Full name cannot be empty')
        return v.strip()

    class Config:
        schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "SecurePass123!",
                "full_name": "John Doe",
                "accept_terms": True
            }
        }


class UserUpdate(BaseModel):
    """Schema for updating user information."""
    full_name: Optional[str] = Field(
        None,
        min_length=1,
        max_length=100,
        description="Updated full name"
    )
    bio: Optional[str] = Field(
        None,
        max_length=500,
        description="User biography"
    )
    location: Optional[str] = Field(
        None,
        max_length=100,
        description="User location"
    )
    website: Optional[str] = Field(
        None,
        max_length=200,
        description="User website URL"
    )

    @validator('full_name')
    def validate_full_name(cls, v):
        if v is not None and not v.strip():
            raise ValueError('Full name cannot be empty')
        return v.strip() if v else v

    class Config:
        schema_extra = {
            "example": {
                "full_name": "Jane Doe",
                "bio": "Software developer passionate about AI",
                "location": "San Francisco, CA",
                "website": "https://janedoe.dev"
            }
        }


class PasswordChange(BaseModel):
    """Schema for password change requests."""
    current_password: str = Field(..., description="Current password")
    new_password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="New password (8-128 characters)"
    )
    confirm_password: str = Field(..., description="Password confirmation")

    @validator('confirm_password')
    def passwords_match(cls, v, values):
        if 'new_password' in values and v != values['new_password']:
            raise ValueError('Passwords do not match')
        return v

    class Config:
        schema_extra = {
            "example": {
                "current_password": "OldPass123!",
                "new_password": "NewSecurePass123!",
                "confirm_password": "NewSecurePass123!"
            }
        }


class PasswordReset(BaseModel):
    """Schema for password reset requests."""
    email: EmailStr = Field(..., description="Email address for password reset")

    class Config:
        schema_extra = {
            "example": {
                "email": "user@example.com"
            }
        }


class PasswordResetConfirm(BaseModel):
    """Schema for confirming password reset with token."""
    token: str = Field(..., description="Password reset token")
    new_password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="New password (8-128 characters)"
    )
    confirm_password: str = Field(..., description="Password confirmation")

    @validator('confirm_password')
    def passwords_match(cls, v, values):
        if 'new_password' in values and v != values['new_password']:
            raise ValueError('Passwords do not match')
        return v

    class Config:
        schema_extra = {
            "example": {
                "token": "reset-token-here",
                "new_password": "NewSecurePass123!",
                "confirm_password": "NewSecurePass123!"
            }
        }


class EmailVerification(BaseModel):
    """Schema for email verification."""
    token: str = Field(..., description="Email verification token")

    class Config:
        schema_extra = {
            "example": {
                "token": "verification-token-here"
            }
        }


class UserResponse(BaseModel):
    """Schema for user data in API responses."""
    id: int
    email: str
    full_name: str
    bio: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None
    role: UserRole
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None
    post_count: int = 0
    comment_count: int = 0

    class Config:
        orm_mode = True
        use_enum_values = True
        schema_extra = {
            "example": {
                "id": 1,
                "email": "user@example.com",
                "full_name": "John Doe",
                "bio": "Software developer",
                "location": "San Francisco, CA",
                "website": "https://johndoe.dev",
                "role": "user",
                "is_active": True,
                "is_verified": True,
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z",
                "last_login": "2024-01-01T12:00:00Z",
                "post_count": 5,
                "comment_count": 23
            }
        }


class UserListResponse(BaseModel):
    """Schema for paginated user lists."""
    users: List[UserResponse]
    total: int
    page: int
    size: int
    pages: int

    class Config:
        schema_extra = {
            "example": {
                "users": [],
                "total": 100,
                "page": 1,
                "size": 20,
                "pages": 5
            }
        }


class UserProfile(BaseModel):
    """Extended user profile for detailed views."""
    id: int
    email: str
    full_name: str
    bio: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None
    role: UserRole
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None

    # Extended stats
    post_count: int = 0
    comment_count: int = 0
    total_views: int = 0
    total_likes: int = 0

    # Recent activity
    recent_posts: List[dict] = []
    recent_comments: List[dict] = []

    class Config:
        orm_mode = True
        use_enum_values = True


class LoginRequest(BaseModel):
    """Schema for user login requests."""
    email: EmailStr = Field(..., description="Email address")
    password: str = Field(..., description="Password")
    remember_me: bool = Field(default=False, description="Remember login session")

    class Config:
        schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "SecurePass123!",
                "remember_me": True
            }
        }


class LoginResponse(BaseModel):
    """Schema for login response with tokens."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse

    class Config:
        schema_extra = {
            "example": {
                "access_token": "eyJ0eXAiOiJKV1QiLCJhbGci...",
                "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGci...",
                "token_type": "bearer",
                "expires_in": 3600,
                "user": {
                    "id": 1,
                    "email": "user@example.com",
                    "full_name": "John Doe"
                }
            }
        }


class TokenRefresh(BaseModel):
    """Schema for token refresh requests."""
    refresh_token: str = Field(..., description="Refresh token")

    class Config:
        schema_extra = {
            "example": {
                "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGci..."
            }
        }


class UserStats(BaseModel):
    """Schema for user statistics."""
    total_users: int
    active_users: int
    verified_users: int
    new_users_today: int
    new_users_this_week: int
    new_users_this_month: int
    users_by_role: dict

    class Config:
        schema_extra = {
            "example": {
                "total_users": 1500,
                "active_users": 1200,
                "verified_users": 1100,
                "new_users_today": 5,
                "new_users_this_week": 25,
                "new_users_this_month": 120,
                "users_by_role": {
                    "user": 1400,
                    "moderator": 15,
                    "admin": 3,
                    "superuser": 1
                }
            }
        }


class UserAdminUpdate(BaseModel):
    """Schema for admin user updates."""
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None

    class Config:
        use_enum_values = True
        schema_extra = {
            "example": {
                "role": "moderator",
                "is_active": True,
                "is_verified": True
            }
        }