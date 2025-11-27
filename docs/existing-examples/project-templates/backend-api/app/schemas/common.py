"""
Common Pydantic schemas used across multiple API endpoints.
Provides standardized response formats and utility schemas.
"""

from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field


class SuccessResponse(BaseModel):
    """Standard success response format."""
    success: bool = True
    message: str = Field(..., description="Success message")
    data: Optional[Dict[str, Any]] = Field(None, description="Response data")

    class Config:
        schema_extra = {
            "example": {
                "success": True,
                "message": "Operation completed successfully",
                "data": {"id": 1, "status": "active"}
            }
        }


class ErrorResponse(BaseModel):
    """Standard error response format."""
    success: bool = False
    error: Dict[str, Any] = Field(..., description="Error details")

    class Config:
        schema_extra = {
            "example": {
                "success": False,
                "error": {
                    "message": "Validation failed",
                    "code": "VALIDATION_ERROR",
                    "type": "ValidationException",
                    "details": {
                        "field_errors": {
                            "email": ["Email is required"]
                        }
                    }
                }
            }
        }


class MessageResponse(BaseModel):
    """Simple message response."""
    message: str = Field(..., description="Response message")

    class Config:
        schema_extra = {
            "example": {
                "message": "Operation completed successfully"
            }
        }


class PaginationParams(BaseModel):
    """Standard pagination parameters."""
    page: int = Field(
        default=1,
        ge=1,
        description="Page number (starts from 1)"
    )
    size: int = Field(
        default=20,
        ge=1,
        le=100,
        description="Items per page (1-100)"
    )

    @property
    def offset(self) -> int:
        """Calculate offset for database queries."""
        return (self.page - 1) * self.size

    class Config:
        schema_extra = {
            "example": {
                "page": 1,
                "size": 20
            }
        }


class PaginatedResponse(BaseModel):
    """Standard paginated response format."""
    items: List[Any] = Field(..., description="List of items")
    total: int = Field(..., description="Total number of items")
    page: int = Field(..., description="Current page number")
    size: int = Field(..., description="Items per page")
    pages: int = Field(..., description="Total number of pages")

    class Config:
        schema_extra = {
            "example": {
                "items": [],
                "total": 100,
                "page": 1,
                "size": 20,
                "pages": 5
            }
        }


class HealthCheckResponse(BaseModel):
    """Health check response schema."""
    status: str = Field(..., description="Service status")
    timestamp: str = Field(..., description="Check timestamp")
    version: str = Field(..., description="Application version")
    checks: Dict[str, Any] = Field(..., description="Individual service checks")

    class Config:
        schema_extra = {
            "example": {
                "status": "healthy",
                "timestamp": "2024-01-01T12:00:00Z",
                "version": "1.0.0",
                "checks": {
                    "database": {"status": "healthy", "response_time": "15ms"},
                    "redis": {"status": "healthy", "response_time": "3ms"},
                    "external_api": {"status": "degraded", "response_time": "2500ms"}
                }
            }
        }


class MetricsResponse(BaseModel):
    """Application metrics response schema."""
    requests_total: int = Field(..., description="Total requests")
    requests_per_minute: float = Field(..., description="Requests per minute")
    avg_response_time: float = Field(..., description="Average response time (ms)")
    error_rate: float = Field(..., description="Error rate percentage")
    active_users: int = Field(..., description="Currently active users")
    database_connections: int = Field(..., description="Active database connections")
    memory_usage: float = Field(..., description="Memory usage percentage")
    cpu_usage: float = Field(..., description="CPU usage percentage")

    class Config:
        schema_extra = {
            "example": {
                "requests_total": 150000,
                "requests_per_minute": 45.2,
                "avg_response_time": 125.5,
                "error_rate": 0.8,
                "active_users": 234,
                "database_connections": 12,
                "memory_usage": 68.5,
                "cpu_usage": 23.1
            }
        }


class FileUploadResponse(BaseModel):
    """File upload response schema."""
    filename: str = Field(..., description="Original filename")
    file_path: str = Field(..., description="Stored file path")
    file_size: int = Field(..., description="File size in bytes")
    mime_type: str = Field(..., description="File MIME type")
    upload_id: str = Field(..., description="Unique upload identifier")
    uploaded_at: str = Field(..., description="Upload timestamp")

    class Config:
        schema_extra = {
            "example": {
                "filename": "document.pdf",
                "file_path": "/uploads/2024/01/document_abc123.pdf",
                "file_size": 1048576,
                "mime_type": "application/pdf",
                "upload_id": "upload_abc123def456",
                "uploaded_at": "2024-01-01T12:00:00Z"
            }
        }


