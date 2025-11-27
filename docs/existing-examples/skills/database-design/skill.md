# Database Design Skill

Advanced database architecture and optimization expertise covering relational, NoSQL, and modern database technologies with performance tuning and scaling strategies.

## Skill Overview

Expert database design knowledge including schema modeling, query optimization, performance tuning, database scaling, backup strategies, and modern database technologies like PostgreSQL, MongoDB, Redis, and distributed systems.

## Core Capabilities

### Schema Design & Modeling
- **Normalization strategies** - 1NF through 5NF, denormalization for performance
- **Entity-relationship modeling** - Complex relationships, constraints, integrity
- **Data modeling patterns** - Star schema, snowflake, vault modeling
- **Migration strategies** - Zero-downtime migrations, rollback plans

### Query Optimization
- **Index strategies** - B-tree, hash, GIN, GiST, partial indexes
- **Query performance** - Execution plans, cost analysis, hint optimization
- **Advanced SQL** - Window functions, CTEs, recursive queries, JSON operations
- **Database tuning** - Configuration optimization, connection pooling

### NoSQL & Modern Databases
- **Document databases** - MongoDB, CouchDB design patterns
- **Graph databases** - Neo4j, Amazon Neptune relationship modeling
- **Time-series databases** - InfluxDB, TimescaleDB optimization
- **Search engines** - Elasticsearch, OpenSearch indexing strategies

### Scaling & Performance
- **Horizontal scaling** - Sharding strategies, distributed architectures
- **Vertical scaling** - Resource optimization, hardware tuning
- **Caching layers** - Redis, Memcached, application-level caching
- **Read replicas** - Master-slave replication, load balancing

## Advanced Database Design Patterns

### PostgreSQL Advanced Features
```sql
-- Modern PostgreSQL schema with advanced features
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Custom domain types for data validation
CREATE DOMAIN email_address AS text
CHECK (VALUE ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

CREATE DOMAIN phone_number AS text
CHECK (VALUE ~* '^\+?[1-9]\d{1,14}$');

-- Advanced table with modern PostgreSQL features
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email email_address NOT NULL UNIQUE,
    phone phone_number,
    name TEXT NOT NULL,
    profile JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    location POINT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Advanced constraints
    CONSTRAINT name_length_check CHECK (char_length(name) BETWEEN 2 AND 100),
    CONSTRAINT phone_or_email_required CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

-- Optimized indexes
CREATE INDEX CONCURRENTLY idx_users_email_gin ON users USING GIN (email gin_trgm_ops);
CREATE INDEX CONCURRENTLY idx_users_profile_gin ON users USING GIN (profile);
CREATE INDEX CONCURRENTLY idx_users_preferences_gin ON users USING GIN (preferences);
CREATE INDEX CONCURRENTLY idx_users_location_gist ON users USING GIST (location);
CREATE INDEX CONCURRENTLY idx_users_created_at_desc ON users (created_at DESC);

-- Partial indexes for common queries
CREATE INDEX CONCURRENTLY idx_users_active
ON users (id) WHERE (profile->>'status') = 'active';

-- Expression indexes
CREATE INDEX CONCURRENTLY idx_users_name_lower
ON users (LOWER(name));

-- Advanced table with partitioning
CREATE TABLE events (
    id UUID DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_data JSONB NOT NULL DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),

    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Monthly partitions
CREATE TABLE events_2024_01 PARTITION OF events
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE events_2024_02 PARTITION OF events
FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Automatic partition creation function
CREATE OR REPLACE FUNCTION create_monthly_partition()
RETURNS void AS $$
DECLARE
    start_date DATE;
    end_date DATE;
    table_name TEXT;
BEGIN
    start_date := DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month');
    end_date := start_date + INTERVAL '1 month';
    table_name := 'events_' || TO_CHAR(start_date, 'YYYY_MM');

    EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF events
                   FOR VALUES FROM (%L) TO (%L)',
                   table_name, start_date, end_date);
END;
$$ LANGUAGE plpgsql;

-- Automated partition creation
SELECT cron.schedule('create-partition', '0 0 15 * *', 'SELECT create_monthly_partition();');

-- Advanced materialized view with auto-refresh
CREATE MATERIALIZED VIEW user_analytics AS
SELECT
    u.id,
    u.name,
    u.created_at::date as signup_date,
    COUNT(e.id) as total_events,
    COUNT(DISTINCT DATE(e.created_at)) as active_days,
    MAX(e.created_at) as last_activity,
    jsonb_agg(DISTINCT e.event_type) as event_types,

    -- Advanced analytics
    percentile_cont(0.5) WITHIN GROUP (ORDER BY e.created_at) as median_activity,
    COUNT(e.id) FILTER (WHERE e.created_at >= NOW() - INTERVAL '30 days') as events_last_30d,

    -- JSON aggregation
    jsonb_build_object(
        'total_events', COUNT(e.id),
        'first_event', MIN(e.created_at),
        'last_event', MAX(e.created_at),
        'event_frequency', COUNT(e.id)::float / GREATEST(EXTRACT(days FROM NOW() - u.created_at), 1)
    ) as analytics_summary
FROM users u
LEFT JOIN events e ON u.id = e.user_id
GROUP BY u.id, u.name, u.created_at;

-- Unique index on materialized view
CREATE UNIQUE INDEX idx_user_analytics_id ON user_analytics (id);

-- Function for incremental refresh
CREATE OR REPLACE FUNCTION refresh_user_analytics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_analytics;
END;
$$ LANGUAGE plpgsql;

-- Automated refresh every hour
SELECT cron.schedule('refresh-analytics', '0 * * * *', 'SELECT refresh_user_analytics();');

-- Advanced trigger for automatic updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Advanced audit logging
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    user_id UUID,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_log (table_name, operation, old_data, new_data, user_id)
    VALUES (
        TG_TABLE_NAME,
        TG_OP,
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
        COALESCE(NEW.id, OLD.id)
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers
CREATE TRIGGER users_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- Advanced search with full-text search
ALTER TABLE users ADD COLUMN search_vector tsvector;

CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.email, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.profile->>'bio', '')), 'C');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_search_vector
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_search_vector();

-- GIN index for full-text search
CREATE INDEX CONCURRENTLY idx_users_search_vector
ON users USING GIN (search_vector);

-- Performance monitoring views
CREATE VIEW slow_queries AS
SELECT
    query,
    calls,
    total_time,
    mean_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) as hit_percent
FROM pg_stat_statements
WHERE calls > 100
ORDER BY total_time DESC
LIMIT 20;

CREATE VIEW table_stats AS
SELECT
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_tuples,
    n_dead_tup as dead_tuples,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;
```

