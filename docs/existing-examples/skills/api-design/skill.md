# API Design Skill

Modern API design and development expertise covering RESTful APIs, GraphQL, gRPC, and real-time communication with industry best practices.

## Skill Overview

Comprehensive API design knowledge including REST architecture, GraphQL schemas, gRPC services, real-time APIs, authentication, rate limiting, versioning, and documentation using cutting-edge tools and standards.

## Core Capabilities

### RESTful API Design
- **Resource modeling** - Domain-driven design, entity relationships, URI structure
- **HTTP methods** - Proper verb usage, idempotency, status codes
- **Data formatting** - JSON:API, HAL, JSON-LD standards compliance
- **Error handling** - Consistent error responses, problem details RFC 7807

### GraphQL API Development
- **Schema design** - Type system, resolvers, federation patterns
- **Query optimization** - N+1 problem resolution, DataLoader implementation
- **Subscription handling** - Real-time updates, connection management
- **Security patterns** - Query complexity analysis, depth limiting

### gRPC Services
- **Protocol buffer design** - Message definitions, service contracts
- **Streaming patterns** - Unidirectional, bidirectional streaming
- **Load balancing** - Client-side, proxy-based load balancing
- **Error handling** - Status codes, error details, retry policies

### API Security & Governance
- **Authentication** - JWT, OAuth 2.0, API keys, mTLS
- **Authorization** - RBAC, ABAC, policy enforcement
- **Rate limiting** - Token bucket, sliding window algorithms
- **API gateway** - Traffic management, transformation, monitoring

## Modern API Design Patterns

### RESTful API Implementation
```python
# FastAPI with advanced patterns and OpenAPI documentation
from fastapi import FastAPI, HTTPException, Depends, status, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import asyncio
import logging

# Pydantic models with validation
class UserBase(BaseModel):
    email: str = Field(..., regex=r'^[^@]+@[^@]+\.[^@]+$')
    name: str = Field(..., min_length=2, max_length=100)
    age: Optional[int] = Field(None, ge=0, le=150)

    @validator('email')
    def validate_email_domain(cls, v):
        if not v.endswith(('.com', '.org', '.net')):
            raise ValueError('Email must end with .com, .org, or .net')
        return v.lower()

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserResponse(UserBase):
    id: int
    created_at: datetime
    is_active: bool = True

    class Config:
        orm_mode = True

class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    size: int
    pages: int

class APIError(BaseModel):
    error_code: str
    message: str
    details: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# FastAPI application with middleware
app = FastAPI(
    title="Modern API",
    description="RESTful API with best practices",
    version="1.0.0",
    openapi_tags=[
        {"name": "users", "description": "User management operations"},
        {"name": "auth", "description": "Authentication endpoints"}
    ]
)

# Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://frontend.example.com"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
    expose_headers=["X-Rate-Limit-*"]
)

app.add_middleware(GZipMiddleware, minimum_size=1000)

# Security
security = HTTPBearer()

async def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    """JWT token verification"""
    try:
        # Verify JWT token (implementation depends on your auth system)
        user = await verify_jwt_token(credentials.credentials)
        return user
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

# Rate limiting dependency
async def rate_limit(request: Request):
    """Rate limiting using Redis"""
    client_ip = request.client.host
    redis_key = f"rate_limit:{client_ip}"

    async with aioredis.from_url("redis://localhost") as redis:
        current = await redis.get(redis_key)
        if current is None:
            await redis.setex(redis_key, 60, 1)  # 1 request per minute window
        else:
            count = int(current)
            if count >= 100:  # 100 requests per minute
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Rate limit exceeded"
                )
            await redis.incr(redis_key)

# Exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content=APIError(
            error_code=f"HTTP_{exc.status_code}",
            message=exc.detail,
            details={"path": str(request.url.path)}
        ).dict()
    )

# API endpoints with comprehensive patterns
@app.get("/api/v1/users",
         response_model=PaginatedResponse,
         tags=["users"],
         summary="List users",
         description="Retrieve a paginated list of users with optional filtering")
async def list_users(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Page size"),
    email: Optional[str] = Query(None, description="Filter by email"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    current_user = Depends(verify_token),
    _rate_limit = Depends(rate_limit)
):
    """List users with advanced filtering and pagination"""

    # Build query filters
    filters = {}
    if email:
        filters['email__icontains'] = email
    if is_active is not None:
        filters['is_active'] = is_active

    # Execute query with pagination
    total = await User.filter(**filters).count()
    users = await User.filter(**filters).offset((page - 1) * size).limit(size)

    return PaginatedResponse(
        items=[UserResponse.from_orm(user) for user in users],
        total=total,
        page=page,
        size=size,
        pages=(total + size - 1) // size
    )

@app.post("/api/v1/users",
          response_model=UserResponse,
          status_code=status.HTTP_201_CREATED,
          tags=["users"])
async def create_user(
    user_data: UserCreate,
    current_user = Depends(verify_token),
    _rate_limit = Depends(rate_limit)
):
    """Create a new user"""

    # Check if user already exists
    existing_user = await User.filter(email=user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email already exists"
        )

    # Hash password
    hashed_password = await hash_password(user_data.password)

    # Create user
    user = await User.create(
        **user_data.dict(exclude={'password'}),
        password_hash=hashed_password
    )

    return UserResponse.from_orm(user)

@app.get("/api/v1/users/{user_id}",
         response_model=UserResponse,
         tags=["users"])
async def get_user(
    user_id: int = Path(..., description="User ID"),
    current_user = Depends(verify_token)
):
    """Get a specific user by ID"""

    user = await User.filter(id=user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return UserResponse.from_orm(user)

@app.put("/api/v1/users/{user_id}",
         response_model=UserResponse,
         tags=["users"])
async def update_user(
    user_id: int,
    user_data: UserBase,
    current_user = Depends(verify_token)
):
    """Update a user"""

    user = await User.filter(id=user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Update user
    await user.update_from_dict(user_data.dict(exclude_unset=True))
    await user.save()

    return UserResponse.from_orm(user)

@app.delete("/api/v1/users/{user_id}",
            status_code=status.HTTP_204_NO_CONTENT,
            tags=["users"])
async def delete_user(
    user_id: int,
    current_user = Depends(verify_token)
):
    """Delete a user"""

    user = await User.filter(id=user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    await user.delete()
```

