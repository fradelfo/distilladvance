"""
FastAPI Production Application
Complete backend API implementation with authentication, database, security, and monitoring.
"""

import logging
import time
from contextlib import asynccontextmanager
from typing import List, Optional

import uvicorn
from fastapi import FastAPI, Depends, HTTPException, status, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select, and_, or_
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
import structlog

from app.core.config import get_settings
from app.core.database import get_session, init_db
from app.core.security import verify_jwt_token, hash_password, create_jwt_token
from app.core.rate_limiting import RateLimiter
from app.models.user import User, UserRole
from app.models.post import Post, Comment, PostStatus
from app.schemas.user import UserCreate, UserResponse, UserUpdate, LoginRequest
from app.schemas.post import PostCreate, PostResponse, PostUpdate, CommentCreate, CommentResponse
from app.schemas.auth import TokenResponse, RefreshTokenRequest
from app.core.exceptions import (
    ValidationException,
    AuthenticationException,
    AuthorizationException,
    ResourceNotFoundException
)

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# Prometheus metrics
REQUEST_COUNT = Counter('fastapi_requests_total', 'Total requests', ['method', 'endpoint', 'status'])
REQUEST_DURATION = Histogram('fastapi_request_duration_seconds', 'Request duration', ['method', 'endpoint'])
AUTH_ATTEMPTS = Counter('auth_attempts_total', 'Authentication attempts', ['status'])
DATABASE_OPERATIONS = Counter('database_operations_total', 'Database operations', ['operation', 'table'])

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup and shutdown events."""
    logger.info("Starting up FastAPI application")

    # Initialize database
    await init_db()

    # Additional startup tasks
    logger.info("Database initialized successfully")

    yield

    # Shutdown tasks
    logger.info("Shutting down FastAPI application")


# Create FastAPI application with security configurations
app = FastAPI(
    title="Production FastAPI Backend",
    description="Complete backend API with authentication, database, and security features",
    version="1.0.0",
    docs_url="/docs" if settings.environment != "production" else None,
    redoc_url="/redoc" if settings.environment != "production" else None,
    lifespan=lifespan
)

# Security middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.allowed_hosts
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["*"],
)

# Rate limiting
rate_limiter = RateLimiter(redis_url=settings.redis_url)
security = HTTPBearer(auto_error=False)


# Middleware for metrics and logging
@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    """Collect metrics and structured logging for all requests."""
    start_time = time.time()

    # Extract request info
    method = request.method
    path = request.url.path
    client_ip = request.client.host if request.client else "unknown"

    # Start structured logging context
    logger.bind(
        method=method,
        path=path,
        client_ip=client_ip,
        user_agent=request.headers.get("user-agent", "unknown")
    )

    try:
        # Rate limiting
        await rate_limiter.check_rate_limit(client_ip)

        # Process request
        response = await call_next(request)

        # Calculate metrics
        duration = time.time() - start_time
        status_code = response.status_code

        # Record metrics
        REQUEST_COUNT.labels(method=method, endpoint=path, status=status_code).inc()
        REQUEST_DURATION.labels(method=method, endpoint=path).observe(duration)

        # Log request completion
        logger.info(
            "Request completed",
            status_code=status_code,
            duration=duration,
            content_length=response.headers.get("content-length", 0)
        )

        return response

    except Exception as e:
        # Log errors
        logger.error(
            "Request failed",
            error=str(e),
            duration=time.time() - start_time,
            exc_info=True
        )

        REQUEST_COUNT.labels(method=method, endpoint=path, status=500).inc()
        raise


# Authentication dependency
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: AsyncSession = Depends(get_session)
) -> User:
    """Get current authenticated user from JWT token."""
    if not credentials:
        raise AuthenticationException("Authentication required")

    try:
        payload = verify_jwt_token(credentials.credentials)
        user_id = payload.get("sub")

        if not user_id:
            raise AuthenticationException("Invalid token")

        # Fetch user from database
        result = await session.execute(
            select(User).where(User.id == int(user_id), User.is_active == True)
        )
        user = result.scalar_one_or_none()

        if not user:
            AUTH_ATTEMPTS.labels(status="invalid_user").inc()
            raise AuthenticationException("User not found")

        AUTH_ATTEMPTS.labels(status="success").inc()
        DATABASE_OPERATIONS.labels(operation="select", table="users").inc()

        return user

    except Exception as e:
        AUTH_ATTEMPTS.labels(status="error").inc()
        logger.error("Authentication failed", error=str(e))
        raise AuthenticationException("Invalid authentication credentials")


# Authorization dependency
def require_role(required_role: UserRole):
    """Dependency factory to require specific user roles."""
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role.value < required_role.value:
            raise AuthorizationException(f"Role {required_role.name} required")
        return current_user
    return role_checker


# Health and monitoring endpoints
@app.get("/health")
async def health_check():
    """Health check endpoint for load balancers and monitoring."""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "version": "1.0.0",
        "environment": settings.environment
    }


@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint."""
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