### MongoDB Document Design
```javascript
// Advanced MongoDB schema design with validation
const mongoose = require('mongoose');

// Custom validation functions
const validators = {
  email: {
    validator: function(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },
    message: 'Invalid email format'
  },

  strongPassword: {
    validator: function(password) {
      return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);
    },
    message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
  }
};

// User schema with advanced features
const userSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: validators.email,
    index: true
  },

  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 3,
    maxlength: 30,
    trim: true,
    index: true
  },

  profile: {
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
    bio: {
      type: String,
      maxlength: 500,
      trim: true
    },
    avatar: {
      url: String,
      width: Number,
      height: Number
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        index: '2dsphere'
      },
      address: {
        street: String,
        city: String,
        state: String,
        country: String,
        zipCode: String
      }
    }
  },

  settings: {
    privacy: {
      profileVisible: { type: Boolean, default: true },
      emailVisible: { type: Boolean, default: false },
      locationVisible: { type: Boolean, default: false }
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    preferences: {
      theme: { type: String, enum: ['light', 'dark'], default: 'light' },
      language: { type: String, default: 'en' },
      timezone: { type: String, default: 'UTC' }
    }
  },

  // Security fields
  authentication: {
    passwordHash: {
      type: String,
      required: true,
      select: false  // Never include in queries by default
    },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, select: false },
    lastLogin: Date,
    loginAttempts: { type: Number, default: 0 },
    lockUntil: Date
  },

  // Social features
  social: {
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },

  // Metadata
  metadata: {
    source: { type: String, enum: ['web', 'mobile', 'api'], default: 'web' },
    referrer: String,
    ipAddress: String,
    userAgent: String,
    verificationStatus: {
      email: { type: Boolean, default: false },
      phone: { type: Boolean, default: false },
      identity: { type: Boolean, default: false }
    }
  },

  // Audit fields
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now },
  deletedAt: Date,  // Soft delete
  isActive: { type: Boolean, default: true, index: true }
}, {
  // Schema options
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.authentication;
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Virtual fields
userSchema.virtual('fullName').get(function() {
  return `${this.profile.firstName} ${this.profile.lastName}`;
});

userSchema.virtual('followerCount').get(function() {
  return this.social.followers.length;
});

userSchema.virtual('followingCount').get(function() {
  return this.social.following.length;
});

userSchema.virtual('isLocked').get(function() {
  return !!(this.authentication.lockUntil && this.authentication.lockUntil > Date.now());
});

// Compound indexes for common queries
userSchema.index({ 'profile.firstName': 1, 'profile.lastName': 1 });
userSchema.index({ createdAt: -1, isActive: 1 });
userSchema.index({ 'metadata.source': 1, createdAt: -1 });
userSchema.index({ 'social.followers': 1 });

// Text index for search
userSchema.index({
  'profile.firstName': 'text',
  'profile.lastName': 'text',
  username: 'text',
  'profile.bio': 'text'
}, {
  weights: {
    username: 10,
    'profile.firstName': 5,
    'profile.lastName': 5,
    'profile.bio': 1
  }
});

// Pre-save middleware
userSchema.pre('save', function(next) {
  // Update timestamp
  this.updatedAt = Date.now();

  // Validate location coordinates
  if (this.profile.location && this.profile.location.coordinates) {
    const [lng, lat] = this.profile.location.coordinates;
    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      return next(new Error('Invalid coordinates'));
    }
  }

  next();
});

// Post-save middleware for analytics
userSchema.post('save', async function(doc) {
  // Track user registration
  if (this.isNew) {
    await Analytics.trackEvent('user_registered', {
      userId: doc._id,
      source: doc.metadata.source,
      timestamp: doc.createdAt
    });
  }
});

// Instance methods
userSchema.methods.incrementLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.authentication.lockUntil && this.authentication.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { 'authentication.lockUntil': 1 },
      $set: { 'authentication.loginAttempts': 1 }
    });
  }

  const updates = { $inc: { 'authentication.loginAttempts': 1 } };

  // If we have max attempts and no lock, lock the account
  if (this.authentication.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { 'authentication.lockUntil': Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }

  return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { 'authentication.loginAttempts': 1, 'authentication.lockUntil': 1 }
  });
};

// Static methods
userSchema.statics.findByCredentials = async function(email, password) {
  const user = await this.findOne({
    email: email.toLowerCase(),
    isActive: true
  }).select('+authentication.passwordHash');

  if (!user || user.isLocked) {
    throw new Error('Invalid credentials or account locked');
  }

  const isMatch = await bcrypt.compare(password, user.authentication.passwordHash);

  if (!isMatch) {
    await user.incrementLoginAttempts();
    throw new Error('Invalid credentials');
  }

  // Reset login attempts on successful login
  if (user.authentication.loginAttempts > 0) {
    await user.resetLoginAttempts();
  }

  // Update last login
  user.authentication.lastLogin = Date.now();
  await user.save();

  return user;
};

userSchema.statics.searchUsers = function(query, options = {}) {
  const {
    limit = 20,
    skip = 0,
    location,
    maxDistance,
    isActive = true
  } = options;

  let searchQuery = { isActive };

  // Text search
  if (query) {
    searchQuery.$text = { $search: query };
  }

  // Location-based search
  if (location && maxDistance) {
    searchQuery['profile.location'] = {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: location
        },
        $maxDistance: maxDistance
      }
    };
  }

  return this.find(searchQuery)
    .limit(limit)
    .skip(skip)
    .sort(query ? { score: { $meta: 'textScore' } } : { createdAt: -1 });
};

// Analytics schema for user behavior
const analyticsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  event: { type: String, required: true, index: true },
  properties: mongoose.Schema.Types.Mixed,
  sessionId: { type: String, index: true },
  timestamp: { type: Date, default: Date.now, index: true },

  // User context
  userAgent: String,
  ipAddress: String,
  location: {
    type: { type: String, enum: ['Point'] },
    coordinates: [Number]
  }
});

// Time-based partitioning simulation with TTL
analyticsSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // 90 days

// Compound indexes for analytics queries
analyticsSchema.index({ userId: 1, timestamp: -1 });
analyticsSchema.index({ event: 1, timestamp: -1 });
analyticsSchema.index({ sessionId: 1, timestamp: 1 });

const User = mongoose.model('User', userSchema);
const Analytics = mongoose.model('Analytics', analyticsSchema);

module.exports = { User, Analytics };
```