### GraphQL API Implementation
```python
# Modern GraphQL API with Strawberry
import strawberry
from strawberry.fastapi import GraphQLRouter
from strawberry.extensions import QueryDepthLimiter
from strawberry.permission import BasePermission
from strawberry.types import Info
from typing import List, Optional
import asyncio

# GraphQL types
@strawberry.type
class User:
    id: int
    email: str
    name: str
    age: Optional[int]
    created_at: datetime
    posts: List['Post']

@strawberry.type
class Post:
    id: int
    title: str
    content: str
    author: User
    created_at: datetime
    tags: List[str]

@strawberry.input
class UserInput:
    email: str
    name: str
    age: Optional[int] = None

@strawberry.input
class PostInput:
    title: str
    content: str
    tags: List[str] = strawberry.field(default_factory=list)

# Permissions
class IsAuthenticated(BasePermission):
    message = "User is not authenticated"

    def has_permission(self, source, info: Info, **kwargs) -> bool:
        return info.context.get("user") is not None

# DataLoader for N+1 problem resolution
class UserLoader:
    def __init__(self):
        self.cache = {}

    async def load_user(self, user_id: int) -> Optional[User]:
        if user_id in self.cache:
            return self.cache[user_id]

        user = await User.get_or_none(id=user_id)
        self.cache[user_id] = user
        return user

    async def load_users(self, user_ids: List[int]) -> List[Optional[User]]:
        # Batch load users to avoid N+1 queries
        missing_ids = [uid for uid in user_ids if uid not in self.cache]

        if missing_ids:
            users = await User.filter(id__in=missing_ids)
            for user in users:
                self.cache[user.id] = user

        return [self.cache.get(uid) for uid in user_ids]

# Query resolvers
@strawberry.type
class Query:
    @strawberry.field
    async def users(
        self,
        info: Info,
        first: Optional[int] = 10,
        after: Optional[str] = None,
        filter: Optional[str] = None
    ) -> List[User]:
        """Get paginated users with optional filtering"""
        query = User.all()

        if filter:
            query = query.filter(
                name__icontains=filter
            ).union(
                User.filter(email__icontains=filter)
            )

        if after:
            query = query.filter(id__gt=int(after))

        users = await query.limit(first)
        return users

    @strawberry.field
    async def user(self, info: Info, id: int) -> Optional[User]:
        """Get user by ID"""
        loader = info.context["user_loader"]
        return await loader.load_user(id)

    @strawberry.field
    async def posts(
        self,
        info: Info,
        user_id: Optional[int] = None,
        tag: Optional[str] = None
    ) -> List[Post]:
        """Get posts with optional filtering"""
        query = Post.all()

        if user_id:
            query = query.filter(author_id=user_id)

        if tag:
            query = query.filter(tags__contains=[tag])

        return await query

# Mutation resolvers
@strawberry.type
class Mutation:
    @strawberry.mutation(permission_classes=[IsAuthenticated])
    async def create_user(self, info: Info, input: UserInput) -> User:
        """Create a new user"""
        user_data = strawberry.asdict(input)
        user = await User.create(**user_data)
        return user

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    async def update_user(
        self,
        info: Info,
        id: int,
        input: UserInput
    ) -> Optional[User]:
        """Update an existing user"""
        user = await User.get_or_none(id=id)
        if not user:
            return None

        user_data = strawberry.asdict(input)
        await user.update_from_dict(user_data)
        await user.save()
        return user

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    async def create_post(
        self,
        info: Info,
        input: PostInput,
        author_id: int
    ) -> Post:
        """Create a new post"""
        post_data = strawberry.asdict(input)
        post = await Post.create(**post_data, author_id=author_id)
        return post

# Subscription for real-time updates
@strawberry.type
class Subscription:
    @strawberry.subscription
    async def user_created(self) -> User:
        """Subscribe to user creation events"""
        # This would integrate with your pub/sub system
        async for user in user_creation_stream():
            yield user

    @strawberry.subscription
    async def post_updates(self, user_id: Optional[int] = None) -> Post:
        """Subscribe to post updates"""
        async for post in post_update_stream(user_id=user_id):
            yield post

# Schema with extensions
schema = strawberry.Schema(
    query=Query,
    mutation=Mutation,
    subscription=Subscription,
    extensions=[
        QueryDepthLimiter(max_depth=10),  # Prevent deep queries
    ]
)

# Context provider
async def get_context(request) -> dict:
    return {
        "user": await get_current_user(request),
        "user_loader": UserLoader(),
        "request": request
    }

# GraphQL router
graphql_app = GraphQLRouter(
    schema,
    context_getter=get_context,
    graphiql=True  # Enable GraphiQL in development
)

app.include_router(graphql_app, prefix="/graphql")
```

