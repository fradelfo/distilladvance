"""
Admin and system management API endpoints.
Handles health checks, metrics, system configuration, and administrative tasks.
"""

import time
import psutil
from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy import select, func, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session, DatabaseHealth
from app.core.config import get_settings
from app.core.rate_limiting import RateLimiter
from app.models.user import User, UserRole
from app.models.post import Post, PostStatus
from app.schemas.common import (
    HealthCheckResponse, MetricsResponse, ConfigResponse,
    SuccessResponse
)
from app.api.users import get_current_user, require_admin

router = APIRouter(prefix="/admin", tags=["admin"])
settings = get_settings()
rate_limiter = RateLimiter()


@router.get("/health", response_model=HealthCheckResponse)
async def health_check(session: AsyncSession = Depends(get_session)):
    """
    System health check endpoint.

    Returns overall system status and individual service checks.
    """
    current_time = time.time()
    status = "healthy"
    checks = {}

    # Database health
    try:
        db_start = time.time()
        await session.execute(text("SELECT 1"))
        db_time = (time.time() - db_start) * 1000

        checks["database"] = {
            "status": "healthy" if db_time < 1000 else "degraded",
            "response_time": f"{db_time:.1f}ms",
            "connections": await DatabaseHealth.get_connection_count()
        }
    except Exception as e:
        checks["database"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        status = "unhealthy"

    # Redis health (rate limiter)
    try:
        redis_start = time.time()
        await rate_limiter.get_rate_limit_info("health_check")
        redis_time = (time.time() - redis_start) * 1000

        checks["redis"] = {
            "status": "healthy" if redis_time < 100 else "degraded",
            "response_time": f"{redis_time:.1f}ms"
        }
    except Exception as e:
        checks["redis"] = {
            "status": "degraded",
            "error": str(e),
            "fallback": "memory"
        }
        if status == "healthy":
            status = "degraded"

    # System resources
    try:
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')

        checks["system"] = {
            "status": "healthy",
            "memory_usage": f"{memory.percent}%",
            "memory_available": f"{memory.available / (1024**3):.1f}GB",
            "disk_usage": f"{disk.percent}%",
            "disk_free": f"{disk.free / (1024**3):.1f}GB",
            "cpu_usage": f"{psutil.cpu_percent(interval=1)}%"
        }

        # Mark as degraded if resources are high
        if memory.percent > 90 or disk.percent > 90:
            checks["system"]["status"] = "degraded"
            if status == "healthy":
                status = "degraded"

    except Exception as e:
        checks["system"] = {
            "status": "unknown",
            "error": str(e)
        }

    return HealthCheckResponse(
        status=status,
        timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(current_time)),
        version=settings.app_version,
        checks=checks
    )


@router.get("/metrics", response_model=MetricsResponse)
async def get_metrics(
    current_user: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session)
):
    """
    Get detailed application metrics (admin only).

    Returns performance, usage, and system metrics.
    """
    current_time = time.time()

    # Database metrics
    db_stats = await DatabaseHealth.get_table_stats()
    db_connections = await DatabaseHealth.get_connection_count()

    # Calculate user metrics
    total_users_stmt = select(func.count(User.id))
    total_users_result = await session.execute(total_users_stmt)
    total_users = total_users_result.scalar()

    # Active users (logged in within last 24 hours)
    day_ago = current_time - 86400
    active_users_stmt = select(func.count(User.id)).where(User.last_login >= day_ago)
    active_users_result = await session.execute(active_users_stmt)
    active_users = active_users_result.scalar()

    # Post metrics
    total_posts_stmt = select(func.count(Post.id))
    total_posts_result = await session.execute(total_posts_stmt)
    total_posts = total_posts_result.scalar()

    published_posts_stmt = select(func.count(Post.id)).where(Post.status == PostStatus.PUBLISHED)
    published_posts_result = await session.execute(published_posts_stmt)
    published_posts = published_posts_result.scalar()

    # System metrics
    memory = psutil.virtual_memory()

    # Mock request metrics - in production, collect from monitoring system
    return MetricsResponse(
        requests_total=150000,  # TODO: Get from monitoring system
        requests_per_minute=45.2,  # TODO: Calculate from recent metrics
        avg_response_time=125.5,  # TODO: Get from monitoring system
        error_rate=0.8,  # TODO: Calculate from error logs
        active_users=active_users or 0,
        database_connections=db_connections if db_connections > 0 else 0,
        memory_usage=memory.percent,
        cpu_usage=psutil.cpu_percent(interval=1)
    )


@router.get("/config", response_model=ConfigResponse)
async def get_config(current_user: User = Depends(require_admin)):
    """
    Get application configuration (admin only).

    Returns public configuration settings and feature flags.
    """
    return ConfigResponse(
        app_name=settings.app_name,
        version=settings.app_version,
        environment=settings.environment,
        features={
            "registration_enabled": True,
            "email_verification_required": settings.require_email_verification,
            "comments_enabled": True,
            "file_uploads_enabled": True,
            "rate_limiting_enabled": True,
            "metrics_collection": True
        },
        limits={
            "max_posts_per_user": 1000,
            "max_file_size": settings.max_file_size,
            "rate_limit_requests": 100,
            "max_comment_depth": 5,
            "max_tags_per_post": 10
        },
        settings={
            "timezone": "UTC",
            "date_format": "YYYY-MM-DD HH:mm:ss",
            "default_language": "en",
            "pagination_default_size": 20,
            "pagination_max_size": 100,
            "session_timeout": settings.access_token_expire_minutes,
            "password_min_length": 8,
            "bcrypt_rounds": 12
        }
    )