### Redis Caching Strategies
```python
# Advanced Redis implementation with caching patterns
import redis
import json
import hashlib
import pickle
import asyncio
from datetime import datetime, timedelta
from typing import Any, Optional, Dict, List, Callable
from functools import wraps
import logging

class AdvancedRedisCache:
    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis_client = redis.from_url(redis_url, decode_responses=False)
        self.logger = logging.getLogger(__name__)

    def cache_key(self, prefix: str, *args, **kwargs) -> str:
        """Generate consistent cache keys"""
        key_data = f"{prefix}:{args}:{sorted(kwargs.items())}"
        return hashlib.md5(key_data.encode()).hexdigest()

    def serialize_data(self, data: Any) -> bytes:
        """Serialize data for Redis storage"""
        try:
            # Try JSON first for simple data types
            if isinstance(data, (dict, list, str, int, float, bool, type(None))):
                return json.dumps(data, default=str).encode()
            else:
                # Fall back to pickle for complex objects
                return pickle.dumps(data)
        except (TypeError, ValueError):
            return pickle.dumps(data)

    def deserialize_data(self, data: bytes) -> Any:
        """Deserialize data from Redis"""
        try:
            # Try JSON first
            return json.loads(data.decode())
        except (json.JSONDecodeError, UnicodeDecodeError):
            # Fall back to pickle
            return pickle.loads(data)

    def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        try:
            data = self.redis_client.get(key)
            if data is None:
                return None
            return self.deserialize_data(data)
        except Exception as e:
            self.logger.error(f"Cache get error for key {key}: {e}")
            return None

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set value in cache with optional TTL"""
        try:
            serialized = self.serialize_data(value)
            if ttl:
                return self.redis_client.setex(key, ttl, serialized)
            else:
                return self.redis_client.set(key, serialized)
        except Exception as e:
            self.logger.error(f"Cache set error for key {key}: {e}")
            return False

    def delete(self, key: str) -> bool:
        """Delete key from cache"""
        try:
            return bool(self.redis_client.delete(key))
        except Exception as e:
            self.logger.error(f"Cache delete error for key {key}: {e}")
            return False

    def get_many(self, keys: List[str]) -> Dict[str, Any]:
        """Get multiple values from cache"""
        try:
            pipeline = self.redis_client.pipeline()
            for key in keys:
                pipeline.get(key)

            results = pipeline.execute()

            return {
                key: self.deserialize_data(data) if data else None
                for key, data in zip(keys, results)
            }
        except Exception as e:
            self.logger.error(f"Cache get_many error: {e}")
            return {key: None for key in keys}

    def set_many(self, data: Dict[str, Any], ttl: Optional[int] = None) -> bool:
        """Set multiple values in cache"""
        try:
            pipeline = self.redis_client.pipeline()

            for key, value in data.items():
                serialized = self.serialize_data(value)
                if ttl:
                    pipeline.setex(key, ttl, serialized)
                else:
                    pipeline.set(key, serialized)

            pipeline.execute()
            return True
        except Exception as e:
            self.logger.error(f"Cache set_many error: {e}")
            return False

    def invalidate_pattern(self, pattern: str) -> int:
        """Invalidate all keys matching a pattern"""
        try:
            keys = self.redis_client.keys(pattern)
            if keys:
                return self.redis_client.delete(*keys)
            return 0
        except Exception as e:
            self.logger.error(f"Cache invalidate_pattern error: {e}")
            return 0

# Advanced caching decorators
def cache_result(ttl: int = 3600, key_prefix: str = "cache"):
    """Decorator for caching function results"""
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            cache = AdvancedRedisCache()

            # Generate cache key
            key = cache.cache_key(f"{key_prefix}:{func.__name__}", *args, **kwargs)

            # Try to get from cache
            cached_result = cache.get(key)
            if cached_result is not None:
                return cached_result

            # Execute function and cache result
            result = func(*args, **kwargs)
            cache.set(key, result, ttl)

            return result

        # Add cache management methods to the function
        wrapper.invalidate_cache = lambda *args, **kwargs: AdvancedRedisCache().delete(
            AdvancedRedisCache().cache_key(f"{key_prefix}:{func.__name__}", *args, **kwargs)
        )

        wrapper.invalidate_all = lambda: AdvancedRedisCache().invalidate_pattern(
            f"{key_prefix}:{func.__name__}:*"
        )

        return wrapper
    return decorator

def cache_model_instance(ttl: int = 1800):
    """Decorator for caching model instances"""
    def decorator(cls):
        original_init = cls.__init__
        original_save = getattr(cls, 'save', None)
        original_delete = getattr(cls, 'delete', None)

        def __init__(self, *args, **kwargs):
            original_init(self, *args, **kwargs)
            self._cache = AdvancedRedisCache()

        def get_cache_key(self):
            return f"model:{cls.__name__}:{getattr(self, 'id', None)}"

        def load_from_cache(self):
            if hasattr(self, 'id') and self.id:
                cached = self._cache.get(self.get_cache_key())
                if cached:
                    for key, value in cached.items():
                        setattr(self, key, value)
                    return True
            return False

        def save_to_cache(self):
            if hasattr(self, 'id') and self.id:
                data = {k: v for k, v in self.__dict__.items() if not k.startswith('_')}
                self._cache.set(self.get_cache_key(), data, ttl)

        def invalidate_cache(self):
            if hasattr(self, 'id') and self.id:
                self._cache.delete(self.get_cache_key())

        if original_save:
            def save(self, *args, **kwargs):
                result = original_save(self, *args, **kwargs)
                self.save_to_cache()
                return result
            cls.save = save

        if original_delete:
            def delete(self, *args, **kwargs):
                self.invalidate_cache()
                return original_delete(self, *args, **kwargs)
            cls.delete = delete

        cls.__init__ = __init__
        cls.get_cache_key = get_cache_key
        cls.load_from_cache = load_from_cache
        cls.save_to_cache = save_to_cache
        cls.invalidate_cache = invalidate_cache

        return cls
    return decorator

# Session management with Redis
class RedisSessionManager:
    def __init__(self, redis_client, session_ttl: int = 3600):
        self.redis = redis_client
        self.session_ttl = session_ttl

    def create_session(self, user_id: str, session_data: Dict[str, Any]) -> str:
        """Create a new session"""
        session_id = hashlib.sha256(f"{user_id}:{datetime.now()}".encode()).hexdigest()

        session_key = f"session:{session_id}"
        user_sessions_key = f"user_sessions:{user_id}"

        # Store session data
        self.redis.setex(session_key, self.session_ttl, json.dumps({
            'user_id': user_id,
            'created_at': datetime.now().isoformat(),
            **session_data
        }))

        # Track user sessions
        self.redis.sadd(user_sessions_key, session_id)
        self.redis.expire(user_sessions_key, self.session_ttl)

        return session_id

    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session data"""
        session_data = self.redis.get(f"session:{session_id}")
        if session_data:
            return json.loads(session_data)
        return None

    def update_session(self, session_id: str, data: Dict[str, Any]) -> bool:
        """Update session data"""
        session = self.get_session(session_id)
        if session:
            session.update(data)
            session['updated_at'] = datetime.now().isoformat()

            return self.redis.setex(
                f"session:{session_id}",
                self.session_ttl,
                json.dumps(session)
            )
        return False

    def invalidate_session(self, session_id: str) -> bool:
        """Invalidate a session"""
        session = self.get_session(session_id)
        if session:
            user_id = session['user_id']

            # Remove from user sessions
            self.redis.srem(f"user_sessions:{user_id}", session_id)

            # Delete session
            return bool(self.redis.delete(f"session:{session_id}"))
        return False

    def invalidate_all_user_sessions(self, user_id: str) -> int:
        """Invalidate all sessions for a user"""
        user_sessions_key = f"user_sessions:{user_id}"
        session_ids = self.redis.smembers(user_sessions_key)

        if session_ids:
            # Delete all session keys
            session_keys = [f"session:{sid.decode()}" for sid in session_ids]
            deleted = self.redis.delete(*session_keys)

            # Clear user sessions set
            self.redis.delete(user_sessions_key)

            return deleted
        return 0

# Usage examples
@cache_result(ttl=1800, key_prefix="user_data")
def get_user_profile(user_id: str) -> Dict[str, Any]:
    # Expensive database operation
    return {
        'id': user_id,
        'name': 'John Doe',
        'email': 'john@example.com',
        'profile_data': 'expensive_computation_result'
    }

@cache_model_instance(ttl=3600)
class User:
    def __init__(self, user_id: str, name: str):
        self.id = user_id
        self.name = name

    def save(self):
        # Save to database
        print(f"Saving user {self.id} to database")
        # Cache is automatically updated
```

## Skill Activation Triggers

This skill automatically activates when:
- Database schema design is needed
- Query optimization is requested
- Database performance tuning is required
- Migration strategies are needed
- NoSQL database architecture is requested
- Caching implementation is required

This comprehensive database design skill provides expert-level capabilities for designing, optimizing, and scaling modern database systems across relational, NoSQL, and caching technologies.