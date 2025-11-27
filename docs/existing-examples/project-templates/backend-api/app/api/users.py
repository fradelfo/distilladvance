"""
User management API endpoints.
Handles user registration, authentication, profile management, and administration.
"""

import time
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from fastapi.security import HTTPBearer
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_session
from app.core.security import (
    hash_password, verify_password, create_session_token,
    verify_jwt_token, generate_secure_token
)
from app.core.exceptions import (
    ValidationException, AuthenticationException, AuthorizationException,
    ResourceNotFoundException, ConflictException, business_rule_violation
)
from app.core.rate_limiting import RateLimiter, RateLimit, RateLimits
from app.models.user import User, UserRole
from app.schemas.user import (
    UserCreate, UserUpdate, UserResponse, UserListResponse, UserProfile,
    LoginRequest, LoginResponse, TokenRefresh, PasswordChange,
    PasswordReset, PasswordResetConfirm, EmailVerification,
    UserStats, UserAdminUpdate
)
from app.schemas.common import SuccessResponse, MessageResponse, PaginationParams

router = APIRouter(prefix="/users", tags=["users"])
security = HTTPBearer()
rate_limiter = RateLimiter()


async def get_current_user(
    token: str = Depends(security),
    session: AsyncSession = Depends(get_session)
) -> User:
    """Dependency to get current authenticated user."""
    try:
        payload = verify_jwt_token(token.credentials)
        user_id = payload.get("sub")

        if not user_id:
            raise AuthenticationException("Invalid token")

        stmt = select(User).where(User.id == int(user_id))
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()

        if not user:
            raise AuthenticationException("User not found")

        if not user.is_active:
            raise AuthenticationException("Account is inactive")

        # Update last seen
        user.last_login = time.time()
        await session.commit()

        return user

    except Exception as e:
        if isinstance(e, (AuthenticationException, AuthorizationException)):
            raise
        raise AuthenticationException("Invalid token")


async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to require admin privileges."""
    if current_user.role < UserRole.ADMIN:
        raise AuthorizationException("Admin privileges required")
    return current_user


async def require_moderator(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to require moderator or admin privileges."""
    if current_user.role < UserRole.MODERATOR:
        raise AuthorizationException("Moderator privileges required")
    return current_user


# Background tasks
async def send_verification_email(email: str, token: str):
    """Send email verification email."""
    # TODO: Implement email sending
    print(f"Sending verification email to {email} with token {token}")


async def send_password_reset_email(email: str, token: str):
    """Send password reset email."""
    # TODO: Implement email sending
    print(f"Sending password reset email to {email} with token {token}")


@router.post("/register", response_model=UserResponse, status_code=201)
async def register_user(
    user_data: UserCreate,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_session),
    client_ip: str = "127.0.0.1"
):
    """
    Register a new user account.

    - **email**: Valid email address (will be verified)
    - **password**: Secure password (8-128 characters)
    - **full_name**: User's full name
    - **accept_terms**: Must accept terms and conditions
    """
    # Rate limiting for registration
    await rate_limiter.check_rate_limit(
        f"register:{client_ip}",
        RateLimits.LOGIN_ATTEMPTS
    )

    # Check if email already exists
    stmt = select(User).where(User.email == user_data.email.lower())
    result = await session.execute(stmt)
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise ConflictException(
            "Email already registered",
            conflicting_field="email",
            conflicting_value=user_data.email
        )

    # Create user
    user = User(
        email=user_data.email.lower(),
        full_name=user_data.full_name,
        role=UserRole.USER,
        is_active=True,
        is_verified=False
    )
    user.set_password(user_data.password)

    # Generate verification token
    verification_token = generate_secure_token()
    user.email_verification_token = verification_token
    user.email_verification_expires = time.time() + 86400  # 24 hours

    session.add(user)
    await session.commit()
    await session.refresh(user)

    # Send verification email
    background_tasks.add_task(
        send_verification_email,
        user.email,
        verification_token
    )

    return UserResponse.from_orm(user)


@router.post("/login", response_model=LoginResponse)
async def login_user(
    login_data: LoginRequest,
    session: AsyncSession = Depends(get_session),
    client_ip: str = "127.0.0.1"
):
    """
    Authenticate user and return access tokens.

    - **email**: User's email address
    - **password**: User's password
    - **remember_me**: Extended session duration if true
    """
    # Rate limiting for login attempts
    await rate_limiter.check_rate_limit(
        f"login:{client_ip}",
        RateLimits.LOGIN_ATTEMPTS
    )

    # Find user
    stmt = select(User).where(User.email == login_data.email.lower())
    result = await session.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not user.verify_password(login_data.password):
        raise AuthenticationException("Invalid email or password")

    if not user.is_active:
        raise AuthenticationException("Account is inactive")

    # Update last login
    user.last_login = time.time()
    await session.commit()

    # Create session tokens
    device_info = {
        "ip": client_ip,
        "remember_me": login_data.remember_me
    }
    tokens = create_session_token(str(user.id), device_info)

    return LoginResponse(
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"],
        token_type="bearer",
        expires_in=tokens["expires_in"],
        user=UserResponse.from_orm(user)
    )


