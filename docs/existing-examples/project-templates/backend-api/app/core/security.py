"""
Security utilities for authentication, authorization, and cryptographic operations.
Handles JWT tokens, password hashing, rate limiting, and security headers.
"""

import secrets
import time
from datetime import datetime, timedelta
from typing import Any, Dict, Optional, Union

import jwt
from passlib.context import CryptContext
from passlib.hash import bcrypt

from app.core.config import get_settings

settings = get_settings()

# Password hashing context
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12,  # Increased rounds for better security
)


def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt.

    Args:
        password: Plain text password

    Returns:
        str: Hashed password

    Example:
        hashed = hash_password("my_password")
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash.

    Args:
        plain_password: Plain text password
        hashed_password: Bcrypt hashed password

    Returns:
        bool: True if password is correct, False otherwise

    Example:
        is_valid = verify_password("my_password", stored_hash)
    """
    return pwd_context.verify(plain_password, hashed_password)


def create_jwt_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT token with expiration.

    Args:
        data: Payload data to encode in token
        expires_delta: Token expiration time (default: settings.access_token_expire_minutes)

    Returns:
        str: Encoded JWT token

    Example:
        token = create_jwt_token({"sub": "user_id", "email": "user@example.com"})
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)

    # Add standard JWT claims
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "iss": settings.app_name,  # Issuer
        "aud": "api",  # Audience
    })

    return jwt.encode(
        to_encode,
        settings.secret_key.get_secret_value(),
        algorithm=settings.algorithm
    )


def verify_jwt_token(token: str) -> Dict[str, Any]:
    """
    Verify and decode a JWT token.

    Args:
        token: JWT token to verify

    Returns:
        Dict[str, Any]: Decoded token payload

    Raises:
        jwt.ExpiredSignatureError: Token has expired
        jwt.InvalidTokenError: Token is invalid

    Example:
        try:
            payload = verify_jwt_token(token)
            user_id = payload.get("sub")
        except jwt.InvalidTokenError:
            # Handle invalid token
            pass
    """
    return jwt.decode(
        token,
        settings.secret_key.get_secret_value(),
        algorithms=[settings.algorithm],
        audience="api",
        issuer=settings.app_name,
        options={
            "verify_exp": True,
            "verify_iat": True,
            "verify_iss": True,
            "verify_aud": True,
        }
    )


def create_refresh_token(user_id: str) -> str:
    """
    Create a refresh token for long-term authentication.

    Args:
        user_id: User identifier

    Returns:
        str: Refresh token

    Example:
        refresh_token = create_refresh_token("123")
    """
    return create_jwt_token(
        {"sub": user_id, "type": "refresh"},
        expires_delta=timedelta(days=settings.refresh_token_expire_days)
    )


def generate_secure_token(length: int = 32) -> str:
    """
    Generate a cryptographically secure random token.

    Args:
        length: Token length in bytes (default: 32)

    Returns:
        str: URL-safe base64 encoded token

    Example:
        reset_token = generate_secure_token()
    """
    return secrets.token_urlsafe(length)


def generate_api_key() -> str:
    """
    Generate a secure API key.

    Returns:
        str: API key in format "sk_" + random string

    Example:
        api_key = generate_api_key()
        # Returns: sk_abc123def456...
    """
    return f"sk_{secrets.token_urlsafe(32)}"


def validate_password_strength(password: str) -> tuple[bool, list[str]]:
    """
    Validate password strength according to security policy.

    Args:
        password: Password to validate

    Returns:
        tuple: (is_valid, list of error messages)

    Example:
        is_valid, errors = validate_password_strength("weak")
        if not is_valid:
            print(errors)  # ['Password must be at least 8 characters']
    """
    errors = []

    if len(password) < 8:
        errors.append("Password must be at least 8 characters long")

    if len(password) > 128:
        errors.append("Password must be less than 128 characters long")

    if not any(c.islower() for c in password):
        errors.append("Password must contain at least one lowercase letter")

    if not any(c.isupper() for c in password):
        errors.append("Password must contain at least one uppercase letter")

    if not any(c.isdigit() for c in password):
        errors.append("Password must contain at least one digit")

    if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
        errors.append("Password must contain at least one special character")

    # Check for common weak patterns
    weak_patterns = [
        "password", "123456", "qwerty", "admin", "letmein",
        "welcome", "monkey", "dragon", "master", "secret"
    ]

    for pattern in weak_patterns:
        if pattern.lower() in password.lower():
            errors.append(f"Password cannot contain common word: {pattern}")

    return len(errors) == 0, errors


def check_password_breach(password_hash: str) -> bool:
    """
    Check if password hash appears in known breach databases.
    This is a placeholder implementation - in production, integrate with HaveIBeenPwned API.

    Args:
        password_hash: SHA-1 hash of password

    Returns:
        bool: True if password is found in breach database

    Example:
        import hashlib
        password_sha1 = hashlib.sha1("password123".encode()).hexdigest().upper()
        is_breached = check_password_breach(password_sha1)
    """
    # TODO: Implement integration with HaveIBeenPwned API
    # For now, return False (no breach detected)
    return False


class SecurityHeaders:
    """Security headers for API responses."""

    @staticmethod
    def get_secure_headers() -> Dict[str, str]:
        """
        Get security headers for API responses.

        Returns:
            Dict[str, str]: Security headers

        Example:
            headers = SecurityHeaders.get_secure_headers()
        """
        return {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Content-Security-Policy": "default-src 'self'",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
        }


class TokenBlacklist:
    """
    JWT token blacklist for logout and security.
    In production, use Redis or database storage.
    """

    _blacklisted_tokens = set()

    @classmethod
    def add_token(cls, jti: str, exp: float) -> None:
        """
        Add token to blacklist.

        Args:
            jti: JWT ID (unique token identifier)
            exp: Token expiration timestamp
        """
        cls._blacklisted_tokens.add(jti)

        # Clean up expired tokens
        cls._cleanup_expired_tokens()

    @classmethod
    def is_blacklisted(cls, jti: str) -> bool:
        """
        Check if token is blacklisted.

        Args:
            jti: JWT ID to check

        Returns:
            bool: True if token is blacklisted
        """
        return jti in cls._blacklisted_tokens

    @classmethod
    def _cleanup_expired_tokens(cls) -> None:
        """Remove expired tokens from blacklist."""
        # In production, implement proper cleanup based on expiration times
        current_time = time.time()

        # For now, limit blacklist size to prevent memory issues
        if len(cls._blacklisted_tokens) > 10000:
            # Remove half of the tokens (in production, remove only expired ones)
            tokens_to_remove = list(cls._blacklisted_tokens)[:5000]
            for token in tokens_to_remove:
                cls._blacklisted_tokens.discard(token)


def create_session_token(user_id: str, device_info: Optional[Dict] = None) -> Dict[str, str]:
    """
    Create session token with device tracking.

    Args:
        user_id: User identifier
        device_info: Optional device information

    Returns:
        Dict[str, str]: Session tokens

    Example:
        tokens = create_session_token(
            "123",
            {"device": "iPhone", "location": "New York"}
        )
    """
    # Generate unique session ID
    session_id = generate_secure_token(16)

    # Create access token with session info
    access_token_data = {
        "sub": user_id,
        "session_id": session_id,
        "type": "access"
    }

    if device_info:
        access_token_data["device"] = device_info

    access_token = create_jwt_token(access_token_data)

    # Create refresh token
    refresh_token = create_jwt_token(
        {
            "sub": user_id,
            "session_id": session_id,
            "type": "refresh"
        },
        expires_delta=timedelta(days=settings.refresh_token_expire_days)
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "session_id": session_id,
        "token_type": "bearer",
        "expires_in": settings.access_token_expire_minutes * 60
    }


def validate_session_token(token: str, required_session_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Validate session token and check session ID.

    Args:
        token: JWT token to validate
        required_session_id: Expected session ID

    Returns:
        Dict[str, Any]: Token payload

    Raises:
        jwt.InvalidTokenError: Token is invalid or session mismatch
    """
    payload = verify_jwt_token(token)

    # Check session ID if provided
    if required_session_id and payload.get("session_id") != required_session_id:
        raise jwt.InvalidTokenError("Session ID mismatch")

    # Check if token is blacklisted
    token_jti = payload.get("jti")
    if token_jti and TokenBlacklist.is_blacklisted(token_jti):
        raise jwt.InvalidTokenError("Token has been revoked")

    return payload


def invalidate_all_user_sessions(user_id: str) -> None:
    """
    Invalidate all sessions for a user (used for security breaches).

    Args:
        user_id: User identifier

    Example:
        # After password change or security breach
        invalidate_all_user_sessions("123")
    """
    # In production, implement proper session tracking
    # For now, this is a placeholder
    pass


def create_csrf_token(session_id: str) -> str:
    """
    Create CSRF protection token.

    Args:
        session_id: Session identifier

    Returns:
        str: CSRF token

    Example:
        csrf_token = create_csrf_token("session_123")
    """
    data = {
        "session_id": session_id,
        "type": "csrf",
        "timestamp": time.time()
    }

    return create_jwt_token(data, expires_delta=timedelta(hours=1))


def verify_csrf_token(token: str, session_id: str) -> bool:
    """
    Verify CSRF token.

    Args:
        token: CSRF token to verify
        session_id: Expected session ID

    Returns:
        bool: True if token is valid

    Example:
        is_valid = verify_csrf_token(csrf_token, "session_123")
    """
    try:
        payload = verify_jwt_token(token)

        if payload.get("type") != "csrf":
            return False

        if payload.get("session_id") != session_id:
            return False

        return True

    except jwt.InvalidTokenError:
        return False