### gRPC Service Implementation
```python
# gRPC service with advanced patterns
import grpc
from concurrent import futures
import asyncio
import logging
from grpc_reflection.v1alpha import reflection
from grpc_health.v1alpha import health
from grpc_health.v1alpha import health_pb2_grpc

# Generated from proto files
import user_service_pb2
import user_service_pb2_grpc

class UserService(user_service_pb2_grpc.UserServiceServicer):
    def __init__(self):
        self.users = {}
        self.user_counter = 1

    async def CreateUser(self, request, context):
        """Create a new user"""
        try:
            # Validate request
            if not request.email or not request.name:
                context.set_code(grpc.StatusCode.INVALID_ARGUMENT)
                context.set_details("Email and name are required")
                return user_service_pb2.UserResponse()

            # Check if user exists
            for user in self.users.values():
                if user.email == request.email:
                    context.set_code(grpc.StatusCode.ALREADY_EXISTS)
                    context.set_details("User with this email already exists")
                    return user_service_pb2.UserResponse()

            # Create user
            user = user_service_pb2.User(
                id=self.user_counter,
                email=request.email,
                name=request.name,
                age=request.age
            )

            self.users[self.user_counter] = user
            self.user_counter += 1

            return user_service_pb2.UserResponse(
                success=True,
                user=user,
                message="User created successfully"
            )

        except Exception as e:
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"Internal error: {str(e)}")
            return user_service_pb2.UserResponse()

    async def GetUser(self, request, context):
        """Get user by ID"""
        try:
            user = self.users.get(request.id)
            if not user:
                context.set_code(grpc.StatusCode.NOT_FOUND)
                context.set_details("User not found")
                return user_service_pb2.UserResponse()

            return user_service_pb2.UserResponse(
                success=True,
                user=user
            )

        except Exception as e:
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"Internal error: {str(e)}")
            return user_service_pb2.UserResponse()

    async def ListUsers(self, request, context):
        """Stream users"""
        try:
            for user in self.users.values():
                yield user_service_pb2.UserResponse(
                    success=True,
                    user=user
                )

        except Exception as e:
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"Internal error: {str(e)}")

    async def UpdateUserStream(self, request_iterator, context):
        """Bidirectional streaming for batch updates"""
        try:
            async for request in request_iterator:
                user = self.users.get(request.user.id)
                if user:
                    # Update user
                    user.name = request.user.name or user.name
                    user.email = request.user.email or user.email
                    user.age = request.user.age if request.user.age else user.age

                    yield user_service_pb2.UserResponse(
                        success=True,
                        user=user,
                        message="User updated successfully"
                    )
                else:
                    yield user_service_pb2.UserResponse(
                        success=False,
                        message=f"User {request.user.id} not found"
                    )

        except Exception as e:
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"Internal error: {str(e)}")

# Interceptors for cross-cutting concerns
class AuthInterceptor(grpc.aio.ServerInterceptor):
    async def intercept_service(self, continuation, handler_call_details):
        """Authentication interceptor"""
        metadata = dict(handler_call_details.invocation_metadata)

        # Skip auth for health checks and reflection
        if handler_call_details.method in [
            '/grpc.health.v1alpha.Health/Check',
            '/grpc.reflection.v1alpha.ServerReflection/ServerReflectionInfo'
        ]:
            return await continuation(handler_call_details)

        # Validate JWT token
        auth_header = metadata.get('authorization', '')
        if not auth_header.startswith('Bearer '):
            return grpc.aio.Metadata([
                ('grpc-status', str(grpc.StatusCode.UNAUTHENTICATED)),
                ('grpc-message', 'Missing or invalid authentication token')
            ])

        token = auth_header[7:]  # Remove 'Bearer ' prefix
        try:
            # Verify token (implementation depends on your auth system)
            user = await verify_jwt_token(token)
            if not user:
                raise Exception("Invalid token")

            # Add user to context
            handler_call_details.invocation_metadata.append(('user_id', str(user.id)))

        except Exception:
            return grpc.aio.Metadata([
                ('grpc-status', str(grpc.StatusCode.UNAUTHENTICATED)),
                ('grpc-message', 'Invalid authentication token')
            ])

        return await continuation(handler_call_details)

class LoggingInterceptor(grpc.aio.ServerInterceptor):
    async def intercept_service(self, continuation, handler_call_details):
        """Logging interceptor"""
        start_time = asyncio.get_event_loop().time()

        try:
            response = await continuation(handler_call_details)
            duration = asyncio.get_event_loop().time() - start_time

            logging.info(
                f"gRPC call: {handler_call_details.method} "
                f"duration: {duration:.3f}s status: OK"
            )

            return response

        except Exception as e:
            duration = asyncio.get_event_loop().time() - start_time

            logging.error(
                f"gRPC call: {handler_call_details.method} "
                f"duration: {duration:.3f}s error: {str(e)}"
            )

            raise

# Server setup
async def serve():
    server = grpc.aio.server(
        futures.ThreadPoolExecutor(max_workers=10),
        interceptors=[
            LoggingInterceptor(),
            AuthInterceptor()
        ]
    )

    # Add services
    user_service_pb2_grpc.add_UserServiceServicer_to_server(
        UserService(), server
    )

    # Health checking
    health_servicer = health.HealthServicer()
    health_pb2_grpc.add_HealthServicer_to_server(health_servicer, server)

    # Reflection for development
    SERVICE_NAMES = (
        user_service_pb2.DESCRIPTOR.services_by_name['UserService'].full_name,
        reflection.SERVICE_NAME,
    )
    reflection.enable_server_reflection(SERVICE_NAMES, server)

    # Configure server
    listen_addr = '[::]:50051'
    server.add_insecure_port(listen_addr)

    logging.info(f"Starting gRPC server on {listen_addr}")
    await server.start()

    try:
        await server.wait_for_termination()
    except KeyboardInterrupt:
        logging.info("Shutting down gRPC server")
        await server.stop(grace=5)

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    asyncio.run(serve())
```

