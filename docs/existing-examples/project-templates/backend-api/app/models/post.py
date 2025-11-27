"""
Post and Comment models for blog functionality.
Includes content management, status tracking, and engagement metrics.
"""

import enum
import time
from typing import List, Optional

from sqlalchemy import (
    Column, Integer, String, Text, Boolean, Float, Enum, ForeignKey,
    Index, JSON, CheckConstraint
)
from sqlalchemy.orm import relationship, validates
from sqlalchemy.ext.hybrid import hybrid_property

from app.core.database import Base


class PostStatus(enum.Enum):
    """Post publication status."""
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"
    DELETED = "deleted"

    def __str__(self):
        return self.value


class Post(Base):
    """
    Blog post model with content management and engagement tracking.

    Features:
    - Content management with title, content, and excerpt
    - Publication status workflow (draft -> published -> archived)
    - SEO-friendly slugs and metadata
    - Tag system for categorization
    - View and engagement tracking
    - Comment threading support
    - Author relationship with permissions
    """
    __tablename__ = "posts"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)

    # Content fields
    title = Column(String(200), nullable=False, index=True)
    slug = Column(String(250), unique=True, nullable=True, index=True)
    content = Column(Text, nullable=False)
    excerpt = Column(String(500), nullable=True)

    # SEO and metadata
    meta_title = Column(String(60), nullable=True)
    meta_description = Column(String(160), nullable=True)
    featured_image_url = Column(String, nullable=True)

    # Publication management
    status = Column(Enum(PostStatus), default=PostStatus.DRAFT, nullable=False, index=True)
    published_at = Column(Float, nullable=True, index=True)
    scheduled_for = Column(Float, nullable=True)

    # Categorization and tags
    tags = Column(JSON, default=list, nullable=False)
    category = Column(String(100), nullable=True, index=True)

    # Engagement metrics
    view_count = Column(Integer, default=0, nullable=False)
    like_count = Column(Integer, default=0, nullable=False)
    comment_count = Column(Integer, default=0, nullable=False)
    share_count = Column(Integer, default=0, nullable=False)

    # Content flags
    is_featured = Column(Boolean, default=False, nullable=False, index=True)
    is_pinned = Column(Boolean, default=False, nullable=False)
    allow_comments = Column(Boolean, default=True, nullable=False)

    # Author relationship
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    author = relationship("User", back_populates="posts")

    # Audit fields
    created_at = Column(Float, default=time.time, nullable=False, index=True)
    updated_at = Column(Float, default=time.time, onupdate=time.time, nullable=False)

    # Editor tracking (for collaborative editing)
    last_edited_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    edit_count = Column(Integer, default=0, nullable=False)

    # Relationships
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")

    # Database constraints and indexes
    __table_args__ = (
        Index('ix_post_status_published', 'status', 'published_at'),
        Index('ix_post_author_status', 'author_id', 'status'),
        Index('ix_post_featured_status', 'is_featured', 'status'),
        Index('ix_post_category_status', 'category', 'status'),
        CheckConstraint('view_count >= 0', name='ck_post_view_count_positive'),
        CheckConstraint('like_count >= 0', name='ck_post_like_count_positive'),
        CheckConstraint('comment_count >= 0', name='ck_post_comment_count_positive'),
        CheckConstraint(
            "status != 'published' OR published_at IS NOT NULL",
            name='ck_post_published_at_required'
        ),
        CheckConstraint('length(title) >= 1', name='ck_post_title_not_empty'),
        CheckConstraint('length(content) >= 1', name='ck_post_content_not_empty'),
    )

    def __repr__(self):
        return f"<Post(id={self.id}, title='{self.title[:50]}...', status={self.status.value})>"

    @validates('title')
    def validate_title(self, key, title):
        """Validate post title."""
        if not title or len(title.strip()) == 0:
            raise ValueError("Post title cannot be empty")
        if len(title) > 200:
            raise ValueError("Post title too long (max 200 characters)")
        return title.strip()

    @validates('content')
    def validate_content(self, key, content):
        """Validate post content."""
        if not content or len(content.strip()) == 0:
            raise ValueError("Post content cannot be empty")
        if len(content) > 100000:  # 100KB limit
            raise ValueError("Post content too long (max 100KB)")
        return content

    @validates('tags')
    def validate_tags(self, key, tags):
        """Validate post tags."""
        if not isinstance(tags, list):
            raise ValueError("Tags must be a list")

        # Limit number of tags
        if len(tags) > 10:
            raise ValueError("Maximum 10 tags allowed")

        # Validate individual tags
        validated_tags = []
        for tag in tags:
            if isinstance(tag, str) and tag.strip():
                clean_tag = tag.strip().lower()
                if len(clean_tag) <= 50 and clean_tag not in validated_tags:
                    validated_tags.append(clean_tag)

        return validated_tags

    @hybrid_property
    def is_published(self):
        """Check if post is published."""
        return self.status == PostStatus.PUBLISHED

    @hybrid_property
    def reading_time(self):
        """Estimate reading time in minutes (based on 200 words per minute)."""
        word_count = len(self.content.split())
        return max(1, round(word_count / 200))

    def generate_slug(self) -> str:
        """Generate URL-friendly slug from title."""
        import re
        # Convert to lowercase and replace spaces with hyphens
        slug = re.sub(r'[^\w\s-]', '', self.title.lower())
        slug = re.sub(r'[-\s]+', '-', slug)
        # Remove leading/trailing hyphens
        slug = slug.strip('-')

        # Ensure uniqueness by adding timestamp if needed
        if not slug:
            slug = f"post-{int(time.time())}"

        self.slug = slug
        return slug

    def publish(self) -> None:
        """Publish the post."""
        if self.status != PostStatus.DRAFT:
            raise ValueError(f"Cannot publish post with status {self.status.value}")

        self.status = PostStatus.PUBLISHED
        self.published_at = time.time()

        # Generate slug if not exists
        if not self.slug:
            self.generate_slug()

        # Auto-generate excerpt if not provided
        if not self.excerpt:
            self.excerpt = self.content[:200] + "..." if len(self.content) > 200 else self.content

    def unpublish(self) -> None:
        """Unpublish the post (move to draft)."""
        if self.status != PostStatus.PUBLISHED:
            raise ValueError(f"Cannot unpublish post with status {self.status.value}")

        self.status = PostStatus.DRAFT

    def archive(self) -> None:
        """Archive the post."""
        if self.status not in [PostStatus.PUBLISHED, PostStatus.DRAFT]:
            raise ValueError(f"Cannot archive post with status {self.status.value}")

        self.status = PostStatus.ARCHIVED

    def can_be_edited_by(self, user) -> bool:
        """Check if user can edit this post."""
        from app.models.user import UserRole

        # Author can always edit their own posts
        if user.id == self.author_id:
            return True

        # Admins can edit any post
        if user.role >= UserRole.ADMIN:
            return True

        # Moderators can edit published posts
        if user.role >= UserRole.MODERATOR and self.status == PostStatus.PUBLISHED:
            return True

        return False

    def can_be_deleted_by(self, user) -> bool:
        """Check if user can delete this post."""
        from app.models.user import UserRole

        # Only authors and admins can delete posts
        if user.id == self.author_id or user.role >= UserRole.ADMIN:
            return True

        return False

    def increment_view(self) -> None:
        """Increment view count."""
        self.view_count += 1

    def add_tag(self, tag: str) -> bool:
        """Add a tag to the post."""
        clean_tag = tag.strip().lower()
        if clean_tag and clean_tag not in self.tags and len(self.tags) < 10:
            self.tags = self.tags + [clean_tag]
            return True
        return False

    def remove_tag(self, tag: str) -> bool:
        """Remove a tag from the post."""
        clean_tag = tag.strip().lower()
        if clean_tag in self.tags:
            self.tags = [t for t in self.tags if t != clean_tag]
            return True
        return False

    def to_dict(self) -> dict:
        """Convert post to dictionary for serialization."""
        return {
            "id": self.id,
            "title": self.title,
            "slug": self.slug,
            "content": self.content,
            "excerpt": self.excerpt,
            "status": self.status.value,
            "published_at": self.published_at,
            "tags": self.tags,
            "category": self.category,
            "view_count": self.view_count,
            "like_count": self.like_count,
            "comment_count": self.comment_count,
            "is_featured": self.is_featured,
            "reading_time": self.reading_time,
            "author_id": self.author_id,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }


