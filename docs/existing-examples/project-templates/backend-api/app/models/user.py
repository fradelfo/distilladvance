"""
User model with authentication, roles, and profile management.
Includes password hashing, role-based permissions, and audit fields.
"""

import enum
import time
from typing import Optional

from sqlalchemy import Column, Integer, String, Boolean, Float, Enum, Index
from sqlalchemy.orm import relationship
from passlib.context import CryptContext

from app.core.database import Base

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class UserRole(enum.Enum):
    """User role enumeration with hierarchical permissions."""
    USER = 1
    MODERATOR = 2
    ADMIN = 3
    SUPERUSER = 4

    def __str__(self):
        return self.name

    def __ge__(self, other):
        if self.__class__ is other.__class__:
            return self.value >= other.value
        return NotImplemented

    def __gt__(self, other):
        if self.__class__ is other.__class__:
            return self.value > other.value
        return NotImplemented

    def __le__(self, other):
        if self.__class__ is other.__class__:
            return self.value <= other.value
        return NotImplemented

    def __lt__(self, other):
        if self.__class__ is other.__class__:
            return self.value < other.value
        return NotImplemented


class User(Base):
    """
    User model with authentication and profile information.

    Features:
    - Secure password hashing with bcrypt
    - Role-based access control
    - Profile information management
    - Audit trail with timestamps
    - Account status management
    """
    __tablename__ = "users"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)

    # Authentication fields
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)

    # Profile information
    full_name = Column(String, nullable=False)
    bio = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)

    # Role and permissions
    role = Column(Enum(UserRole), default=UserRole.USER, nullable=False)

    # Account status
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)

    # Audit fields
    created_at = Column(Float, default=time.time, nullable=False)
    updated_at = Column(Float, default=time.time, onupdate=time.time, nullable=False)
    last_login_at = Column(Float, nullable=True)

    # Account verification
    verification_token = Column(String, nullable=True)
    verification_token_expires = Column(Float, nullable=True)

    # Password reset
    password_reset_token = Column(String, nullable=True)
    password_reset_expires = Column(Float, nullable=True)

    # Relationships
    posts = relationship("Post", back_populates="author", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="author", cascade="all, delete-orphan")

    # Database indexes for performance
    __table_args__ = (
        Index('ix_user_email_active', 'email', 'is_active'),
        Index('ix_user_role_active', 'role', 'is_active'),
        Index('ix_user_created_at', 'created_at'),
    )

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', role={self.role.name})>"

    def set_password(self, password: str) -> None:
        """Hash and set user password."""
        self.hashed_password = pwd_context.hash(password)

    def verify_password(self, password: str) -> bool:
        """Verify user password against stored hash."""
        return pwd_context.verify(password, self.hashed_password)

    def has_permission(self, required_role: UserRole) -> bool:
        """Check if user has required role permission."""
        return self.is_active and self.role >= required_role

    def is_admin(self) -> bool:
        """Check if user has admin privileges."""
        return self.has_permission(UserRole.ADMIN)

    def is_moderator(self) -> bool:
        """Check if user has moderator privileges."""
        return self.has_permission(UserRole.MODERATOR)

    def can_edit_user(self, target_user: 'User') -> bool:
        """Check if user can edit another user's profile."""
        if not self.is_active:
            return False

        # Users can edit their own profile
        if self.id == target_user.id:
            return True

        # Admins can edit any user
        if self.is_admin():
            return True

        # Moderators can edit regular users
        if self.is_moderator() and target_user.role == UserRole.USER:
            return True

        return False

    def can_delete_user(self, target_user: 'User') -> bool:
        """Check if user can delete another user."""
        if not self.is_active:
            return False

        # Only admins can delete users
        if not self.is_admin():
            return False

        # Cannot delete superuser accounts
        if target_user.role == UserRole.SUPERUSER:
            return False

        # Cannot delete yourself
        if self.id == target_user.id:
            return False

        return True

    def generate_verification_token(self) -> str:
        """Generate email verification token."""
        import secrets
        token = secrets.token_urlsafe(32)
        self.verification_token = token
        self.verification_token_expires = time.time() + 24 * 3600  # 24 hours
        return token

    def verify_email_token(self, token: str) -> bool:
        """Verify email verification token."""
        if not self.verification_token or not self.verification_token_expires:
            return False

        if time.time() > self.verification_token_expires:
            return False

        if self.verification_token != token:
            return False

        # Mark as verified and clear token
        self.is_verified = True
        self.verification_token = None
        self.verification_token_expires = None

        return True

    def generate_password_reset_token(self) -> str:
        """Generate password reset token."""
        import secrets
        token = secrets.token_urlsafe(32)
        self.password_reset_token = token
        self.password_reset_expires = time.time() + 3600  # 1 hour
        return token

    def verify_password_reset_token(self, token: str) -> bool:
        """Verify password reset token."""
        if not self.password_reset_token or not self.password_reset_expires:
            return False

        if time.time() > self.password_reset_expires:
            return False

        return self.password_reset_token == token

    def clear_password_reset_token(self) -> None:
        """Clear password reset token after use."""
        self.password_reset_token = None
        self.password_reset_expires = None

    def to_dict(self) -> dict:
        """Convert user to dictionary for serialization."""
        return {
            "id": self.id,
            "email": self.email,
            "full_name": self.full_name,
            "bio": self.bio,
            "avatar_url": self.avatar_url,
            "role": self.role.name,
            "is_active": self.is_active,
            "is_verified": self.is_verified,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "last_login_at": self.last_login_at
        }