@router.post("/refresh", response_model=LoginResponse)
async def refresh_token(
    token_data: TokenRefresh,
    session: AsyncSession = Depends(get_session)
):
    """Refresh access token using refresh token."""
    try:
        payload = verify_jwt_token(token_data.refresh_token)

        if payload.get("type") != "refresh":
            raise AuthenticationException("Invalid refresh token")

        user_id = payload.get("sub")
        stmt = select(User).where(User.id == int(user_id))
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()

        if not user or not user.is_active:
            raise AuthenticationException("User not found or inactive")

        # Create new session tokens
        tokens = create_session_token(str(user.id))

        return LoginResponse(
            access_token=tokens["access_token"],
            refresh_token=tokens["refresh_token"],
            token_type="bearer",
            expires_in=tokens["expires_in"],
            user=UserResponse.from_orm(user)
        )

    except Exception:
        raise AuthenticationException("Invalid refresh token")


@router.get("/me", response_model=UserProfile)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Get current user's profile with extended information."""
    # Load user with relationships
    stmt = (
        select(User)
        .where(User.id == current_user.id)
        .options(
            selectinload(User.posts),
            selectinload(User.comments)
        )
    )
    result = await session.execute(stmt)
    user = result.scalar_one()

    # Calculate stats
    user.post_count = len(user.posts)
    user.comment_count = len(user.comments)

    # Recent activity
    recent_posts = sorted(user.posts, key=lambda x: x.created_at, reverse=True)[:5]
    recent_comments = sorted(user.comments, key=lambda x: x.created_at, reverse=True)[:10]

    profile_data = user.to_dict()
    profile_data.update({
        "recent_posts": [post.to_dict() for post in recent_posts],
        "recent_comments": [comment.to_dict() for comment in recent_comments]
    })

    return UserProfile(**profile_data)


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Update current user's profile information."""
    # Update provided fields
    for field, value in user_data.dict(exclude_unset=True).items():
        setattr(current_user, field, value)

    current_user.updated_at = time.time()
    await session.commit()
    await session.refresh(current_user)

    return UserResponse.from_orm(current_user)


@router.post("/change-password", response_model=MessageResponse)
async def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Change current user's password."""
    # Verify current password
    if not current_user.verify_password(password_data.current_password):
        raise AuthenticationException("Current password is incorrect")

    # Validate new password strength
    from app.core.security import validate_password_strength
    is_valid, errors = validate_password_strength(password_data.new_password)

    if not is_valid:
        raise ValidationException(
            "Password does not meet security requirements",
            details={"password_errors": errors}
        )

    # Update password
    current_user.set_password(password_data.new_password)
    current_user.updated_at = time.time()
    await session.commit()

    return MessageResponse(message="Password updated successfully")


@router.post("/request-password-reset", response_model=MessageResponse)
async def request_password_reset(
    reset_data: PasswordReset,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_session),
    client_ip: str = "127.0.0.1"
):
    """Request password reset email."""
    # Rate limiting for password reset requests
    await rate_limiter.check_rate_limit(
        f"password_reset:{client_ip}",
        RateLimits.PASSWORD_RESET
    )

    # Find user
    stmt = select(User).where(User.email == reset_data.email.lower())
    result = await session.execute(stmt)
    user = result.scalar_one_or_none()

    if user and user.is_active:
        # Generate reset token
        reset_token = generate_secure_token()
        user.password_reset_token = reset_token
        user.password_reset_expires = time.time() + 3600  # 1 hour

        await session.commit()

        # Send reset email
        background_tasks.add_task(
            send_password_reset_email,
            user.email,
            reset_token
        )

    # Always return success for security
    return MessageResponse(message="If email exists, password reset instructions sent")