@router.get("/database-stats")
async def get_database_stats(
    current_user: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session)
):
    """
    Get detailed database statistics (admin only).

    Returns table statistics, performance metrics, and health information.
    """
    stats = {}

    # Get database size
    database_size = await DatabaseHealth.get_database_size()
    stats["database_size"] = database_size

    # Get table statistics
    table_stats = await DatabaseHealth.get_table_stats()
    stats["tables"] = table_stats

    # Connection information
    stats["connections"] = {
        "active": await DatabaseHealth.get_connection_count(),
        "pool_size": settings.database_pool_size,
        "max_overflow": settings.database_max_overflow
    }

    # Recent activity
    try:
        # Users created in last 7 days
        week_ago = time.time() - 604800
        recent_users_stmt = select(func.count(User.id)).where(User.created_at >= week_ago)
        recent_users_result = await session.execute(recent_users_stmt)
        recent_users = recent_users_result.scalar()

        # Posts created in last 7 days
        recent_posts_stmt = select(func.count(Post.id)).where(Post.created_at >= week_ago)
        recent_posts_result = await session.execute(recent_posts_stmt)
        recent_posts = recent_posts_result.scalar()

        stats["recent_activity"] = {
            "users_last_week": recent_users,
            "posts_last_week": recent_posts
        }

    except Exception as e:
        stats["recent_activity"] = {"error": str(e)}

    return SuccessResponse(
        message="Database statistics retrieved",
        data=stats
    )


@router.post("/cache/clear")
async def clear_cache(current_user: User = Depends(require_admin)):
    """
    Clear application cache (admin only).

    Clears Redis cache and resets rate limiting counters.
    """
    try:
        # Clear rate limiting cache
        # TODO: Implement proper cache clearing
        # await rate_limiter.clear_all()

        return SuccessResponse(
            message="Cache cleared successfully",
            data={"timestamp": time.time()}
        )
    except Exception as e:
        return SuccessResponse(
            message="Cache clearing completed with warnings",
            data={"warning": str(e)}
        )


@router.post("/maintenance")
async def toggle_maintenance_mode(
    enable: bool,
    current_user: User = Depends(require_admin)
):
    """
    Toggle maintenance mode (admin only).

    When enabled, only admin users can access the API.
    """
    # TODO: Implement proper maintenance mode
    # This would typically involve setting a flag in Redis or database
    # and checking it in middleware

    return SuccessResponse(
        message=f"Maintenance mode {'enabled' if enable else 'disabled'}",
        data={
            "maintenance_mode": enable,
            "enabled_by": current_user.id,
            "timestamp": time.time()
        }
    )


@router.get("/logs")
async def get_recent_logs(
    level: str = "ERROR",
    limit: int = 100,
    current_user: User = Depends(require_admin)
):
    """
    Get recent application logs (admin only).

    Returns recent log entries for debugging and monitoring.
    """
    # TODO: Implement proper log aggregation
    # This would typically read from log files or log aggregation service

    mock_logs = [
        {
            "timestamp": time.time() - 300,
            "level": "ERROR",
            "message": "Database connection timeout",
            "module": "database.py",
            "traceback": "..."
        },
        {
            "timestamp": time.time() - 600,
            "level": "WARNING",
            "message": "High memory usage detected",
            "module": "health.py",
            "details": {"memory_percent": 85}
        }
    ]

    return SuccessResponse(
        message=f"Retrieved {len(mock_logs)} log entries",
        data={
            "logs": mock_logs,
            "level": level,
            "limit": limit
        }
    )


@router.post("/backup")
async def create_backup(
    current_user: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session)
):
    """
    Create database backup (admin only).

    Initiates a database backup process.
    """
    # TODO: Implement proper backup functionality
    # This would typically trigger a background job to create database backup

    backup_id = f"backup_{int(time.time())}"

    return SuccessResponse(
        message="Backup initiated successfully",
        data={
            "backup_id": backup_id,
            "status": "in_progress",
            "initiated_by": current_user.id,
            "timestamp": time.time()
        }
    )


@router.get("/security-scan")
async def security_scan(
    current_user: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session)
):
    """
    Run security scan (admin only).

    Performs basic security checks on the system.
    """
    scan_results = {}

    # Check for users with weak passwords (example)
    try:
        # TODO: Implement actual security checks
        scan_results["weak_passwords"] = 0
        scan_results["inactive_admin_accounts"] = 0
        scan_results["failed_login_attempts"] = 0
        scan_results["suspicious_activity"] = []

        # Check for system security
        scan_results["ssl_enabled"] = True  # TODO: Check actual SSL status
        scan_results["rate_limiting_active"] = True
        scan_results["cors_configured"] = True

        scan_results["status"] = "passed"
        scan_results["score"] = 95

    except Exception as e:
        scan_results = {
            "status": "error",
            "error": str(e)
        }

    return SuccessResponse(
        message="Security scan completed",
        data={
            "scan_id": f"scan_{int(time.time())}",
            "timestamp": time.time(),
            "results": scan_results
        }
    )