### API Gateway Configuration
```yaml
# Kong API Gateway configuration
services:
- name: user-service
  url: http://user-service:3000
  routes:
  - name: user-routes
    paths:
    - /api/v1/users
    methods:
    - GET
    - POST
    - PUT
    - DELETE
    plugins:
    - name: rate-limiting
      config:
        minute: 100
        hour: 1000
        policy: redis
        redis_host: redis
        redis_port: 6379
    - name: jwt
      config:
        secret_is_base64: false
        key_claim_name: iss
        claims_to_verify:
        - exp
        - iat
    - name: cors
      config:
        origins:
        - https://frontend.example.com
        methods:
        - GET
        - POST
        - PUT
        - DELETE
        - OPTIONS
        headers:
        - Accept
        - Authorization
        - Content-Type
        - X-Requested-With
        exposed_headers:
        - X-Rate-Limit-Remaining
        - X-Rate-Limit-Reset
        credentials: true
        max_age: 3600

- name: graphql-service
  url: http://graphql-service:4000
  routes:
  - name: graphql-routes
    paths:
    - /graphql
    methods:
    - POST
    - GET
    plugins:
    - name: request-size-limiting
      config:
        allowed_payload_size: 1
    - name: graphql-rate-limiting
      config:
        max_complexity: 1000
        max_depth: 15

consumers:
- username: frontend-app
  custom_id: frontend-app-id
  jwt_secrets:
  - key: frontend-secret
    algorithm: HS256

- username: mobile-app
  custom_id: mobile-app-id
  jwt_secrets:
  - key: mobile-secret
    algorithm: HS256

plugins:
- name: prometheus
  config:
    per_consumer: true
```

