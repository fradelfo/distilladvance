"""
Post and comment management API endpoints.
Handles blog post CRUD operations, publication workflow, and comment threading.
"""

import time
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, BackgroundTasks
from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_session
from app.core.exceptions import (
    ResourceNotFoundException, AuthorizationException,
    ValidationException, business_rule_violation
)
from app.core.rate_limiting import RateLimiter, RateLimits
from app.models.user import User, UserRole
from app.models.post import Post, Comment, PostStatus
from app.schemas.post import (
    PostCreate, PostUpdate, PostResponse, PostListResponse,
    PostPublishRequest, CommentCreate, CommentUpdate, CommentResponse,
    CommentListResponse, PostStats, PostSearch
)
from app.schemas.common import (
    MessageResponse, PaginationParams, BulkOperationRequest,
    BulkOperationResponse, SuccessResponse
)
from app.api.users import get_current_user, require_moderator, require_admin

router = APIRouter(prefix="/posts", tags=["posts"])
rate_limiter = RateLimiter()


async def get_post_by_id(
    post_id: int,
    session: AsyncSession,
    include_author: bool = True,
    include_comments: bool = False
) -> Post:
    """Helper function to get post by ID with optional relationships."""
    stmt = select(Post).where(Post.id == post_id)

    if include_author:
        stmt = stmt.options(selectinload(Post.author))

    if include_comments:
        stmt = stmt.options(selectinload(Post.comments))

    result = await session.execute(stmt)
    post = result.scalar_one_or_none()

    if not post:
        raise ResourceNotFoundException("Post not found", "post", post_id)

    return post


async def check_post_permissions(post: Post, user: User, action: str = "view") -> None:
    """Check if user has permission to perform action on post."""
    if action == "view":
        # Anyone can view published posts
        if post.status == PostStatus.PUBLISHED:
            return
        # Authors can view their own posts in any status
        if post.author_id == user.id:
            return
        # Moderators can view any post
        if user.role >= UserRole.MODERATOR:
            return
        raise ResourceNotFoundException("Post not found", "post", post.id)

    elif action in ["edit", "update"]:
        if not post.can_be_edited_by(user):
            raise AuthorizationException("Not authorized to edit this post")

    elif action == "delete":
        if not post.can_be_deleted_by(user):
            raise AuthorizationException("Not authorized to delete this post")

    elif action == "publish":
        if post.author_id != user.id and user.role < UserRole.MODERATOR:
            raise AuthorizationException("Not authorized to publish this post")

    elif action == "moderate":
        if user.role < UserRole.MODERATOR:
            raise AuthorizationException("Moderator privileges required")


async def send_post_notification(post: Post, action: str):
    """Send notifications for post events."""
    # TODO: Implement notification system
    print(f"Notification: Post {post.id} was {action}")


@router.post("", response_model=PostResponse, status_code=201)
async def create_post(
    post_data: PostCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
    client_ip: str = "127.0.0.1"
):
    """
    Create a new blog post.

    - **title**: Post title (1-200 characters)
    - **content**: Post content in markdown
    - **tags**: List of tags (max 10)
    - **category**: Post category
    - **is_featured**: Mark as featured post (moderator only)
    """
    # Rate limiting for post creation
    await rate_limiter.check_rate_limit(
        f"post_create:{current_user.id}",
        RateLimits.POST_CREATION
    )

    # Only moderators can create featured posts
    if post_data.is_featured and current_user.role < UserRole.MODERATOR:
        post_data.is_featured = False

    # Create post
    post = Post(
        title=post_data.title,
        content=post_data.content,
        excerpt=post_data.excerpt,
        tags=post_data.tags,
        category=post_data.category,
        meta_title=post_data.meta_title,
        meta_description=post_data.meta_description,
        featured_image_url=post_data.featured_image_url,
        is_featured=post_data.is_featured,
        allow_comments=post_data.allow_comments,
        scheduled_for=post_data.scheduled_for.timestamp() if post_data.scheduled_for else None,
        author_id=current_user.id,
        status=PostStatus.DRAFT
    )

    # Generate slug
    post.generate_slug()

    session.add(post)
    await session.commit()
    await session.refresh(post, ["author"])

    # Send notification
    background_tasks.add_task(send_post_notification, post, "created")

    return PostResponse.from_orm(post)


