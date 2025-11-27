"""
Custom exception classes for the FastAPI application.
Provides structured error handling and consistent API responses.
"""

from typing import Any, Dict, Optional, List


class BaseAPIException(Exception):
    """
    Base exception class for all API exceptions.
    Provides consistent error structure and HTTP status codes.
    """

    def __init__(
        self,
        message: str,
        status_code: int = 500,
        error_code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code or self.__class__.__name__
        self.details = details or {}
        self.headers = headers or {}

        super().__init__(self.message)

    def to_dict(self) -> Dict[str, Any]:
        """Convert exception to dictionary for JSON response."""
        result = {
            "error": {
                "message": self.message,
                "code": self.error_code,
                "type": self.__class__.__name__
            }
        }

        if self.details:
            result["error"]["details"] = self.details

        return result


class ValidationException(BaseAPIException):
    """
    Exception for validation errors.
    Used when request data fails validation rules.
    """

    def __init__(
        self,
        message: str = "Validation failed",
        field_errors: Optional[Dict[str, List[str]]] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        self.field_errors = field_errors or {}

        if details is None:
            details = {}

        if self.field_errors:
            details["field_errors"] = self.field_errors

        super().__init__(
            message=message,
            status_code=422,
            error_code="VALIDATION_ERROR",
            details=details
        )


class AuthenticationException(BaseAPIException):
    """
    Exception for authentication failures.
    Used when credentials are invalid or missing.
    """

    def __init__(
        self,
        message: str = "Authentication failed",
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            status_code=401,
            error_code="AUTHENTICATION_ERROR",
            details=details,
            headers={"WWW-Authenticate": "Bearer"}
        )


class AuthorizationException(BaseAPIException):
    """
    Exception for authorization failures.
    Used when user lacks required permissions.
    """

    def __init__(
        self,
        message: str = "Access denied",
        required_permission: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        if details is None:
            details = {}

        if required_permission:
            details["required_permission"] = required_permission

        super().__init__(
            message=message,
            status_code=403,
            error_code="AUTHORIZATION_ERROR",
            details=details
        )


class ResourceNotFoundException(BaseAPIException):
    """
    Exception for when requested resource is not found.
    """

    def __init__(
        self,
        message: str = "Resource not found",
        resource_type: Optional[str] = None,
        resource_id: Optional[Any] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        if details is None:
            details = {}

        if resource_type:
            details["resource_type"] = resource_type

        if resource_id is not None:
            details["resource_id"] = str(resource_id)

        super().__init__(
            message=message,
            status_code=404,
            error_code="RESOURCE_NOT_FOUND",
            details=details
        )


class ConflictException(BaseAPIException):
    """
    Exception for resource conflicts.
    Used when attempting to create duplicate resources.
    """

    def __init__(
        self,
        message: str = "Resource conflict",
        conflicting_field: Optional[str] = None,
        conflicting_value: Optional[Any] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        if details is None:
            details = {}

        if conflicting_field:
            details["conflicting_field"] = conflicting_field

        if conflicting_value is not None:
            details["conflicting_value"] = str(conflicting_value)

        super().__init__(
            message=message,
            status_code=409,
            error_code="RESOURCE_CONFLICT",
            details=details
        )


class RateLimitExceededException(BaseAPIException):
    """
    Exception for rate limit violations.
    """

    def __init__(
        self,
        message: str = "Rate limit exceeded",
        retry_after: Optional[int] = None,
        limit: Optional[int] = None,
        window: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        if details is None:
            details = {}

        if limit:
            details["limit"] = limit

        if window:
            details["window_seconds"] = window

        headers = {}
        if retry_after:
            headers["Retry-After"] = str(retry_after)
            details["retry_after_seconds"] = retry_after

        super().__init__(
            message=message,
            status_code=429,
            error_code="RATE_LIMIT_EXCEEDED",
            details=details,
            headers=headers
        )


class BusinessLogicException(BaseAPIException):
    """
    Exception for business logic violations.
    Used when operation violates business rules.
    """

    def __init__(
        self,
        message: str,
        business_rule: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        if details is None:
            details = {}

        if business_rule:
            details["business_rule"] = business_rule

        super().__init__(
            message=message,
            status_code=400,
            error_code="BUSINESS_LOGIC_ERROR",
            details=details
        )


class ExternalServiceException(BaseAPIException):
    """
    Exception for external service failures.
    Used when external APIs or services fail.
    """

    def __init__(
        self,
        message: str = "External service unavailable",
        service_name: Optional[str] = None,
        service_error: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        if details is None:
            details = {}

        if service_name:
            details["service_name"] = service_name

        if service_error:
            details["service_error"] = service_error

        super().__init__(
            message=message,
            status_code=503,
            error_code="EXTERNAL_SERVICE_ERROR",
            details=details
        )


class DatabaseException(BaseAPIException):
    """
    Exception for database operation failures.
    """

    def __init__(
        self,
        message: str = "Database operation failed",
        operation: Optional[str] = None,
        table: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        if details is None:
            details = {}

        if operation:
            details["operation"] = operation

        if table:
            details["table"] = table

        super().__init__(
            message=message,
            status_code=500,
            error_code="DATABASE_ERROR",
            details=details
        )


class FileUploadException(BaseAPIException):
    """
    Exception for file upload failures.
    """

    def __init__(
        self,
        message: str = "File upload failed",
        file_name: Optional[str] = None,
        file_size: Optional[int] = None,
        max_size: Optional[int] = None,
        allowed_types: Optional[List[str]] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        if details is None:
            details = {}

        if file_name:
            details["file_name"] = file_name

        if file_size:
            details["file_size_bytes"] = file_size

        if max_size:
            details["max_size_bytes"] = max_size

        if allowed_types:
            details["allowed_types"] = allowed_types

        super().__init__(
            message=message,
            status_code=400,
            error_code="FILE_UPLOAD_ERROR",
            details=details
        )


class MaintenanceModeException(BaseAPIException):
    """
    Exception for when API is in maintenance mode.
    """

    def __init__(
        self,
        message: str = "API is currently under maintenance",
        estimated_completion: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        if details is None:
            details = {}

        if estimated_completion:
            details["estimated_completion"] = estimated_completion

        super().__init__(
            message=message,
            status_code=503,
            error_code="MAINTENANCE_MODE",
            details=details
        )


class SecurityException(BaseAPIException):
    """
    Exception for security violations.
    """

    def __init__(
        self,
        message: str = "Security violation detected",
        violation_type: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        if details is None:
            details = {}

        if violation_type:
            details["violation_type"] = violation_type

        super().__init__(
            message=message,
            status_code=403,
            error_code="SECURITY_VIOLATION",
            details=details
        )


# Convenience functions for common exceptions
def not_found(resource: str, identifier: Any = None) -> ResourceNotFoundException:
    """Create a resource not found exception."""
    message = f"{resource.title()} not found"
    if identifier is not None:
        message += f" (ID: {identifier})"

    return ResourceNotFoundException(
        message=message,
        resource_type=resource,
        resource_id=identifier
    )


def validation_error(field: str, message: str) -> ValidationException:
    """Create a single field validation error."""
    return ValidationException(
        message=f"Validation failed for field '{field}': {message}",
        field_errors={field: [message]}
    )


def unauthorized(message: str = "Authentication required") -> AuthenticationException:
    """Create an authentication exception."""
    return AuthenticationException(message=message)


def forbidden(message: str = "Access denied") -> AuthorizationException:
    """Create an authorization exception."""
    return AuthorizationException(message=message)


def conflict(field: str, value: Any) -> ConflictException:
    """Create a conflict exception for duplicate values."""
    return ConflictException(
        message=f"Value '{value}' already exists for field '{field}'",
        conflicting_field=field,
        conflicting_value=value
    )


def business_rule_violation(rule: str, message: str) -> BusinessLogicException:
    """Create a business logic exception."""
    return BusinessLogicException(
        message=message,
        business_rule=rule
    )


def external_service_error(service: str, error: str) -> ExternalServiceException:
    """Create an external service exception."""
    return ExternalServiceException(
        message=f"External service '{service}' error: {error}",
        service_name=service,
        service_error=error
    )


def database_error(operation: str, table: str = None, error: str = None) -> DatabaseException:
    """Create a database exception."""
    message = f"Database {operation} failed"
    if table:
        message += f" on table '{table}'"
    if error:
        message += f": {error}"

    return DatabaseException(
        message=message,
        operation=operation,
        table=table
    )


def file_too_large(filename: str, size: int, max_size: int) -> FileUploadException:
    """Create a file upload size exception."""
    return FileUploadException(
        message=f"File '{filename}' is too large ({size} bytes). Maximum size is {max_size} bytes.",
        file_name=filename,
        file_size=size,
        max_size=max_size
    )


def invalid_file_type(filename: str, file_type: str, allowed_types: List[str]) -> FileUploadException:
    """Create a file upload type exception."""
    return FileUploadException(
        message=f"File type '{file_type}' not allowed for file '{filename}'. Allowed types: {', '.join(allowed_types)}",
        file_name=filename,
        allowed_types=allowed_types
    )