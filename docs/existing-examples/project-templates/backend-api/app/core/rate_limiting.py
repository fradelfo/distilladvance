"""
Rate limiting implementation using Redis for distributed applications.
Provides sliding window rate limiting with different strategies.
"""

import asyncio
import time
from typing import Optional, Dict, Any
from dataclasses import dataclass
from enum import Enum

try:
    import redis.asyncio as redis
except ImportError:
    redis = None

from app.core.exceptions import RateLimitExceededException


class RateLimitStrategy(Enum):
    """Rate limiting strategies."""
    FIXED_WINDOW = "fixed_window"
    SLIDING_WINDOW = "sliding_window"
    TOKEN_BUCKET = "token_bucket"


@dataclass
class RateLimit:
    """Rate limit configuration."""
    requests: int
    window: int  # seconds
    strategy: RateLimitStrategy = RateLimitStrategy.SLIDING_WINDOW


class RateLimiter:
    """
    Redis-based rate limiter with support for multiple strategies.

    Features:
    - Sliding window rate limiting
    - Fixed window rate limiting
    - Token bucket algorithm
    - Per-user and per-IP rate limiting
    - Burst handling
    - Distributed rate limiting across multiple servers
    """

    def __init__(
        self,
        redis_url: str = "redis://localhost:6379/0",
        default_limit: RateLimit = RateLimit(100, 60),
        enable_burst: bool = True,
        burst_multiplier: float = 1.5
    ):
        self.redis_url = redis_url
        self.default_limit = default_limit
        self.enable_burst = enable_burst
        self.burst_multiplier = burst_multiplier
        self._redis_pool = None

        # In-memory fallback when Redis is not available
        self._memory_store: Dict[str, Dict[str, Any]] = {}
        self._cleanup_interval = 60  # seconds

    async def _get_redis(self):
        """Get Redis connection pool."""
        if not redis:
            return None

        if not self._redis_pool:
            try:
                self._redis_pool = redis.ConnectionPool.from_url(
                    self.redis_url,
                    max_connections=10,
                    retry_on_timeout=True,
                    socket_connect_timeout=5,
                    socket_timeout=5
                )
            except Exception:
                return None

        return redis.Redis(connection_pool=self._redis_pool)

    async def check_rate_limit(
        self,
        identifier: str,
        limit: Optional[RateLimit] = None,
        cost: int = 1
    ) -> Dict[str, Any]:
        """
        Check if request is within rate limit.

        Args:
            identifier: Unique identifier (user_id, IP address, etc.)
            limit: Rate limit configuration (uses default if None)
            cost: Request cost (for weighted rate limiting)

        Returns:
            Dict with rate limit info

        Raises:
            RateLimitExceededException: When rate limit is exceeded

        Example:
            rate_info = await rate_limiter.check_rate_limit("user_123")
            print(f"Remaining: {rate_info['remaining']}")
        """
        if limit is None:
            limit = self.default_limit

        redis_client = await self._get_redis()

        if redis_client:
            rate_info = await self._check_redis_rate_limit(
                redis_client, identifier, limit, cost
            )
        else:
            rate_info = await self._check_memory_rate_limit(
                identifier, limit, cost
            )

        if rate_info["exceeded"]:
            raise RateLimitExceededException(
                message=f"Rate limit exceeded for {identifier}",
                retry_after=rate_info.get("retry_after", 60),
                limit=limit.requests,
                window=limit.window
            )

        return rate_info

    async def _check_redis_rate_limit(
        self,
        redis_client,
        identifier: str,
        limit: RateLimit,
        cost: int
    ) -> Dict[str, Any]:
        """Check rate limit using Redis."""
        current_time = int(time.time())

        if limit.strategy == RateLimitStrategy.SLIDING_WINDOW:
            return await self._sliding_window_redis(
                redis_client, identifier, limit, cost, current_time
            )
        elif limit.strategy == RateLimitStrategy.FIXED_WINDOW:
            return await self._fixed_window_redis(
                redis_client, identifier, limit, cost, current_time
            )
        elif limit.strategy == RateLimitStrategy.TOKEN_BUCKET:
            return await self._token_bucket_redis(
                redis_client, identifier, limit, cost, current_time
            )

    async def _sliding_window_redis(
        self,
        redis_client,
        identifier: str,
        limit: RateLimit,
        cost: int,
        current_time: int
    ) -> Dict[str, Any]:
        """Sliding window rate limiting with Redis."""
        key = f"rate_limit:sliding:{identifier}"
        window_start = current_time - limit.window

        async with redis_client.pipeline(transaction=True) as pipe:
            # Remove old entries
            await pipe.zremrangebyscore(key, 0, window_start)

            # Count current requests
            await pipe.zcard(key)

            # Add current request
            await pipe.zadd(key, {f"{current_time}:{cost}": current_time})

            # Set expiration
            await pipe.expire(key, limit.window + 60)

            results = await pipe.execute()

        current_requests = results[1]
        current_requests += cost  # Include current request

        # Check for burst allowance
        max_requests = limit.requests
        if self.enable_burst:
            max_requests = int(limit.requests * self.burst_multiplier)

        exceeded = current_requests > max_requests
        remaining = max(0, limit.requests - current_requests)
        retry_after = limit.window if exceeded else 0

        return {
            "exceeded": exceeded,
            "limit": limit.requests,
            "remaining": remaining,
            "reset_time": current_time + limit.window,
            "retry_after": retry_after,
            "strategy": limit.strategy.value
        }

    async def _fixed_window_redis(
        self,
        redis_client,
        identifier: str,
        limit: RateLimit,
        cost: int,
        current_time: int
    ) -> Dict[str, Any]:
        """Fixed window rate limiting with Redis."""
        window_start = (current_time // limit.window) * limit.window
        key = f"rate_limit:fixed:{identifier}:{window_start}"

        async with redis_client.pipeline(transaction=True) as pipe:
            await pipe.get(key)
            await pipe.incrby(key, cost)
            await pipe.expire(key, limit.window + 60)
            results = await pipe.execute()

        current_requests = int(results[1] or 0)

        exceeded = current_requests > limit.requests
        remaining = max(0, limit.requests - current_requests)
        reset_time = window_start + limit.window
        retry_after = reset_time - current_time if exceeded else 0

        return {
            "exceeded": exceeded,
            "limit": limit.requests,
            "remaining": remaining,
            "reset_time": reset_time,
            "retry_after": retry_after,
            "strategy": limit.strategy.value
        }

    async def _token_bucket_redis(
        self,
        redis_client,
        identifier: str,
        limit: RateLimit,
        cost: int,
        current_time: int
    ) -> Dict[str, Any]:
        """Token bucket rate limiting with Redis."""
        key = f"rate_limit:bucket:{identifier}"

        # Lua script for atomic token bucket operation
        lua_script = """
        local key = KEYS[1]
        local capacity = tonumber(ARGV[1])
        local refill_rate = tonumber(ARGV[2])
        local cost = tonumber(ARGV[3])
        local current_time = tonumber(ARGV[4])

        local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')
        local tokens = tonumber(bucket[1]) or capacity
        local last_refill = tonumber(bucket[2]) or current_time

        -- Calculate tokens to add based on time passed
        local time_passed = current_time - last_refill
        local tokens_to_add = time_passed * refill_rate
        tokens = math.min(capacity, tokens + tokens_to_add)

        local can_consume = tokens >= cost
        if can_consume then
            tokens = tokens - cost
        end

        -- Update bucket state
        redis.call('HMSET', key, 'tokens', tokens, 'last_refill', current_time)
        redis.call('EXPIRE', key, 3600)  -- Expire after 1 hour of inactivity

        return {can_consume and 1 or 0, tokens}
        """

        refill_rate = limit.requests / limit.window  # tokens per second

        result = await redis_client.eval(
            lua_script,
            1,
            key,
            limit.requests,  # capacity
            refill_rate,
            cost,
            current_time
        )

        can_consume = bool(result[0])
        remaining_tokens = result[1]

        retry_after = 0
        if not can_consume:
            # Calculate time needed to get enough tokens
            retry_after = int((cost - remaining_tokens) / refill_rate) + 1

        return {
            "exceeded": not can_consume,
            "limit": limit.requests,
            "remaining": int(remaining_tokens),
            "reset_time": current_time + (limit.requests / refill_rate),
            "retry_after": retry_after,
            "strategy": limit.strategy.value
        }

    async def _check_memory_rate_limit(
        self,
        identifier: str,
        limit: RateLimit,
        cost: int
    ) -> Dict[str, Any]:
        """Fallback in-memory rate limiting."""
        current_time = int(time.time())

        # Cleanup old entries periodically
        if len(self._memory_store) > 1000:
            await self._cleanup_memory_store(current_time)

        if identifier not in self._memory_store:
            self._memory_store[identifier] = {
                "requests": [],
                "last_access": current_time
            }

        user_data = self._memory_store[identifier]
        user_data["last_access"] = current_time

        # Remove old requests
        window_start = current_time - limit.window
        user_data["requests"] = [
            req for req in user_data["requests"]
            if req >= window_start
        ]

        # Count current requests
        current_requests = len(user_data["requests"]) + cost

        exceeded = current_requests > limit.requests
        remaining = max(0, limit.requests - current_requests)

        if not exceeded:
            # Add current request(s)
            user_data["requests"].extend([current_time] * cost)

        return {
            "exceeded": exceeded,
            "limit": limit.requests,
            "remaining": remaining,
            "reset_time": current_time + limit.window,
            "retry_after": limit.window if exceeded else 0,
            "strategy": "memory_fallback"
        }

    async def _cleanup_memory_store(self, current_time: int):
        """Clean up old entries from memory store."""
        cutoff_time = current_time - 3600  # 1 hour
        to_remove = [
            identifier for identifier, data in self._memory_store.items()
            if data["last_access"] < cutoff_time
        ]

        for identifier in to_remove:
            del self._memory_store[identifier]

    async def get_rate_limit_info(
        self,
        identifier: str,
        limit: Optional[RateLimit] = None
    ) -> Dict[str, Any]:
        """
        Get current rate limit status without consuming tokens.

        Args:
            identifier: Unique identifier
            limit: Rate limit configuration

        Returns:
            Dict with current rate limit status
        """
        if limit is None:
            limit = self.default_limit

        redis_client = await self._get_redis()
        current_time = int(time.time())

        if redis_client:
            key = f"rate_limit:sliding:{identifier}"
            window_start = current_time - limit.window

            # Remove old entries and count current requests
            async with redis_client.pipeline(transaction=True) as pipe:
                await pipe.zremrangebyscore(key, 0, window_start)
                await pipe.zcard(key)
                results = await pipe.execute()

            current_requests = results[1]
            remaining = max(0, limit.requests - current_requests)

            return {
                "limit": limit.requests,
                "remaining": remaining,
                "reset_time": current_time + limit.window,
                "current_requests": current_requests
            }

        else:
            # Memory fallback
            if identifier not in self._memory_store:
                return {
                    "limit": limit.requests,
                    "remaining": limit.requests,
                    "reset_time": current_time + limit.window,
                    "current_requests": 0
                }

            user_data = self._memory_store[identifier]
            window_start = current_time - limit.window
            current_requests = sum(
                1 for req in user_data["requests"]
                if req >= window_start
            )

            remaining = max(0, limit.requests - current_requests)

            return {
                "limit": limit.requests,
                "remaining": remaining,
                "reset_time": current_time + limit.window,
                "current_requests": current_requests
            }

    async def reset_rate_limit(self, identifier: str) -> bool:
        """
        Reset rate limit for an identifier.

        Args:
            identifier: Unique identifier to reset

        Returns:
            bool: True if reset was successful
        """
        redis_client = await self._get_redis()

        if redis_client:
            # Remove all rate limit keys for this identifier
            keys = await redis_client.keys(f"rate_limit:*:{identifier}*")
            if keys:
                await redis_client.delete(*keys)
            return True
        else:
            # Memory fallback
            if identifier in self._memory_store:
                del self._memory_store[identifier]
            return True

    async def close(self):
        """Close Redis connection pool."""
        if self._redis_pool:
            await self._redis_pool.disconnect()


# Predefined rate limit configurations
class RateLimits:
    """Common rate limit configurations."""

    # API rate limits
    API_STRICT = RateLimit(10, 60)  # 10 requests per minute
    API_NORMAL = RateLimit(100, 60)  # 100 requests per minute
    API_GENEROUS = RateLimit(1000, 60)  # 1000 requests per minute

    # Authentication rate limits
    LOGIN_ATTEMPTS = RateLimit(5, 300)  # 5 attempts per 5 minutes
    PASSWORD_RESET = RateLimit(3, 3600)  # 3 resets per hour
    EMAIL_VERIFICATION = RateLimit(5, 3600)  # 5 verifications per hour

    # Content creation rate limits
    POST_CREATION = RateLimit(10, 3600)  # 10 posts per hour
    COMMENT_CREATION = RateLimit(30, 3600)  # 30 comments per hour
    FILE_UPLOAD = RateLimit(20, 3600)  # 20 uploads per hour

    # Search and read operations
    SEARCH_QUERIES = RateLimit(100, 60)  # 100 searches per minute
    BULK_OPERATIONS = RateLimit(10, 300)  # 10 bulk ops per 5 minutes