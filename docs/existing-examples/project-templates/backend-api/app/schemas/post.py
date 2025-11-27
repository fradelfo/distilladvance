"""
Pydantic schemas for post and comment-related API endpoints.
Provides request validation, response serialization, and documentation.
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, validator

from app.models.post import PostStatus


class PostCreate(BaseModel):
    """Schema for creating a new post."""
    title: str = Field(
        ...,
        min_length=1,
        max_length=200,
        description="Post title"
    )
    content: str = Field(
        ...,
        min_length=1,
        max_length=100000,
        description="Post content in markdown"
    )
    excerpt: Optional[str] = Field(
        None,
        max_length=500,
        description="Post excerpt/summary"
    )
    tags: List[str] = Field(
        default=[],
        max_items=10,
        description="Post tags (max 10)"
    )
    category: Optional[str] = Field(
        None,
        max_length=100,
        description="Post category"
    )
    meta_title: Optional[str] = Field(
        None,
        max_length=60,
        description="SEO meta title"
    )
    meta_description: Optional[str] = Field(
        None,
        max_length=160,
        description="SEO meta description"
    )
    featured_image_url: Optional[str] = Field(
        None,
        description="URL to featured image"
    )
    is_featured: bool = Field(
        default=False,
        description="Mark as featured post"
    )
    allow_comments: bool = Field(
        default=True,
        description="Allow comments on this post"
    )
    scheduled_for: Optional[datetime] = Field(
        None,
        description="Schedule post for future publication"
    )

    @validator('title')
    def validate_title(cls, v):
        if not v.strip():
            raise ValueError('Title cannot be empty')
        return v.strip()

    @validator('content')
    def validate_content(cls, v):
        if not v.strip():
            raise ValueError('Content cannot be empty')
        return v.strip()

    @validator('tags')
    def validate_tags(cls, v):
        """Clean and validate tags."""
        if not isinstance(v, list):
            raise ValueError('Tags must be a list')

        clean_tags = []
        for tag in v:
            if isinstance(tag, str) and tag.strip():
                clean_tag = tag.strip().lower()
                if len(clean_tag) <= 50 and clean_tag not in clean_tags:
                    clean_tags.append(clean_tag)

        if len(clean_tags) > 10:
            raise ValueError('Maximum 10 tags allowed')

        return clean_tags

    class Config:
        schema_extra = {
            "example": {
                "title": "Introduction to FastAPI",
                "content": "FastAPI is a modern web framework for building APIs with Python...",
                "excerpt": "Learn the basics of FastAPI framework",
                "tags": ["python", "fastapi", "web-development"],
                "category": "tutorials",
                "meta_title": "FastAPI Tutorial - Getting Started",
                "meta_description": "Complete guide to getting started with FastAPI",
                "is_featured": False,
                "allow_comments": True
            }
        }


class PostUpdate(BaseModel):
    """Schema for updating existing posts."""
    title: Optional[str] = Field(
        None,
        min_length=1,
        max_length=200,
        description="Updated post title"
    )
    content: Optional[str] = Field(
        None,
        min_length=1,
        max_length=100000,
        description="Updated post content"
    )
    excerpt: Optional[str] = Field(
        None,
        max_length=500,
        description="Updated post excerpt"
    )
    tags: Optional[List[str]] = Field(
        None,
        max_items=10,
        description="Updated post tags"
    )
    category: Optional[str] = Field(
        None,
        max_length=100,
        description="Updated post category"
    )
    meta_title: Optional[str] = Field(
        None,
        max_length=60,
        description="Updated SEO meta title"
    )
    meta_description: Optional[str] = Field(
        None,
        max_length=160,
        description="Updated SEO meta description"
    )
    featured_image_url: Optional[str] = Field(
        None,
        description="Updated featured image URL"
    )
    is_featured: Optional[bool] = Field(
        None,
        description="Update featured status"
    )
    allow_comments: Optional[bool] = Field(
        None,
        description="Update comment permissions"
    )

    @validator('title')
    def validate_title(cls, v):
        if v is not None and not v.strip():
            raise ValueError('Title cannot be empty')
        return v.strip() if v else None

    @validator('content')
    def validate_content(cls, v):
        if v is not None and not v.strip():
            raise ValueError('Content cannot be empty')
        return v.strip() if v else None

    @validator('tags')
    def validate_tags(cls, v):
        if v is None:
            return None

        if not isinstance(v, list):
            raise ValueError('Tags must be a list')

        clean_tags = []
        for tag in v:
            if isinstance(tag, str) and tag.strip():
                clean_tag = tag.strip().lower()
                if len(clean_tag) <= 50 and clean_tag not in clean_tags:
                    clean_tags.append(clean_tag)

        if len(clean_tags) > 10:
            raise ValueError('Maximum 10 tags allowed')

        return clean_tags

    class Config:
        schema_extra = {
            "example": {
                "title": "Updated: Introduction to FastAPI",
                "content": "Updated content with more examples...",
                "tags": ["python", "fastapi", "web-development", "tutorial"]
            }
        }


class PostResponse(BaseModel):
    """Schema for post data in API responses."""
    id: int
    title: str
    slug: Optional[str]
    content: str
    excerpt: Optional[str]
    status: PostStatus
    published_at: Optional[datetime]
    tags: List[str]
    category: Optional[str]
    view_count: int
    like_count: int
    comment_count: int
    is_featured: bool
    allow_comments: bool
    reading_time: int
    author_id: int
    created_at: datetime
    updated_at: datetime

    # Author information
    author: Optional[dict] = None

    class Config:
        orm_mode = True
        use_enum_values = True
        schema_extra = {
            "example": {
                "id": 1,
                "title": "Introduction to FastAPI",
                "slug": "introduction-to-fastapi",
                "content": "FastAPI is a modern web framework...",
                "excerpt": "Learn the basics of FastAPI",
                "status": "published",
                "published_at": "2024-01-01T12:00:00Z",
                "tags": ["python", "fastapi"],
                "category": "tutorials",
                "view_count": 150,
                "like_count": 25,
                "comment_count": 8,
                "is_featured": True,
                "allow_comments": True,
                "reading_time": 5,
                "author_id": 1,
                "created_at": "2024-01-01T10:00:00Z",
                "updated_at": "2024-01-01T11:00:00Z"
            }
        }


class PostListResponse(BaseModel):
    """Schema for paginated post lists."""
    posts: List[PostResponse]
    total: int
    page: int
    size: int
    pages: int

    class Config:
        schema_extra = {
            "example": {
                "posts": [],
                "total": 50,
                "page": 1,
                "size": 10,
                "pages": 5
            }
        }


class PostPublishRequest(BaseModel):
    """Schema for publishing posts."""
    scheduled_for: Optional[datetime] = Field(
        None,
        description="Schedule for future publication"
    )

    class Config:
        schema_extra = {
            "example": {
                "scheduled_for": "2024-12-31T12:00:00Z"
            }
        }


class CommentCreate(BaseModel):
    """Schema for creating comments."""
    content: str = Field(
        ...,
        min_length=1,
        max_length=5000,
        description="Comment content"
    )
    parent_id: Optional[int] = Field(
        None,
        description="ID of parent comment for threading"
    )

    @validator('content')
    def validate_content(cls, v):
        if not v.strip():
            raise ValueError('Comment content cannot be empty')
        return v.strip()

    class Config:
        schema_extra = {
            "example": {
                "content": "Great article! Thanks for sharing these insights.",
                "parent_id": None
            }
        }


class CommentUpdate(BaseModel):
    """Schema for updating comments."""
    content: str = Field(
        ...,
        min_length=1,
        max_length=5000,
        description="Updated comment content"
    )

    @validator('content')
    def validate_content(cls, v):
        if not v.strip():
            raise ValueError('Comment content cannot be empty')
        return v.strip()

    class Config:
        schema_extra = {
            "example": {
                "content": "Updated comment with additional thoughts..."
            }
        }


class CommentResponse(BaseModel):
    """Schema for comment data in API responses."""
    id: int
    content: str
    post_id: int
    author_id: int
    parent_id: Optional[int]
    is_approved: bool
    is_flagged: bool
    is_deleted: bool
    like_count: int
    dislike_count: int
    created_at: datetime
    updated_at: datetime
    depth: int

    # Author information
    author: Optional[dict] = None

    # Nested replies
    replies: List['CommentResponse'] = []

    class Config:
        orm_mode = True
        schema_extra = {
            "example": {
                "id": 1,
                "content": "Great article!",
                "post_id": 1,
                "author_id": 2,
                "parent_id": None,
                "is_approved": True,
                "is_flagged": False,
                "is_deleted": False,
                "like_count": 5,
                "dislike_count": 0,
                "created_at": "2024-01-01T13:00:00Z",
                "updated_at": "2024-01-01T13:00:00Z",
                "depth": 0,
                "replies": []
            }
        }


# Enable forward references for nested comments
CommentResponse.update_forward_refs()


class CommentListResponse(BaseModel):
    """Schema for paginated comment lists."""
    comments: List[CommentResponse]
    total: int
    page: int
    size: int
    pages: int

    class Config:
        schema_extra = {
            "example": {
                "comments": [],
                "total": 25,
                "page": 1,
                "size": 10,
                "pages": 3
            }
        }


class PostStats(BaseModel):
    """Schema for post statistics."""
    total_posts: int
    published_posts: int
    draft_posts: int
    featured_posts: int
    total_views: int
    total_likes: int
    total_comments: int
    posts_today: int
    posts_this_week: int
    posts_this_month: int
    most_popular_tags: List[dict]
    most_viewed_posts: List[dict]

    class Config:
        schema_extra = {
            "example": {
                "total_posts": 150,
                "published_posts": 120,
                "draft_posts": 30,
                "featured_posts": 15,
                "total_views": 50000,
                "total_likes": 2500,
                "total_comments": 800,
                "posts_today": 2,
                "posts_this_week": 8,
                "posts_this_month": 25,
                "most_popular_tags": [
                    {"tag": "python", "count": 45},
                    {"tag": "javascript", "count": 38}
                ],
                "most_viewed_posts": []
            }
        }


class PostSearch(BaseModel):
    """Schema for post search requests."""
    query: Optional[str] = Field(
        None,
        description="Search query for title and content"
    )
    tags: Optional[List[str]] = Field(
        None,
        description="Filter by tags"
    )
    category: Optional[str] = Field(
        None,
        description="Filter by category"
    )
    status: Optional[PostStatus] = Field(
        None,
        description="Filter by status"
    )
    author_id: Optional[int] = Field(
        None,
        description="Filter by author"
    )
    is_featured: Optional[bool] = Field(
        None,
        description="Filter featured posts"
    )
    date_from: Optional[datetime] = Field(
        None,
        description="Filter posts from date"
    )
    date_to: Optional[datetime] = Field(
        None,
        description="Filter posts to date"
    )
    sort_by: str = Field(
        default="created_at",
        description="Sort field"
    )
    sort_order: str = Field(
        default="desc",
        regex="^(asc|desc)$",
        description="Sort order (asc/desc)"
    )

    class Config:
        use_enum_values = True
        schema_extra = {
            "example": {
                "query": "FastAPI tutorial",
                "tags": ["python", "fastapi"],
                "category": "tutorials",
                "status": "published",
                "is_featured": True,
                "sort_by": "published_at",
                "sort_order": "desc"
            }
        }