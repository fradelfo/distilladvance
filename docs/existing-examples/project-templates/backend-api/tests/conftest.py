"""
Pytest configuration and shared test fixtures.
Provides database setup, test client, and authentication helpers for testing.
"""

import asyncio
import pytest
import pytest_asyncio
from typing import AsyncGenerator, Generator
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool
import time

from app.main import create_app
from app.core.database import Base, get_session
from app.core.security import create_session_token, hash_password
from app.models.user import User, UserRole
from app.models.post import Post, PostStatus


# Test database configuration
TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session")
async def test_engine():
    """Create test database engine."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
        poolclass=StaticPool,
        connect_args={"check_same_thread": False}
    )

    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    # Clean up
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create a test database session."""
    async_session_maker = async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False
    )

    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.rollback()
            await session.close()


@pytest.fixture
def app(db_session):
    """Create FastAPI test application."""
    app = create_app()

    # Override database dependency
    async def get_test_session():
        yield db_session

    app.dependency_overrides[get_session] = get_test_session

    return app


@pytest.fixture
def client(app) -> TestClient:
    """Create test client."""
    return TestClient(app)


# User fixtures
@pytest_asyncio.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create a test user."""
    user = User(
        email="test@example.com",
        full_name="Test User",
        role=UserRole.USER,
        is_active=True,
        is_verified=True
    )
    user.set_password("testpassword123")

    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    return user


@pytest_asyncio.fixture
async def test_admin(db_session: AsyncSession) -> User:
    """Create a test admin user."""
    admin = User(
        email="admin@example.com",
        full_name="Admin User",
        role=UserRole.ADMIN,
        is_active=True,
        is_verified=True
    )
    admin.set_password("adminpassword123")

    db_session.add(admin)
    await db_session.commit()
    await db_session.refresh(admin)

    return admin


@pytest_asyncio.fixture
async def test_moderator(db_session: AsyncSession) -> User:
    """Create a test moderator user."""
    moderator = User(
        email="moderator@example.com",
        full_name="Moderator User",
        role=UserRole.MODERATOR,
        is_active=True,
        is_verified=True
    )
    moderator.set_password("moderatorpassword123")

    db_session.add(moderator)
    await db_session.commit()
    await db_session.refresh(moderator)

    return moderator


# Authentication fixtures
@pytest.fixture
def user_token(test_user: User) -> str:
    """Create access token for test user."""
    tokens = create_session_token(str(test_user.id))
    return tokens["access_token"]


@pytest.fixture
def admin_token(test_admin: User) -> str:
    """Create access token for test admin."""
    tokens = create_session_token(str(test_admin.id))
    return tokens["access_token"]


@pytest.fixture
def moderator_token(test_moderator: User) -> str:
    """Create access token for test moderator."""
    tokens = create_session_token(str(test_moderator.id))
    return tokens["access_token"]


@pytest.fixture
def auth_headers(user_token: str) -> dict:
    """Create authorization headers for test user."""
    return {"Authorization": f"Bearer {user_token}"}


@pytest.fixture
def admin_headers(admin_token: str) -> dict:
    """Create authorization headers for test admin."""
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture
def moderator_headers(moderator_token: str) -> dict:
    """Create authorization headers for test moderator."""
    return {"Authorization": f"Bearer {moderator_token}"}


# Post fixtures
@pytest_asyncio.fixture
async def test_post(db_session: AsyncSession, test_user: User) -> Post:
    """Create a test post."""
    post = Post(
        title="Test Post",
        content="This is a test post content.",
        excerpt="Test excerpt",
        tags=["test", "example"],
        category="testing",
        status=PostStatus.PUBLISHED,
        published_at=time.time(),
        author_id=test_user.id,
        allow_comments=True
    )
    post.generate_slug()

    db_session.add(post)
    await db_session.commit()
    await db_session.refresh(post)

    return post


@pytest_asyncio.fixture
async def test_draft_post(db_session: AsyncSession, test_user: User) -> Post:
    """Create a test draft post."""
    post = Post(
        title="Draft Post",
        content="This is a draft post content.",
        author_id=test_user.id,
        status=PostStatus.DRAFT
    )

    db_session.add(post)
    await db_session.commit()
    await db_session.refresh(post)

    return post


# Helper functions
def create_user_data(**kwargs) -> dict:
    """Create user registration data."""
    default_data = {
        "email": "newuser@example.com",
        "password": "securepassword123",
        "full_name": "New User",
        "accept_terms": True
    }
    default_data.update(kwargs)
    return default_data


def create_post_data(**kwargs) -> dict:
    """Create post creation data."""
    default_data = {
        "title": "New Test Post",
        "content": "This is the content of a new test post.",
        "excerpt": "Test excerpt",
        "tags": ["new", "test"],
        "category": "testing",
        "allow_comments": True
    }
    default_data.update(kwargs)
    return default_data


def create_comment_data(**kwargs) -> dict:
    """Create comment creation data."""
    default_data = {
        "content": "This is a test comment.",
    }
    default_data.update(kwargs)
    return default_data


# Test utilities
class TestUtils:
    """Utility class for common test operations."""

    @staticmethod
    async def create_users(db_session: AsyncSession, count: int = 5) -> list[User]:
        """Create multiple test users."""
        users = []
        for i in range(count):
            user = User(
                email=f"user{i}@example.com",
                full_name=f"Test User {i}",
                role=UserRole.USER,
                is_active=True,
                is_verified=True
            )
            user.set_password(f"password{i}")
            db_session.add(user)
            users.append(user)

        await db_session.commit()
        return users

    @staticmethod
    async def create_posts(
        db_session: AsyncSession,
        author: User,
        count: int = 5,
        status: PostStatus = PostStatus.PUBLISHED
    ) -> list[Post]:
        """Create multiple test posts."""
        posts = []
        for i in range(count):
            post = Post(
                title=f"Test Post {i}",
                content=f"This is test post {i} content.",
                excerpt=f"Excerpt for post {i}",
                tags=[f"tag{i}", "test"],
                category="testing",
                author_id=author.id,
                status=status
            )

            if status == PostStatus.PUBLISHED:
                post.published_at = time.time()

            post.generate_slug()
            db_session.add(post)
            posts.append(post)

        await db_session.commit()
        return posts

    @staticmethod
    def assert_error_response(response, status_code: int, error_code: str = None):
        """Assert error response format."""
        assert response.status_code == status_code
        data = response.json()
        assert data["success"] is False
        assert "error" in data
        assert "message" in data["error"]

        if error_code:
            assert data["error"]["code"] == error_code

    @staticmethod
    def assert_success_response(response, status_code: int = 200):
        """Assert successful response format."""
        assert response.status_code == status_code
        data = response.json()

        # Check if it's a success response format or direct data
        if "success" in data:
            assert data["success"] is True