@router.get("", response_model=PostListResponse)
async def list_posts(
    pagination: PaginationParams = Depends(),
    status: Optional[PostStatus] = Query(None, description="Filter by status"),
    category: Optional[str] = Query(None, description="Filter by category"),
    tags: Optional[str] = Query(None, description="Filter by tags (comma-separated)"),
    author_id: Optional[int] = Query(None, description="Filter by author"),
    featured: Optional[bool] = Query(None, description="Filter featured posts"),
    search: Optional[str] = Query(None, description="Search in title and content"),
    sort_by: str = Query("created_at", description="Sort field"),
    sort_order: str = Query("desc", regex="^(asc|desc)$", description="Sort order"),
    current_user: Optional[User] = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    List posts with filtering, search, and pagination.

    Supports various filters and full-text search in title and content.
    Non-authenticated users only see published posts.
    """
    # Build query
    stmt = select(Post).options(selectinload(Post.author))
    count_stmt = select(func.count(Post.id))

    # Apply filters
    filters = []

    # Status filter - non-authenticated users only see published
    if not current_user:
        filters.append(Post.status == PostStatus.PUBLISHED)
    elif status:
        filters.append(Post.status == status)

    if category:
        filters.append(Post.category == category)

    if author_id:
        filters.append(Post.author_id == author_id)

    if featured is not None:
        filters.append(Post.is_featured == featured)

    # Tags filter
    if tags:
        tag_list = [tag.strip().lower() for tag in tags.split(",") if tag.strip()]
        if tag_list:
            # Use JSON contains for tag filtering
            tag_filters = [Post.tags.op("@>")(f'["{tag}"]') for tag in tag_list]
            filters.append(or_(*tag_filters))

    # Search filter
    if search:
        search_filter = or_(
            Post.title.ilike(f"%{search}%"),
            Post.content.ilike(f"%{search}%"),
            Post.excerpt.ilike(f"%{search}%")
        )
        filters.append(search_filter)

    # Apply all filters
    if filters:
        stmt = stmt.where(and_(*filters))
        count_stmt = count_stmt.where(and_(*filters))

    # Get total count
    count_result = await session.execute(count_stmt)
    total = count_result.scalar()

    # Apply sorting
    sort_column = getattr(Post, sort_by, Post.created_at)
    if sort_order == "desc":
        sort_column = desc(sort_column)

    # Apply pagination
    stmt = (
        stmt
        .order_by(sort_column)
        .offset(pagination.offset)
        .limit(pagination.size)
    )

    # Execute query
    result = await session.execute(stmt)
    posts = result.scalars().all()

    return PostListResponse(
        posts=[PostResponse.from_orm(post) for post in posts],
        total=total,
        page=pagination.page,
        size=pagination.size,
        pages=(total + pagination.size - 1) // pagination.size
    )


@router.get("/search", response_model=PostListResponse)
async def search_posts(
    search_data: PostSearch = Depends(),
    current_user: Optional[User] = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Advanced post search with multiple filters.

    Provides comprehensive search functionality with sorting and pagination.
    """
    # Build query
    stmt = select(Post).options(selectinload(Post.author))
    count_stmt = select(func.count(Post.id))

    # Apply filters
    filters = []

    # Status filter for non-authenticated users
    if not current_user:
        filters.append(Post.status == PostStatus.PUBLISHED)
    elif search_data.status:
        filters.append(Post.status == search_data.status)

    # Text search
    if search_data.query:
        search_filter = or_(
            Post.title.ilike(f"%{search_data.query}%"),
            Post.content.ilike(f"%{search_data.query}%"),
            Post.excerpt.ilike(f"%{search_data.query}%")
        )
        filters.append(search_filter)

    # Additional filters
    if search_data.tags:
        tag_filters = [Post.tags.op("@>")(f'["{tag}"]') for tag in search_data.tags]
        filters.append(or_(*tag_filters))

    if search_data.category:
        filters.append(Post.category == search_data.category)

    if search_data.author_id:
        filters.append(Post.author_id == search_data.author_id)

    if search_data.is_featured is not None:
        filters.append(Post.is_featured == search_data.is_featured)

    # Date filters
    if search_data.date_from:
        filters.append(Post.created_at >= search_data.date_from.timestamp())

    if search_data.date_to:
        filters.append(Post.created_at <= search_data.date_to.timestamp())

    # Apply filters
    if filters:
        stmt = stmt.where(and_(*filters))
        count_stmt = count_stmt.where(and_(*filters))

    # Get total count
    count_result = await session.execute(count_stmt)
    total = count_result.scalar()

    # Apply sorting
    sort_column = getattr(Post, search_data.sort_by, Post.created_at)
    if search_data.sort_order == "desc":
        sort_column = desc(sort_column)

    # Apply pagination
    offset = (search_data.page - 1) * search_data.size
    stmt = (
        stmt
        .order_by(sort_column)
        .offset(offset)
        .limit(search_data.size)
    )

    # Execute query
    result = await session.execute(stmt)
    posts = result.scalars().all()

    return PostListResponse(
        posts=[PostResponse.from_orm(post) for post in posts],
        total=total,
        page=search_data.page,
        size=search_data.size,
        pages=(total + search_data.size - 1) // search_data.size
    )


@router.get("/stats", response_model=PostStats)
async def get_post_stats(
    current_user: User = Depends(require_moderator),
    session: AsyncSession = Depends(get_session)
):
    """Get post statistics (moderator required)."""
    current_time = time.time()

    # Total posts by status
    total_stmt = select(func.count(Post.id))
    total_result = await session.execute(total_stmt)
    total_posts = total_result.scalar()

    published_stmt = select(func.count(Post.id)).where(Post.status == PostStatus.PUBLISHED)
    published_result = await session.execute(published_stmt)
    published_posts = published_result.scalar()

    draft_stmt = select(func.count(Post.id)).where(Post.status == PostStatus.DRAFT)
    draft_result = await session.execute(draft_stmt)
    draft_posts = draft_result.scalar()

    featured_stmt = select(func.count(Post.id)).where(Post.is_featured == True)
    featured_result = await session.execute(featured_stmt)
    featured_posts = featured_result.scalar()

    # Engagement totals
    views_stmt = select(func.sum(Post.view_count))
    views_result = await session.execute(views_stmt)
    total_views = views_result.scalar() or 0

    likes_stmt = select(func.sum(Post.like_count))
    likes_result = await session.execute(likes_stmt)
    total_likes = likes_result.scalar() or 0

    comments_stmt = select(func.sum(Post.comment_count))
    comments_result = await session.execute(comments_stmt)
    total_comments = comments_result.scalar() or 0

    # Time-based stats
    day_ago = current_time - 86400
    week_ago = current_time - 604800
    month_ago = current_time - 2592000

    posts_today_stmt = select(func.count(Post.id)).where(Post.created_at >= day_ago)
    posts_today_result = await session.execute(posts_today_stmt)
    posts_today = posts_today_result.scalar()

    posts_week_stmt = select(func.count(Post.id)).where(Post.created_at >= week_ago)
    posts_week_result = await session.execute(posts_week_stmt)
    posts_this_week = posts_week_result.scalar()

    posts_month_stmt = select(func.count(Post.id)).where(Post.created_at >= month_ago)
    posts_month_result = await session.execute(posts_month_stmt)
    posts_this_month = posts_month_result.scalar()

    # Most popular tags
    # This is a simplified version - in production, you might want a separate tags table
    tag_data = []  # TODO: Implement proper tag counting from JSON field

    # Most viewed posts
    popular_stmt = (
        select(Post.id, Post.title, Post.view_count)
        .where(Post.status == PostStatus.PUBLISHED)
        .order_by(desc(Post.view_count))
        .limit(10)
    )
    popular_result = await session.execute(popular_stmt)
    most_viewed_posts = [
        {"id": row.id, "title": row.title, "views": row.view_count}
        for row in popular_result
    ]

    return PostStats(
        total_posts=total_posts,
        published_posts=published_posts,
        draft_posts=draft_posts,
        featured_posts=featured_posts,
        total_views=total_views,
        total_likes=total_likes,
        total_comments=total_comments,
        posts_today=posts_today,
        posts_this_week=posts_this_week,
        posts_this_month=posts_this_month,
        most_popular_tags=tag_data,
        most_viewed_posts=most_viewed_posts
    )


@router.get("/{post_id}", response_model=PostResponse)
async def get_post(
    post_id: int,
    current_user: Optional[User] = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Get a specific post by ID."""
    post = await get_post_by_id(post_id, session, include_author=True)

    # Check permissions
    if current_user:
        await check_post_permissions(post, current_user, "view")
    else:
        # Anonymous users can only view published posts
        if post.status != PostStatus.PUBLISHED:
            raise ResourceNotFoundException("Post not found", "post", post_id)

    # Increment view count for published posts
    if post.status == PostStatus.PUBLISHED:
        post.increment_view()
        await session.commit()

    return PostResponse.from_orm(post)


@router.put("/{post_id}", response_model=PostResponse)
async def update_post(
    post_id: int,
    post_data: PostUpdate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Update an existing post."""
    post = await get_post_by_id(post_id, session, include_author=True)
    await check_post_permissions(post, current_user, "edit")

    # Update fields
    for field, value in post_data.dict(exclude_unset=True).items():
        if field == "is_featured" and current_user.role < UserRole.MODERATOR:
            continue  # Skip featured flag for non-moderators
        setattr(post, field, value)

    # Update metadata
    post.updated_at = time.time()
    post.last_edited_by = current_user.id
    post.edit_count += 1

    # Regenerate slug if title changed
    if post_data.title:
        post.generate_slug()

    await session.commit()
    await session.refresh(post, ["author"])

    # Send notification
    background_tasks.add_task(send_post_notification, post, "updated")

    return PostResponse.from_orm(post)


@router.post("/{post_id}/publish", response_model=PostResponse)
async def publish_post(
    post_id: int,
    publish_data: PostPublishRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Publish a draft post."""
    post = await get_post_by_id(post_id, session, include_author=True)
    await check_post_permissions(post, current_user, "publish")

    if post.status != PostStatus.DRAFT:
        raise business_rule_violation(
            "invalid_status_transition",
            f"Cannot publish post with status {post.status.value}"
        )

    # Handle scheduling
    if publish_data.scheduled_for:
        post.scheduled_for = publish_data.scheduled_for.timestamp()
        # TODO: Implement scheduled publishing
    else:
        post.publish()

    await session.commit()
    await session.refresh(post, ["author"])

    # Send notification
    background_tasks.add_task(send_post_notification, post, "published")

    return PostResponse.from_orm(post)


@router.post("/{post_id}/unpublish", response_model=PostResponse)
async def unpublish_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Unpublish a post (move to draft)."""
    post = await get_post_by_id(post_id, session, include_author=True)
    await check_post_permissions(post, current_user, "publish")

    post.unpublish()
    await session.commit()
    await session.refresh(post, ["author"])

    return PostResponse.from_orm(post)


@router.post("/{post_id}/archive", response_model=PostResponse)
async def archive_post(
    post_id: int,
    current_user: User = Depends(require_moderator),
    session: AsyncSession = Depends(get_session)
):
    """Archive a post (moderator required)."""
    post = await get_post_by_id(post_id, session, include_author=True)

    post.archive()
    await session.commit()
    await session.refresh(post, ["author"])

    return PostResponse.from_orm(post)


@router.delete("/{post_id}")
async def delete_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Delete a post (soft delete - changes status to deleted)."""
    post = await get_post_by_id(post_id, session)
    await check_post_permissions(post, current_user, "delete")

    post.status = PostStatus.DELETED
    post.updated_at = time.time()
    await session.commit()

    return MessageResponse(message="Post deleted successfully")


# Comment endpoints
@router.get("/{post_id}/comments", response_model=CommentListResponse)
async def get_post_comments(
    post_id: int,
    pagination: PaginationParams = Depends(),
    include_replies: bool = Query(True, description="Include nested replies"),
    current_user: Optional[User] = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Get comments for a specific post."""
    # Verify post exists and is viewable
    post = await get_post_by_id(post_id, session)
    if current_user:
        await check_post_permissions(post, current_user, "view")
    else:
        if post.status != PostStatus.PUBLISHED:
            raise ResourceNotFoundException("Post not found", "post", post_id)

    # Build query for top-level comments only
    stmt = (
        select(Comment)
        .where(Comment.post_id == post_id)
        .where(Comment.parent_id.is_(None))
        .where(Comment.is_approved == True)
        .where(Comment.is_deleted == False)
        .options(selectinload(Comment.author))
    )

    if include_replies:
        stmt = stmt.options(selectinload(Comment.replies))

    count_stmt = (
        select(func.count(Comment.id))
        .where(Comment.post_id == post_id)
        .where(Comment.parent_id.is_(None))
        .where(Comment.is_approved == True)
        .where(Comment.is_deleted == False)
    )

    # Get total count
    count_result = await session.execute(count_stmt)
    total = count_result.scalar()

    # Apply pagination and sorting
    stmt = (
        stmt
        .order_by(desc(Comment.created_at))
        .offset(pagination.offset)
        .limit(pagination.size)
    )

    # Execute query
    result = await session.execute(stmt)
    comments = result.scalars().all()

    return CommentListResponse(
        comments=[CommentResponse.from_orm(comment) for comment in comments],
        total=total,
        page=pagination.page,
        size=pagination.size,
        pages=(total + pagination.size - 1) // pagination.size
    )


@router.post("/{post_id}/comments", response_model=CommentResponse, status_code=201)
async def create_comment(
    post_id: int,
    comment_data: CommentCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
    client_ip: str = "127.0.0.1"
):
    """Create a new comment on a post."""
    # Rate limiting for comments
    await rate_limiter.check_rate_limit(
        f"comment_create:{current_user.id}",
        RateLimits.COMMENT_CREATION
    )

    # Verify post exists and allows comments
    post = await get_post_by_id(post_id, session)
    await check_post_permissions(post, current_user, "view")

    if not post.allow_comments:
        raise business_rule_violation(
            "comments_disabled",
            "Comments are not allowed on this post"
        )

    if post.status != PostStatus.PUBLISHED:
        raise business_rule_violation(
            "post_not_published",
            "Comments can only be added to published posts"
        )

    # Verify parent comment exists if specified
    parent_comment = None
    if comment_data.parent_id:
        parent_stmt = select(Comment).where(Comment.id == comment_data.parent_id)
        parent_result = await session.execute(parent_stmt)
        parent_comment = parent_result.scalar_one_or_none()

        if not parent_comment or parent_comment.post_id != post_id:
            raise ResourceNotFoundException("Parent comment not found", "comment", comment_data.parent_id)

        # Limit threading depth
        if parent_comment.depth >= 5:
            raise business_rule_violation(
                "max_thread_depth",
                "Maximum comment thread depth exceeded"
            )

    # Create comment
    comment = Comment(
        content=comment_data.content,
        post_id=post_id,
        author_id=current_user.id,
        parent_id=comment_data.parent_id,
        is_approved=True  # Auto-approve for now
    )

    session.add(comment)

    # Update post comment count
    post.comment_count += 1

    await session.commit()
    await session.refresh(comment, ["author"])

    return CommentResponse.from_orm(comment)


@router.put("/{post_id}/comments/{comment_id}", response_model=CommentResponse)
async def update_comment(
    post_id: int,
    comment_id: int,
    comment_data: CommentUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Update an existing comment."""
    # Get comment
    stmt = (
        select(Comment)
        .where(Comment.id == comment_id)
        .where(Comment.post_id == post_id)
        .options(selectinload(Comment.author))
    )
    result = await session.execute(stmt)
    comment = result.scalar_one_or_none()

    if not comment:
        raise ResourceNotFoundException("Comment not found", "comment", comment_id)

    # Check permissions
    if not comment.can_be_edited_by(current_user):
        raise AuthorizationException("Not authorized to edit this comment")

    # Update comment
    comment.content = comment_data.content
    comment.updated_at = time.time()

    await session.commit()
    await session.refresh(comment, ["author"])

    return CommentResponse.from_orm(comment)


@router.delete("/{post_id}/comments/{comment_id}")
async def delete_comment(
    post_id: int,
    comment_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Delete a comment (soft delete)."""
    # Get comment
    stmt = select(Comment).where(Comment.id == comment_id).where(Comment.post_id == post_id)
    result = await session.execute(stmt)
    comment = result.scalar_one_or_none()

    if not comment:
        raise ResourceNotFoundException("Comment not found", "comment", comment_id)

    # Check permissions
    if not comment.can_be_deleted_by(current_user):
        raise AuthorizationException("Not authorized to delete this comment")

    # Soft delete
    comment.soft_delete(current_user.id)

    # Update post comment count
    post_stmt = select(Post).where(Post.id == post_id)
    post_result = await session.execute(post_stmt)
    post = post_result.scalar_one()
    post.comment_count = max(0, post.comment_count - 1)

    await session.commit()

    return MessageResponse(message="Comment deleted successfully")