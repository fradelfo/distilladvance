"""
FastAPI middleware for cross-cutting concerns.
Handles logging, security, rate limiting, and request/response processing.
"""

import time
import json
import logging
from typing import Callable
from fastapi import Request, Response
from fastapi.middleware.base import BaseHTTPMiddleware
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse

from app.core.config import get_settings
from app.core.security import SecurityHeaders
from app.core.rate_limiting import RateLimiter, RateLimit
from app.core.exceptions import RateLimitExceededException

settings = get_settings()
logger = logging.getLogger(__name__)
rate_limiter = RateLimiter()


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware for structured request/response logging.

    Logs all API requests with timing, status codes, and relevant metadata.
    Excludes sensitive information from logs.
    """

    EXCLUDED_PATHS = ["/health", "/metrics", "/favicon.ico"]
    SENSITIVE_HEADERS = ["authorization", "cookie", "x-api-key"]

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()

        # Extract request info
        client_ip = self.get_client_ip(request)
        user_agent = request.headers.get("user-agent", "")
        request_id = f"req_{int(time.time() * 1000)}"

        # Add request ID to headers for tracing
        request.state.request_id = request_id

        # Skip logging for certain paths
        if request.url.path in self.EXCLUDED_PATHS:
            return await call_next(request)

        # Log request
        request_data = {
            "request_id": request_id,
            "method": request.method,
            "url": str(request.url),
            "client_ip": client_ip,
            "user_agent": user_agent,
            "headers": self.filter_headers(dict(request.headers))
        }

        logger.info("Request started", extra=request_data)

        # Process request
        try:
            response = await call_next(request)
        except Exception as e:
            # Log unhandled exceptions
            duration = time.time() - start_time
            logger.error(
                "Request failed with unhandled exception",
                extra={
                    **request_data,
                    "duration": duration,
                    "error": str(e),
                    "exception_type": type(e).__name__
                },
                exc_info=True
            )
            raise

        # Log response
        duration = time.time() - start_time
        response_data = {
            **request_data,
            "status_code": response.status_code,
            "duration": duration,
            "response_size": response.headers.get("content-length", 0)
        }

        if response.status_code >= 400:
            logger.warning("Request completed with error", extra=response_data)
        else:
            logger.info("Request completed successfully", extra=response_data)

        # Add response headers
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Response-Time"] = f"{duration:.3f}s"

        return response

    def get_client_ip(self, request: Request) -> str:
        """Extract client IP from request headers."""
        # Check for forwarded headers (load balancer/proxy)
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            # Take the first IP in the chain
            return forwarded_for.split(",")[0].strip()

        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip

        # Fallback to direct client
        return request.client.host if request.client else "unknown"

    def filter_headers(self, headers: dict) -> dict:
        """Remove sensitive information from headers."""
        filtered = {}
        for key, value in headers.items():
            if key.lower() in self.SENSITIVE_HEADERS:
                filtered[key] = "[REDACTED]"
            else:
                filtered[key] = value
        return filtered


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware for adding security headers to all responses.

    Implements security best practices including CSP, HSTS, and anti-clickjacking.
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)

        # Add security headers
        security_headers = SecurityHeaders.get_secure_headers()
        for header, value in security_headers.items():
            response.headers[header] = value

        # Add additional headers based on environment
        if settings.environment == "production":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        else:
            # More permissive CSP for development
            response.headers["Content-Security-Policy"] = "default-src 'self' 'unsafe-inline' 'unsafe-eval'"

        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Middleware for API rate limiting.

    Implements per-IP and per-user rate limiting with different limits for different endpoints.
    """

    # Rate limit configurations for different endpoint patterns
    RATE_LIMITS = {
        "/auth/login": RateLimit(5, 300),  # 5 attempts per 5 minutes
        "/auth/register": RateLimit(3, 3600),  # 3 registrations per hour
        "/auth/password-reset": RateLimit(3, 3600),  # 3 reset requests per hour
        "/posts": RateLimit(10, 3600),  # 10 post creations per hour
        "/comments": RateLimit(30, 3600),  # 30 comments per hour
        "default": RateLimit(100, 60)  # 100 requests per minute for other endpoints
    }

    EXCLUDED_PATHS = ["/health", "/metrics", "/docs", "/redoc", "/openapi.json"]

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip rate limiting for excluded paths
        if any(request.url.path.startswith(path) for path in self.EXCLUDED_PATHS):
            return await call_next(request)

        # Skip rate limiting for OPTIONS requests (CORS preflight)
        if request.method == "OPTIONS":
            return await call_next(request)

        # Determine rate limit for this endpoint
        rate_limit = self.get_rate_limit_for_path(request.url.path, request.method)

        # Generate identifier for rate limiting
        client_ip = self.get_client_ip(request)

        # Use user ID if authenticated, otherwise use IP
        user_id = getattr(request.state, 'user_id', None) if hasattr(request.state, 'user_id') else None
        identifier = f"user_{user_id}" if user_id else f"ip_{client_ip}"

        try:
            # Check rate limit
            rate_info = await rate_limiter.check_rate_limit(identifier, rate_limit)

            # Add rate limit headers
            response = await call_next(request)
            response.headers.update({
                "X-RateLimit-Limit": str(rate_limit.requests),
                "X-RateLimit-Remaining": str(rate_info.get("remaining", 0)),
                "X-RateLimit-Reset": str(rate_info.get("reset_time", 0)),
                "X-RateLimit-Window": str(rate_limit.window)
            })

            return response

        except RateLimitExceededException as e:
            # Return rate limit exceeded response
            return JSONResponse(
                status_code=429,
                content={
                    "success": False,
                    "error": {
                        "message": "Rate limit exceeded",
                        "code": "RATE_LIMIT_EXCEEDED",
                        "details": {
                            "limit": e.limit,
                            "window_seconds": e.window,
                            "retry_after_seconds": e.retry_after
                        }
                    }
                },
                headers={
                    "Retry-After": str(e.retry_after),
                    "X-RateLimit-Limit": str(e.limit),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(int(time.time()) + e.retry_after)
                }
            )

    def get_rate_limit_for_path(self, path: str, method: str) -> RateLimit:
        """Determine appropriate rate limit for the given path and method."""
        # Check for specific endpoint patterns
        for pattern, limit in self.RATE_LIMITS.items():
            if pattern == "default":
                continue
            if path.startswith(pattern):
                return limit

        # Check for specific HTTP methods on general paths
        if method == "POST":
            if "/posts/" in path and path.endswith("/comments"):
                return self.RATE_LIMITS["/comments"]
            elif "/posts" in path:
                return self.RATE_LIMITS["/posts"]

        # Return default rate limit
        return self.RATE_LIMITS["default"]

    def get_client_ip(self, request: Request) -> str:
        """Extract client IP from request."""
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()

        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip

        return request.client.host if request.client else "unknown"