## API Documentation & Testing

### OpenAPI Specification
```yaml
# Comprehensive OpenAPI 3.0 specification
openapi: 3.0.3
info:
  title: Modern API
  description: |
    A comprehensive API demonstrating modern best practices including:
    - RESTful design principles
    - Comprehensive error handling
    - Security via JWT authentication
    - Rate limiting and throttling
    - Pagination and filtering
  version: 1.0.0
  contact:
    name: API Team
    email: api-team@example.com
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT

servers:
- url: https://api.example.com/v1
  description: Production server
- url: https://staging-api.example.com/v1
  description: Staging server

security:
- BearerAuth: []

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    User:
      type: object
      required:
        - id
        - email
        - name
      properties:
        id:
          type: integer
          format: int64
          example: 1
        email:
          type: string
          format: email
          example: user@example.com
        name:
          type: string
          minLength: 2
          maxLength: 100
          example: John Doe
        age:
          type: integer
          minimum: 0
          maximum: 150
          example: 30
        created_at:
          type: string
          format: date-time
          example: "2024-01-01T00:00:00Z"
        is_active:
          type: boolean
          example: true

    UserCreate:
      type: object
      required:
        - email
        - name
        - password
      properties:
        email:
          type: string
          format: email
        name:
          type: string
          minLength: 2
          maxLength: 100
        password:
          type: string
          minLength: 8
          format: password
        age:
          type: integer
          minimum: 0
          maximum: 150

    PaginatedUsers:
      type: object
      required:
        - items
        - total
        - page
        - size
        - pages
      properties:
        items:
          type: array
          items:
            $ref: '#/components/schemas/User'
        total:
          type: integer
          example: 100
        page:
          type: integer
          example: 1
        size:
          type: integer
          example: 20
        pages:
          type: integer
          example: 5

    Error:
      type: object
      required:
        - error_code
        - message
        - timestamp
      properties:
        error_code:
          type: string
          example: "VALIDATION_ERROR"
        message:
          type: string
          example: "The request data is invalid"
        details:
          type: object
          additionalProperties: true
        timestamp:
          type: string
          format: date-time

  responses:
    NotFound:
      description: Resource not found
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'

    ValidationError:
      description: Validation error
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'

    RateLimitExceeded:
      description: Rate limit exceeded
      headers:
        X-Rate-Limit-Limit:
          schema:
            type: integer
          description: Request limit per time window
        X-Rate-Limit-Remaining:
          schema:
            type: integer
          description: Remaining requests in time window
        X-Rate-Limit-Reset:
          schema:
            type: integer
          description: Time when rate limit resets
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'

paths:
  /users:
    get:
      summary: List users
      description: Retrieve a paginated list of users with optional filtering
      tags:
        - Users
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            minimum: 1
            default: 1
        - name: size
          in: query
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 20
        - name: email
          in: query
          schema:
            type: string
        - name: is_active
          in: query
          schema:
            type: boolean
      responses:
        '200':
          description: Successful response
          headers:
            X-Rate-Limit-Remaining:
              schema:
                type: integer
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PaginatedUsers'
        '400':
          $ref: '#/components/responses/ValidationError'
        '429':
          $ref: '#/components/responses/RateLimitExceeded'

    post:
      summary: Create user
      description: Create a new user account
      tags:
        - Users
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UserCreate'
      responses:
        '201':
          description: User created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '400':
          $ref: '#/components/responses/ValidationError'
        '409':
          description: User already exists
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

  /users/{userId}:
    get:
      summary: Get user
      description: Retrieve a specific user by ID
      tags:
        - Users
      parameters:
        - name: userId
          in: path
          required: true
          schema:
            type: integer
            format: int64
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '404':
          $ref: '#/components/responses/NotFound'
```

## Skill Activation Triggers

This skill automatically activates when:
- API design or development is requested
- RESTful service architecture is needed
- GraphQL schema design is required
- gRPC service implementation is requested
- API documentation or testing is needed
- Integration patterns and middleware are required

This comprehensive API design skill provides expert-level capabilities for building modern, scalable, and well-documented APIs using industry best practices and cutting-edge technologies.