class RateLimitInfo(BaseModel):
    """Rate limit information schema."""
    limit: int = Field(..., description="Rate limit maximum")
    remaining: int = Field(..., description="Remaining requests")
    reset_time: int = Field(..., description="Reset timestamp")
    retry_after: Optional[int] = Field(None, description="Retry after seconds")

    class Config:
        schema_extra = {
            "example": {
                "limit": 100,
                "remaining": 85,
                "reset_time": 1704110400,
                "retry_after": None
            }
        }


class BulkOperationRequest(BaseModel):
    """Schema for bulk operations."""
    ids: List[int] = Field(..., description="List of item IDs", min_items=1, max_items=100)
    action: str = Field(..., description="Action to perform")
    parameters: Optional[Dict[str, Any]] = Field(None, description="Action parameters")

    class Config:
        schema_extra = {
            "example": {
                "ids": [1, 2, 3, 4, 5],
                "action": "delete",
                "parameters": {
                    "soft_delete": True,
                    "reason": "Spam content"
                }
            }
        }


class BulkOperationResponse(BaseModel):
    """Schema for bulk operation results."""
    total_items: int = Field(..., description="Total items processed")
    successful: int = Field(..., description="Successfully processed items")
    failed: int = Field(..., description="Failed items")
    errors: List[Dict[str, Any]] = Field(default=[], description="Error details")
    results: Dict[str, Any] = Field(default={}, description="Operation results")

    class Config:
        schema_extra = {
            "example": {
                "total_items": 5,
                "successful": 4,
                "failed": 1,
                "errors": [
                    {
                        "item_id": 3,
                        "error": "Item not found",
                        "code": "NOT_FOUND"
                    }
                ],
                "results": {
                    "deleted_ids": [1, 2, 4, 5]
                }
            }
        }


class SearchRequest(BaseModel):
    """Generic search request schema."""
    query: str = Field(..., description="Search query", min_length=1, max_length=200)
    filters: Optional[Dict[str, Any]] = Field(None, description="Search filters")
    sort_by: Optional[str] = Field(None, description="Sort field")
    sort_order: str = Field(default="desc", regex="^(asc|desc)$", description="Sort order")

    # Pagination
    page: int = Field(default=1, ge=1, description="Page number")
    size: int = Field(default=20, ge=1, le=100, description="Items per page")

    class Config:
        schema_extra = {
            "example": {
                "query": "python tutorial",
                "filters": {
                    "category": "programming",
                    "difficulty": "beginner"
                },
                "sort_by": "relevance",
                "sort_order": "desc",
                "page": 1,
                "size": 20
            }
        }


class NotificationResponse(BaseModel):
    """Notification response schema."""
    id: str = Field(..., description="Notification ID")
    type: str = Field(..., description="Notification type")
    title: str = Field(..., description="Notification title")
    message: str = Field(..., description="Notification message")
    data: Optional[Dict[str, Any]] = Field(None, description="Additional data")
    is_read: bool = Field(..., description="Read status")
    created_at: str = Field(..., description="Creation timestamp")
    expires_at: Optional[str] = Field(None, description="Expiration timestamp")

    class Config:
        schema_extra = {
            "example": {
                "id": "notif_abc123",
                "type": "post_liked",
                "title": "Your post was liked",
                "message": "Someone liked your post 'Introduction to FastAPI'",
                "data": {
                    "post_id": 1,
                    "liker_name": "John Doe"
                },
                "is_read": False,
                "created_at": "2024-01-01T12:00:00Z",
                "expires_at": "2024-01-08T12:00:00Z"
            }
        }


class ConfigResponse(BaseModel):
    """Application configuration response."""
    app_name: str = Field(..., description="Application name")
    version: str = Field(..., description="Application version")
    environment: str = Field(..., description="Environment name")
    features: Dict[str, bool] = Field(..., description="Feature flags")
    limits: Dict[str, int] = Field(..., description="Application limits")
    settings: Dict[str, Any] = Field(..., description="Public settings")

    class Config:
        schema_extra = {
            "example": {
                "app_name": "Blog API",
                "version": "1.0.0",
                "environment": "production",
                "features": {
                    "registration_enabled": True,
                    "email_verification_required": True,
                    "comments_enabled": True
                },
                "limits": {
                    "max_posts_per_user": 100,
                    "max_file_size": 10485760,
                    "rate_limit_requests": 100
                },
                "settings": {
                    "timezone": "UTC",
                    "date_format": "YYYY-MM-DD",
                    "default_language": "en"
                }
            }
        }