class Comment(Base):
    """
    Comment model for post discussions.

    Features:
    - Threaded comments with parent/child relationships
    - Content moderation and status tracking
    - Like/dislike system
    - Author relationship
    - Audit trail
    """
    __tablename__ = "comments"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)

    # Content
    content = Column(Text, nullable=False)

    # Relationships
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False, index=True)
    post = relationship("Post", back_populates="comments")

    author_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    author = relationship("User", back_populates="comments")

    # Threading support
    parent_id = Column(Integer, ForeignKey("comments.id"), nullable=True, index=True)
    parent = relationship("Comment", remote_side=[id], backref="replies")

    # Moderation
    is_approved = Column(Boolean, default=True, nullable=False)
    is_flagged = Column(Boolean, default=False, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)

    # Engagement
    like_count = Column(Integer, default=0, nullable=False)
    dislike_count = Column(Integer, default=0, nullable=False)

    # Audit fields
    created_at = Column(Float, default=time.time, nullable=False, index=True)
    updated_at = Column(Float, default=time.time, onupdate=time.time, nullable=False)
    deleted_at = Column(Float, nullable=True)

    # Moderation tracking
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(Float, nullable=True)

    # Database indexes
    __table_args__ = (
        Index('ix_comment_post_approved', 'post_id', 'is_approved'),
        Index('ix_comment_author_post', 'author_id', 'post_id'),
        Index('ix_comment_parent_approved', 'parent_id', 'is_approved'),
        CheckConstraint('like_count >= 0', name='ck_comment_like_count_positive'),
        CheckConstraint('dislike_count >= 0', name='ck_comment_dislike_count_positive'),
        CheckConstraint('length(content) >= 1', name='ck_comment_content_not_empty'),
    )

    def __repr__(self):
        return f"<Comment(id={self.id}, post_id={self.post_id}, author_id={self.author_id})>"

    @validates('content')
    def validate_content(self, key, content):
        """Validate comment content."""
        if not content or len(content.strip()) == 0:
            raise ValueError("Comment content cannot be empty")
        if len(content) > 5000:  # 5KB limit
            raise ValueError("Comment too long (max 5000 characters)")
        return content.strip()

    def can_be_edited_by(self, user) -> bool:
        """Check if user can edit this comment."""
        from app.models.user import UserRole

        # Deleted comments cannot be edited
        if self.is_deleted:
            return False

        # Author can edit their own comments
        if user.id == self.author_id:
            return True

        # Moderators and admins can edit any comment
        if user.role >= UserRole.MODERATOR:
            return True

        return False

    def can_be_deleted_by(self, user) -> bool:
        """Check if user can delete this comment."""
        from app.models.user import UserRole

        # Already deleted
        if self.is_deleted:
            return False

        # Author can delete their own comments
        if user.id == self.author_id:
            return True

        # Moderators and admins can delete any comment
        if user.role >= UserRole.MODERATOR:
            return True

        return False

    def soft_delete(self, deleted_by_user_id: int = None) -> None:
        """Soft delete the comment."""
        self.is_deleted = True
        self.deleted_at = time.time()
        self.content = "[Comment deleted]"

    def approve(self, approved_by_user_id: int) -> None:
        """Approve the comment."""
        self.is_approved = True
        self.approved_by = approved_by_user_id
        self.approved_at = time.time()
        self.is_flagged = False

    def flag(self) -> None:
        """Flag comment for moderation."""
        self.is_flagged = True

    def unflag(self) -> None:
        """Remove flag from comment."""
        self.is_flagged = False

    @property
    def depth(self) -> int:
        """Calculate comment thread depth."""
        if not self.parent_id:
            return 0

        depth = 1
        current = self
        while current.parent_id and depth < 10:  # Prevent infinite recursion
            current = current.parent
            depth += 1

        return depth

    def to_dict(self) -> dict:
        """Convert comment to dictionary for serialization."""
        return {
            "id": self.id,
            "content": self.content if not self.is_deleted else "[Comment deleted]",
            "post_id": self.post_id,
            "author_id": self.author_id,
            "parent_id": self.parent_id,
            "is_approved": self.is_approved,
            "is_flagged": self.is_flagged,
            "is_deleted": self.is_deleted,
            "like_count": self.like_count,
            "dislike_count": self.dislike_count,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "depth": self.depth
        }