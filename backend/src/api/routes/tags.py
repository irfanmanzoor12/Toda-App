"""Tag management API endpoints.

TASK-018, 019, 020: Tag CRUD operations
REQ-004: Task Tags
COMP-001: Task Service (Enhanced)
"""

from typing import List, Tuple
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select, func

from src.models.todo import Todo
from src.models.tag import Tag
from src.models.task_tag import TaskTag
from src.schemas.tag import TagCreate, TagResponse, TagWithCount
from src.schemas.task import TaskResponse
from src.api.dependencies import get_user_session
from src.events.publisher import get_event_publisher

router = APIRouter(prefix="/api", tags=["tags"])


@router.post("/todos/{task_id}/tags", response_model=TaskResponse)
async def add_tags_to_task(
    task_id: int,
    tag_data: TagCreate,
    deps: Tuple[Session, str] = Depends(get_user_session)
):
    """Add a tag to a task.

    TASK-018: Add tags endpoint
    - Creates new tag if it doesn't exist (user-scoped)
    - Creates task_tag association
    - Publishes task.tagged event
    - Returns updated TaskResponse with all tags
    """
    session, user_id = deps

    task = session.exec(
        select(Todo).where(
            Todo.id == task_id,
            Todo.user_id == user_id,
            Todo.deleted_at.is_(None)
        )
    ).first()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    tag_name = tag_data.name.strip().lower()

    tag = session.exec(
        select(Tag).where(Tag.name == tag_name, Tag.user_id == user_id)
    ).first()

    if not tag:
        tag = Tag(name=tag_name, user_id=user_id)
        session.add(tag)
        session.flush()

    existing = session.exec(
        select(TaskTag).where(TaskTag.task_id == task_id, TaskTag.tag_id == tag.id)
    ).first()

    tags_added = []
    if not existing:
        task_tag = TaskTag(task_id=task_id, tag_id=tag.id)
        session.add(task_tag)
        tags_added.append(tag_name)

    session.commit()

    if tags_added:
        try:
            publisher = get_event_publisher()
            await publisher.publish_task_tagged(
                task_id=task_id,
                user_id=user_id,
                tags_added=tags_added
            )
        except Exception as e:
            import logging
            logging.error(f"Failed to publish task.tagged event: {e}")

    session.refresh(task)
    tags = session.exec(
        select(Tag).join(TaskTag).where(TaskTag.task_id == task.id)
    ).all()

    response = TaskResponse.model_validate(task)
    response.tags = tags
    return response


@router.delete("/todos/{task_id}/tags/{tag_name}", response_model=TaskResponse)
async def remove_tag_from_task(
    task_id: int,
    tag_name: str,
    deps: Tuple[Session, str] = Depends(get_user_session)
):
    """Remove a tag from a task.

    TASK-019: Remove tag endpoint
    - Removes task_tag association
    - Does not delete the tag itself
    - Publishes task.untagged event
    """
    session, user_id = deps

    task = session.exec(
        select(Todo).where(
            Todo.id == task_id,
            Todo.user_id == user_id,
            Todo.deleted_at.is_(None)
        )
    ).first()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    tag_name_normalized = tag_name.strip().lower()
    tag = session.exec(
        select(Tag).where(Tag.name == tag_name_normalized, Tag.user_id == user_id)
    ).first()

    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found"
        )

    task_tag = session.exec(
        select(TaskTag).where(TaskTag.task_id == task_id, TaskTag.tag_id == tag.id)
    ).first()

    if not task_tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not associated with this task"
        )

    session.delete(task_tag)
    session.commit()

    try:
        publisher = get_event_publisher()
        await publisher.publish_task_untagged(
            task_id=task_id,
            user_id=user_id,
            tag_removed=tag_name_normalized
        )
    except Exception as e:
        import logging
        logging.error(f"Failed to publish task.untagged event: {e}")

    session.refresh(task)
    tags = session.exec(
        select(Tag).join(TaskTag).where(TaskTag.task_id == task.id)
    ).all()

    response = TaskResponse.model_validate(task)
    response.tags = tags
    return response


@router.get("/tags", response_model=List[TagWithCount])
def list_user_tags(
    sort_by: str = Query("usage", pattern="^(usage|name)$", description="Sort by usage count or name"),
    limit: int = Query(100, ge=1, le=500, description="Maximum number of tags to return"),
    deps: Tuple[Session, str] = Depends(get_user_session)
):
    """List all tags for the current user.

    TASK-020: List tags endpoint
    - Returns tags with usage count
    - Sortable by usage or name
    - User-scoped results
    """
    session, user_id = deps

    query = (
        select(
            Tag.id,
            Tag.name,
            Tag.created_at,
            func.count(TaskTag.task_id).label("usage_count")
        )
        .outerjoin(TaskTag, Tag.id == TaskTag.tag_id)
        .outerjoin(
            Todo,
            (TaskTag.task_id == Todo.id) & (Todo.deleted_at.is_(None))
        )
        .where(Tag.user_id == user_id)
        .group_by(Tag.id, Tag.name, Tag.created_at)
    )

    if sort_by == "usage":
        query = query.order_by(func.count(TaskTag.task_id).desc(), Tag.name)
    else:
        query = query.order_by(Tag.name)

    query = query.limit(limit)
    results = session.exec(query).all()

    return [
        TagWithCount(
            id=row.id,
            name=row.name,
            usage_count=row.usage_count,
            created_at=row.created_at
        )
        for row in results
    ]