class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """
    Middleware for consistent error handling and response formatting.

    Catches unhandled exceptions and returns properly formatted error responses.
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        try:
            response = await call_next(request)
            return response

        except Exception as e:
            logger.error(
                "Unhandled exception in request",
                extra={
                    "url": str(request.url),
                    "method": request.method,
                    "error": str(e),
                    "exception_type": type(e).__name__
                },
                exc_info=True
            )

            # Return generic error response
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "error": {
                        "message": "Internal server error",
                        "code": "INTERNAL_SERVER_ERROR",
                        "type": "InternalServerError"
                    }
                }
            )


class MetricsMiddleware(BaseHTTPMiddleware):
    """
    Middleware for collecting application metrics.

    Tracks request counts, response times, and error rates for monitoring.
    """

    def __init__(self, app):
        super().__init__(app)
        self.request_count = 0
        self.error_count = 0
        self.response_times = []

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()

        # Increment request counter
        self.request_count += 1

        try:
            response = await call_next(request)

            # Record response time
            duration = time.time() - start_time
            self.response_times.append(duration)

            # Keep only recent response times (last 1000 requests)
            if len(self.response_times) > 1000:
                self.response_times = self.response_times[-1000:]

            # Count errors
            if response.status_code >= 400:
                self.error_count += 1

            # Add metrics headers
            response.headers["X-Request-Count"] = str(self.request_count)
            response.headers["X-Response-Time"] = f"{duration:.3f}"

            return response

        except Exception as e:
            self.error_count += 1
            raise


def add_cors_middleware(app):
    """Configure CORS middleware with appropriate settings."""
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allow_headers=[
            "Authorization",
            "Content-Type",
            "X-Requested-With",
            "X-Request-ID",
            "Accept",
            "Origin",
            "User-Agent"
        ],
        expose_headers=[
            "X-Request-ID",
            "X-Response-Time",
            "X-RateLimit-Limit",
            "X-RateLimit-Remaining",
            "X-RateLimit-Reset"
        ]
    )


def setup_middleware(app):
    """Configure all middleware for the application."""
    # Add middleware in reverse order of execution
    # (last added executes first)

    # CORS (must be last to handle preflight requests)
    add_cors_middleware(app)

    # Security headers
    app.add_middleware(SecurityHeadersMiddleware)

    # Error handling
    app.add_middleware(ErrorHandlingMiddleware)

    # Metrics collection
    app.add_middleware(MetricsMiddleware)

    # Rate limiting
    app.add_middleware(RateLimitMiddleware)

    # Request logging (execute first to log everything)
    app.add_middleware(RequestLoggingMiddleware)