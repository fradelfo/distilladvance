"""
Database configuration and session management.
Handles async SQLAlchemy setup, connection pooling, and database initialization.
"""

import logging
from typing import AsyncGenerator

from sqlalchemy import MetaData
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.pool import NullPool, QueuePool

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Create async engine with proper configuration
engine = create_async_engine(
    settings.database_url,
    echo=settings.database_echo,
    future=True,
    pool_size=settings.database_pool_size,
    max_overflow=settings.database_max_overflow,
    pool_timeout=settings.database_pool_timeout,
    pool_recycle=settings.database_pool_recycle,
    poolclass=QueuePool if not settings.database_url.startswith("sqlite") else NullPool,
    pool_pre_ping=True,  # Enable connection health checks
)

# Create async session factory
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Create base model class
metadata = MetaData(
    naming_convention={
        "ix": "ix_%(column_0_label)s",
        "uq": "uq_%(table_name)s_%(column_0_name)s",
        "ck": "ck_%(table_name)s_%(constraint_name)s",
        "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
        "pk": "pk_%(table_name)s"
    }
)

Base = declarative_base(metadata=metadata)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency function to get database session.

    Yields:
        AsyncSession: Database session for dependency injection

    Example:
        @app.get("/users")
        async def get_users(session: AsyncSession = Depends(get_session)):
            result = await session.execute(select(User))
            return result.scalars().all()
    """
    async with async_session_maker() as session:
        try:
            yield session
        except Exception as e:
            logger.error(f"Database session error: {e}")
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """
    Initialize database tables.
    Creates all tables defined in models if they don't exist.
    """
    try:
        logger.info("Initializing database...")

        # Import all models to ensure they're registered
        from app.models.user import User
        from app.models.post import Post, Comment

        # Create all tables
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        logger.info("Database initialized successfully")

    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise


async def close_db() -> None:
    """
    Close database connections.
    Should be called during application shutdown.
    """
    try:
        await engine.dispose()
        logger.info("Database connections closed")
    except Exception as e:
        logger.error(f"Error closing database: {e}")


async def check_db_connection() -> bool:
    """
    Check if database connection is working.

    Returns:
        bool: True if connection is successful, False otherwise
    """
    try:
        async with async_session_maker() as session:
            await session.execute("SELECT 1")
            return True
    except Exception as e:
        logger.error(f"Database connection check failed: {e}")
        return False


async def create_admin_user() -> None:
    """
    Create default admin user if it doesn't exist.
    Should be called after database initialization.
    """
    try:
        from app.models.user import User, UserRole

        async with async_session_maker() as session:
            # Check if admin user exists
            from sqlalchemy import select
            result = await session.execute(
                select(User).where(User.role == UserRole.ADMIN)
            )
            admin_user = result.scalar_one_or_none()

            if not admin_user:
                # Create default admin user
                admin_user = User(
                    email="admin@example.com",
                    full_name="System Administrator",
                    role=UserRole.ADMIN,
                    is_active=True,
                    is_verified=True
                )
                admin_user.set_password("admin123")  # Change this in production!

                session.add(admin_user)
                await session.commit()

                logger.info("Default admin user created: admin@example.com")
            else:
                logger.info("Admin user already exists")

    except Exception as e:
        logger.error(f"Failed to create admin user: {e}")


# Database transaction utilities
class DatabaseTransaction:
    """
    Context manager for database transactions.

    Example:
        async def create_user_with_post():
            async with DatabaseTransaction() as session:
                user = User(...)
                session.add(user)
                await session.flush()  # Get user.id

                post = Post(author_id=user.id, ...)
                session.add(post)
                # Automatically commits on success or rolls back on error
    """

    def __init__(self, session: AsyncSession = None):
        self.session = session
        self.should_close = session is None

    async def __aenter__(self) -> AsyncSession:
        if self.session is None:
            self.session = async_session_maker()
        return self.session

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            await self.session.rollback()
            logger.error(f"Transaction rolled back: {exc_val}")
        else:
            try:
                await self.session.commit()
            except Exception as e:
                await self.session.rollback()
                logger.error(f"Transaction commit failed: {e}")
                raise

        if self.should_close:
            await self.session.close()


# Database health monitoring
class DatabaseHealth:
    """Database health monitoring utilities."""

    @staticmethod
    async def get_connection_count() -> int:
        """Get current number of database connections."""
        try:
            async with async_session_maker() as session:
                result = await session.execute(
                    "SELECT count(*) FROM pg_stat_activity WHERE state = 'active'"
                )
                return result.scalar() or 0
        except Exception:
            return -1

    @staticmethod
    async def get_database_size() -> str:
        """Get database size in human-readable format."""
        try:
            async with async_session_maker() as session:
                result = await session.execute(
                    "SELECT pg_size_pretty(pg_database_size(current_database()))"
                )
                return result.scalar() or "Unknown"
        except Exception:
            return "Unknown"

    @staticmethod
    async def get_table_stats() -> dict:
        """Get statistics for all tables."""
        try:
            async with async_session_maker() as session:
                result = await session.execute("""
                    SELECT
                        schemaname,
                        tablename,
                        n_tup_ins as inserts,
                        n_tup_upd as updates,
                        n_tup_del as deletes,
                        n_live_tup as live_tuples,
                        n_dead_tup as dead_tuples
                    FROM pg_stat_user_tables
                    ORDER BY n_live_tup DESC
                """)

                stats = {}
                for row in result:
                    table_name = f"{row.schemaname}.{row.tablename}"
                    stats[table_name] = {
                        "inserts": row.inserts,
                        "updates": row.updates,
                        "deletes": row.deletes,
                        "live_tuples": row.live_tuples,
                        "dead_tuples": row.dead_tuples
                    }

                return stats
        except Exception:
            return {}