@router.get("", response_model=UserListResponse)
async def list_users(
    pagination: PaginationParams = Depends(),
    role: Optional[UserRole] = Query(None, description="Filter by role"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    search: Optional[str] = Query(None, description="Search in name and email"),
    current_user: User = Depends(require_moderator),
    session: AsyncSession = Depends(get_session)
):
    """List users with pagination and filtering (moderator required)."""
    # Build query
    stmt = select(User)
    count_stmt = select(func.count(User.id))

    # Apply filters
    filters = []
    if role is not None:
        filters.append(User.role == role)
    if is_active is not None:
        filters.append(User.is_active == is_active)
    if search:
        search_filter = or_(
            User.full_name.ilike(f"%{search}%"),
            User.email.ilike(f"%{search}%")
        )
        filters.append(search_filter)

    if filters:
        stmt = stmt.where(and_(*filters))
        count_stmt = count_stmt.where(and_(*filters))

    # Get total count
    count_result = await session.execute(count_stmt)
    total = count_result.scalar()

    # Apply pagination and sorting
    stmt = (
        stmt
        .order_by(User.created_at.desc())
        .offset(pagination.offset)
        .limit(pagination.size)
    )

    # Execute query
    result = await session.execute(stmt)
    users = result.scalars().all()

    return UserListResponse(
        users=[UserResponse.from_orm(user) for user in users],
        total=total,
        page=pagination.page,
        size=pagination.size,
        pages=(total + pagination.size - 1) // pagination.size
    )


@router.get("/stats", response_model=UserStats)
async def get_user_stats(
    current_user: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session)
):
    """Get user statistics (admin only)."""
    current_time = time.time()

    # Total users
    total_stmt = select(func.count(User.id))
    total_result = await session.execute(total_stmt)
    total_users = total_result.scalar()

    # Active users
    active_stmt = select(func.count(User.id)).where(User.is_active == True)
    active_result = await session.execute(active_stmt)
    active_users = active_result.scalar()

    # Verified users
    verified_stmt = select(func.count(User.id)).where(User.is_verified == True)
    verified_result = await session.execute(verified_stmt)
    verified_users = verified_result.scalar()

    # New users (time periods)
    day_ago = current_time - 86400
    week_ago = current_time - 604800
    month_ago = current_time - 2592000

    new_today_stmt = select(func.count(User.id)).where(User.created_at >= day_ago)
    new_today_result = await session.execute(new_today_stmt)
    new_users_today = new_today_result.scalar()

    new_week_stmt = select(func.count(User.id)).where(User.created_at >= week_ago)
    new_week_result = await session.execute(new_week_stmt)
    new_users_this_week = new_week_result.scalar()

    new_month_stmt = select(func.count(User.id)).where(User.created_at >= month_ago)
    new_month_result = await session.execute(new_month_stmt)
    new_users_this_month = new_month_result.scalar()

    # Users by role
    role_stmt = select(User.role, func.count(User.id)).group_by(User.role)
    role_result = await session.execute(role_stmt)
    users_by_role = {role.value: count for role, count in role_result}

    return UserStats(
        total_users=total_users,
        active_users=active_users,
        verified_users=verified_users,
        new_users_today=new_users_today,
        new_users_this_week=new_users_this_week,
        new_users_this_month=new_users_this_month,
        users_by_role=users_by_role
    )


@router.get("/{user_id}", response_model=UserProfile)
async def get_user_by_id(
    user_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Get user profile by ID."""
    # Check permissions - users can view their own profile,
    # moderators can view any profile
    if user_id != current_user.id and current_user.role < UserRole.MODERATOR:
        raise AuthorizationException("Not authorized to view this profile")

    stmt = (
        select(User)
        .where(User.id == user_id)
        .options(
            selectinload(User.posts),
            selectinload(User.comments)
        )
    )
    result = await session.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise ResourceNotFoundException("User not found", "user", user_id)

    # Calculate stats and prepare profile
    user.post_count = len(user.posts)
    user.comment_count = len(user.comments)

    profile_data = user.to_dict()

    # Only include recent activity for own profile or moderators
    if user_id == current_user.id or current_user.role >= UserRole.MODERATOR:
        recent_posts = sorted(user.posts, key=lambda x: x.created_at, reverse=True)[:5]
        recent_comments = sorted(user.comments, key=lambda x: x.created_at, reverse=True)[:10]

        profile_data.update({
            "recent_posts": [post.to_dict() for post in recent_posts],
            "recent_comments": [comment.to_dict() for comment in recent_comments]
        })

    return UserProfile(**profile_data)


@router.put("/{user_id}/admin", response_model=UserResponse)
async def admin_update_user(
    user_id: int,
    update_data: UserAdminUpdate,
    current_user: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session)
):
    """Update user (admin only) - can modify role, active status, etc."""
    stmt = select(User).where(User.id == user_id)
    result = await session.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise ResourceNotFoundException("User not found", "user", user_id)

    # Prevent self-demotion
    if user_id == current_user.id and update_data.role and update_data.role < current_user.role:
        raise business_rule_violation(
            "self_demotion",
            "Cannot demote your own account"
        )

    # Update provided fields
    for field, value in update_data.dict(exclude_unset=True).items():
        setattr(user, field, value)

    user.updated_at = time.time()
    await session.commit()
    await session.refresh(user)

    return UserResponse.from_orm(user)


@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session)
):
    """Delete user account (admin only)."""
    stmt = select(User).where(User.id == user_id)
    result = await session.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise ResourceNotFoundException("User not found", "user", user_id)

    # Prevent self-deletion
    if user_id == current_user.id:
        raise business_rule_violation(
            "self_deletion",
            "Cannot delete your own account"
        )

    # Soft delete by deactivating
    user.is_active = False
    user.updated_at = time.time()
    await session.commit()

    return MessageResponse(message="User account deactivated successfully")