# Authentication endpoints
@app.post("/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    user_data: UserCreate,
    session: AsyncSession = Depends(get_session)
):
    """Register a new user account."""
    logger.info("User registration attempt", email=user_data.email)

    # Check if user already exists
    result = await session.execute(
        select(User).where(User.email == user_data.email)
    )
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise ValidationException("Email already registered")

    # Create new user
    hashed_password = hash_password(user_data.password)
    new_user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=hashed_password,
        role=UserRole.USER,
        is_active=True
    )

    session.add(new_user)
    await session.commit()
    await session.refresh(new_user)

    DATABASE_OPERATIONS.labels(operation="insert", table="users").inc()

    logger.info("User registered successfully", user_id=new_user.id, email=new_user.email)

    return UserResponse.from_orm(new_user)


@app.post("/auth/login", response_model=TokenResponse)
async def login_user(
    login_data: LoginRequest,
    session: AsyncSession = Depends(get_session)
):
    """Authenticate user and return JWT token."""
    logger.info("Login attempt", email=login_data.email)

    # Find user by email
    result = await session.execute(
        select(User).where(
            and_(
                User.email == login_data.email,
                User.is_active == True
            )
        )
    )
    user = result.scalar_one_or_none()

    if not user or not user.verify_password(login_data.password):
        AUTH_ATTEMPTS.labels(status="failed").inc()
        raise AuthenticationException("Invalid email or password")

    # Generate JWT token
    access_token = create_jwt_token({"sub": str(user.id), "email": user.email})
    refresh_token = create_jwt_token(
        {"sub": str(user.id), "type": "refresh"},
        expires_delta=settings.refresh_token_expire_days
    )

    # Update last login
    user.last_login_at = time.time()
    await session.commit()

    DATABASE_OPERATIONS.labels(operation="update", table="users").inc()
    AUTH_ATTEMPTS.labels(status="success").inc()

    logger.info("User logged in successfully", user_id=user.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.access_token_expire_minutes * 60
    )


@app.post("/auth/refresh", response_model=TokenResponse)
async def refresh_token(
    refresh_data: RefreshTokenRequest,
    session: AsyncSession = Depends(get_session)
):
    """Refresh access token using refresh token."""
    try:
        payload = verify_jwt_token(refresh_data.refresh_token)

        if payload.get("type") != "refresh":
            raise AuthenticationException("Invalid refresh token")

        user_id = payload.get("sub")
        result = await session.execute(
            select(User).where(User.id == int(user_id), User.is_active == True)
        )
        user = result.scalar_one_or_none()

        if not user:
            raise AuthenticationException("User not found")

        # Generate new access token
        new_access_token = create_jwt_token({"sub": str(user.id), "email": user.email})

        return TokenResponse(
            access_token=new_access_token,
            token_type="bearer",
            expires_in=settings.access_token_expire_minutes * 60
        )

    except Exception as e:
        logger.error("Token refresh failed", error=str(e))
        raise AuthenticationException("Invalid refresh token")


# User management endpoints
@app.get("/users/me", response_model=UserResponse)
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Get current user's profile information."""
    return UserResponse.from_orm(current_user)


@app.put("/users/me", response_model=UserResponse)
async def update_current_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Update current user's profile information."""
    logger.info("User profile update", user_id=current_user.id)

    # Update user fields
    for field, value in user_update.dict(exclude_unset=True).items():
        setattr(current_user, field, value)

    current_user.updated_at = time.time()
    await session.commit()
    await session.refresh(current_user)

    DATABASE_OPERATIONS.labels(operation="update", table="users").inc()

    logger.info("User profile updated successfully", user_id=current_user.id)

    return UserResponse.from_orm(current_user)


@app.get("/users", response_model=List[UserResponse])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    session: AsyncSession = Depends(get_session)
):
    """List all users (admin only)."""
    result = await session.execute(
        select(User)
        .where(User.is_active == True)
        .offset(skip)
        .limit(limit)
        .order_by(User.created_at.desc())
    )
    users = result.scalars().all()

    DATABASE_OPERATIONS.labels(operation="select", table="users").inc()

    return [UserResponse.from_orm(user) for user in users]


# Post management endpoints
@app.post("/posts", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    post_data: PostCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Create a new blog post."""
    logger.info("Creating new post", user_id=current_user.id, title=post_data.title)

    new_post = Post(
        title=post_data.title,
        content=post_data.content,
        excerpt=post_data.content[:200] + "..." if len(post_data.content) > 200 else post_data.content,
        author_id=current_user.id,
        status=PostStatus.DRAFT,
        tags=post_data.tags or []
    )

    session.add(new_post)
    await session.commit()
    await session.refresh(new_post)

    DATABASE_OPERATIONS.labels(operation="insert", table="posts").inc()

    logger.info("Post created successfully", post_id=new_post.id)

    return PostResponse.from_orm(new_post)


@app.get("/posts", response_model=List[PostResponse])
async def list_posts(
    skip: int = 0,
    limit: int = 20,
    status_filter: Optional[PostStatus] = None,
    author_id: Optional[int] = None,
    session: AsyncSession = Depends(get_session)
):
    """List published posts with pagination and filtering."""
    query = select(Post).options(selectinload(Post.author))

    # Apply filters
    filters = [Post.status == PostStatus.PUBLISHED]
    if status_filter:
        filters = [Post.status == status_filter]
    if author_id:
        filters.append(Post.author_id == author_id)

    result = await session.execute(
        query.where(and_(*filters))
        .offset(skip)
        .limit(limit)
        .order_by(Post.published_at.desc())
    )
    posts = result.scalars().all()

    DATABASE_OPERATIONS.labels(operation="select", table="posts").inc()

    return [PostResponse.from_orm(post) for post in posts]


@app.get("/posts/{post_id}", response_model=PostResponse)
async def get_post(
    post_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Get a specific post by ID."""
    result = await session.execute(
        select(Post)
        .options(selectinload(Post.author), selectinload(Post.comments))
        .where(Post.id == post_id)
    )
    post = result.scalar_one_or_none()

    if not post:
        raise ResourceNotFoundException("Post not found")

    # Check if user can view this post
    if post.status != PostStatus.PUBLISHED:
        if not current_user or (current_user.id != post.author_id and current_user.role != UserRole.ADMIN):
            raise AuthorizationException("Access denied")

    # Increment view count
    post.view_count += 1
    await session.commit()

    DATABASE_OPERATIONS.labels(operation="select", table="posts").inc()
    DATABASE_OPERATIONS.labels(operation="update", table="posts").inc()

    return PostResponse.from_orm(post)


@app.put("/posts/{post_id}", response_model=PostResponse)
async def update_post(
    post_id: int,
    post_update: PostUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Update a post (author only)."""
    result = await session.execute(select(Post).where(Post.id == post_id))
    post = result.scalar_one_or_none()

    if not post:
        raise ResourceNotFoundException("Post not found")

    # Check ownership or admin privilege
    if current_user.id != post.author_id and current_user.role != UserRole.ADMIN:
        raise AuthorizationException("Access denied")

    # Update post fields
    for field, value in post_update.dict(exclude_unset=True).items():
        setattr(post, field, value)

    post.updated_at = time.time()

    # Set published_at when status changes to published
    if post_update.status == PostStatus.PUBLISHED and not post.published_at:
        post.published_at = time.time()

    await session.commit()
    await session.refresh(post)

    DATABASE_OPERATIONS.labels(operation="update", table="posts").inc()

    logger.info("Post updated successfully", post_id=post.id, user_id=current_user.id)

    return PostResponse.from_orm(post)


@app.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Delete a post (author or admin only)."""
    result = await session.execute(select(Post).where(Post.id == post_id))
    post = result.scalar_one_or_none()

    if not post:
        raise ResourceNotFoundException("Post not found")

    # Check ownership or admin privilege
    if current_user.id != post.author_id and current_user.role != UserRole.ADMIN:
        raise AuthorizationException("Access denied")

    await session.delete(post)
    await session.commit()

    DATABASE_OPERATIONS.labels(operation="delete", table="posts").inc()

    logger.info("Post deleted successfully", post_id=post_id, user_id=current_user.id)


# Comment management endpoints
@app.post("/posts/{post_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def create_comment(
    post_id: int,
    comment_data: CommentCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Add a comment to a post."""
    # Verify post exists and is published
    result = await session.execute(
        select(Post).where(and_(Post.id == post_id, Post.status == PostStatus.PUBLISHED))
    )
    post = result.scalar_one_or_none()

    if not post:
        raise ResourceNotFoundException("Post not found or not published")

    new_comment = Comment(
        content=comment_data.content,
        post_id=post_id,
        author_id=current_user.id
    )

    session.add(new_comment)
    await session.commit()
    await session.refresh(new_comment)

    # Update post comment count
    post.comment_count += 1
    await session.commit()

    DATABASE_OPERATIONS.labels(operation="insert", table="comments").inc()
    DATABASE_OPERATIONS.labels(operation="update", table="posts").inc()

    logger.info("Comment created successfully", comment_id=new_comment.id, post_id=post_id)

    return CommentResponse.from_orm(new_comment)


# Error handlers
@app.exception_handler(ValidationException)
async def validation_exception_handler(request: Request, exc: ValidationException):
    logger.warning("Validation error", error=str(exc), path=request.url.path)
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": str(exc), "type": "validation_error"}
    )


@app.exception_handler(AuthenticationException)
async def authentication_exception_handler(request: Request, exc: AuthenticationException):
    logger.warning("Authentication error", error=str(exc), path=request.url.path)
    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={"detail": str(exc), "type": "authentication_error"}
    )


@app.exception_handler(AuthorizationException)
async def authorization_exception_handler(request: Request, exc: AuthorizationException):
    logger.warning("Authorization error", error=str(exc), path=request.url.path)
    return JSONResponse(
        status_code=status.HTTP_403_FORBIDDEN,
        content={"detail": str(exc), "type": "authorization_error"}
    )


@app.exception_handler(ResourceNotFoundException)
async def not_found_exception_handler(request: Request, exc: ResourceNotFoundException):
    logger.warning("Resource not found", error=str(exc), path=request.url.path)
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"detail": str(exc), "type": "not_found_error"}
    )


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.environment == "development",
        access_log=True,
        log_config={
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "default": {
                    "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
                },
            },
            "handlers": {
                "default": {
                    "formatter": "default",
                    "class": "logging.StreamHandler",
                    "stream": "ext://sys.stdout",
                },
            },
            "root": {
                "level": "INFO",
                "handlers": ["default"],
            },
        }
    )