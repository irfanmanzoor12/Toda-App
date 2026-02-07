"""Task CRUD API endpoints with Phase V enhancements.

TASK-013, 014, 015, 016, 017: Enhanced Task endpoints
REQ-002, 003, 004, 005, 006: Due dates, priorities, tags, search, events
COMP-001: Task Service (Enhanced)
"""

from typing import List, Tuple, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select, func
from sqlalchemy import and_, or_

from src.models.todo import Todo
from src.models.tag import Tag
from src.models.task_tag import TaskTag
from src.schemas.task import TaskCreate, TaskUpdate, TaskResponse, TaskListResponse
from src.api.dependencies import get_user_session
from src.events.publisher import get_event_publisher

router = APIRouter(prefix="/api", tags=["tasks"])


@router.post("/todos", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_data: TaskCreate,
    deps: Tuple[Session, str] = Depends(get_user_session)
):
    """Create a new task with priority, tags, and due date support.

    TASK-013: Enhanced task creation
    - Supports priority levels
    - Creates/associates tags
    - Sets due date and reminder schedule
    - Publishes task.created event to Kafka
    """
    session, user_id = deps

    # Create the task
    task = Todo(
        user_id=user_id,
        title=task_data.title,
        description=task_data.description,
        priority=task_data.priority.value,
        due_date=task_data.due_date,
        reminder_schedule=task_data.reminder_schedule
    )

    session.add(task)
    session.flush()  # Get task.id without committing

    # Handle tags if provided
    tag_names = []
    if task_data.tags:
        for tag_name in task_data.tags:
            # Find or create tag
            tag = session.exec(
                select(Tag).where(Tag.name == tag_name, Tag.user_id == user_id)
            ).first()

            if not tag:
                tag = Tag(name=tag_name, user_id=user_id)
                session.add(tag)
                session.flush()

            # Create task-tag association
            task_tag = TaskTag(task_id=task.id, tag_id=tag.id)
            session.add(task_tag)
            tag_names.append(tag_name)

    session.commit()
    session.refresh(task)

    # Publish event to Kafka
    try:
        publisher = get_event_publisher()
        await publisher.publish_task_created(
            task_id=task.id,
            user_id=user_id,
            title=task.title,
            description=task.description,
            priority=task.priority,
            tags=tag_names,
            due_date=task.due_date,
            created_at=task.created_at
        )
    except Exception as e:
        # Log error but don't fail the request
        # Event publishing is best-effort
        import logging
        logging.error(f"Failed to publish task.created event: {e}")

    # Load tags for response
    tags = session.exec(
        select(Tag).join(TaskTag).where(TaskTag.task_id == task.id)
    ).all()

    # Build response
    response = TaskResponse.model_validate(task)
    response.tags = tags
    return response


@router.get("/todos", response_model=TaskListResponse)
def list_tasks(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status: pending or completed"),
    priority: Optional[str] = Query(None, description="Filter by priority: low, medium, high, critical"),
    tags: Optional[str] = Query(None, description="Comma-separated tag names to filter by"),
    due_before: Optional[datetime] = Query(None, description="Filter tasks due before this date"),
    due_after: Optional[datetime] = Query(None, description="Filter tasks due after this date"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of tasks to return"),
    offset: int = Query(0, ge=0, description="Number of tasks to skip"),
    deps: Tuple[Session, str] = Depends(get_user_session)
):
    """List tasks with advanced filtering.

    TASK-016: Enhanced task listing
    - Filter by status (pending/completed)
    - Filter by priority
    - Filter by tags (AND logic - task must have all specified tags)
    - Filter by due date range
    - Pagination support
    - Excludes soft-deleted tasks
    """
    session, user_id = deps

    # Base query - exclude soft-deleted tasks
    query = select(Todo).where(
        Todo.user_id == user_id,
        Todo.deleted_at.is_(None)
    )

    # Filter by status
    if status_filter == "pending":
        query = query.where(Todo.completed == False)
    elif status_filter == "completed":
        query = query.where(Todo.completed == True)

    # Filter by priority
    if priority:
        query = query.where(Todo.priority == priority)

    # Filter by due date range
    if due_before:
        query = query.where(Todo.due_date < due_before)
    if due_after:
        query = query.where(Todo.due_date > due_after)

    # Filter by tags (if provided)
    if tags:
        tag_list = [t.strip() for t in tags.split(",") if t.strip()]
        if tag_list:
            # Subquery to find tasks with all specified tags
            for tag_name in tag_list:
                tag_subquery = (
                    select(TaskTag.task_id)
                    .join(Tag)
                    .where(Tag.name == tag_name, Tag.user_id == user_id)
                )
                query = query.where(Todo.id.in_(tag_subquery))

    # Get total count (before pagination)
    count_query = select(func.count()).select_from(query.subquery())
    total = session.exec(count_query).one()

    # Apply pagination and ordering
    query = query.order_by(Todo.created_at.desc()).offset(offset).limit(limit)

    # Execute query
    tasks = session.exec(query).all()

    # Load tags for each task
    task_responses = []
    for task in tasks:
        tags_for_task = session.exec(
            select(Tag).join(TaskTag).where(TaskTag.task_id == task.id)
        ).all()

        response = TaskResponse.model_validate(task)
        response.tags = tags_for_task
        task_responses.append(response)

    return TaskListResponse(
        tasks=task_responses,
        total=total,
        limit=limit,
        offset=offset
    )


@router.get("/{user_id}/tasks/{task_id}", response_model=Todo)
def get_task(
    user_id: str,
    task_id: int,
    deps: Tuple[Session, str] = Depends(get_user_session)
):
    """Get a specific task by ID. Returns 404 if not found or not owned by user."""
    session, jwt_user_id = deps

    statement = select(Todo).where(Todo.id == task_id, Todo.user_id == jwt_user_id)
    task = session.exec(statement).first()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    return task


@router.put("/todos/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    task_data: TaskUpdate,
    deps: Tuple[Session, str] = Depends(get_user_session)
):
    """Update a task with partial updates and diff tracking.

    TASK-014: Enhanced task update
    - Supports partial updates (only provided fields are updated)
    - Calculates diff for event publishing
    - Updates tags if provided
    - Publishes task.updated event with changes
    """
    session, user_id = deps

    # Fetch task
    task = session.exec(
        select(Todo).where(Todo.id == task_id, Todo.user_id == user_id, Todo.deleted_at.is_(None))
    ).first()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    # Track changes for event
    changes = {}

    # Update fields if provided
    if task_data.title is not None and task_data.title != task.title:
        changes["title"] = {"old": task.title, "new": task_data.title}
        task.title = task_data.title

    if task_data.description is not None and task_data.description != task.description:
        changes["description"] = {"old": task.description, "new": task_data.description}
        task.description = task_data.description

    if task_data.completed is not None and task_data.completed != task.completed:
        changes["completed"] = {"old": task.completed, "new": task_data.completed}
        task.completed = task_data.completed

    if task_data.priority is not None and task_data.priority.value != task.priority:
        changes["priority"] = {"old": task.priority, "new": task_data.priority.value}
        task.priority = task_data.priority.value

    if task_data.due_date is not None and task_data.due_date != task.due_date:
        changes["due_date"] = {
            "old": task.due_date.isoformat() if task.due_date else None,
            "new": task_data.due_date.isoformat()
        }
        task.due_date = task_data.due_date

    if task_data.reminder_schedule is not None:
        changes["reminder_schedule"] = {"old": task.reminder_schedule, "new": task_data.reminder_schedule}
        task.reminder_schedule = task_data.reminder_schedule

    # Update tags if provided
    if task_data.tags is not None:
        # Remove existing tags
        session.exec(select(TaskTag).where(TaskTag.task_id == task_id)).all()
        session.query(TaskTag).filter(TaskTag.task_id == task_id).delete()

        # Add new tags
        for tag_name in task_data.tags:
            tag = session.exec(
                select(Tag).where(Tag.name == tag_name, Tag.user_id == user_id)
            ).first()

            if not tag:
                tag = Tag(name=tag_name, user_id=user_id)
                session.add(tag)
                session.flush()

            task_tag = TaskTag(task_id=task.id, tag_id=tag.id)
            session.add(task_tag)

        changes["tags"] = {"old": "previous_tags", "new": task_data.tags}

    # Update timestamp
    task.updated_at = datetime.now(timezone.utc)

    session.add(task)
    session.commit()
    session.refresh(task)

    # Publish event if there were changes
    if changes:
        try:
            publisher = get_event_publisher()
            await publisher.publish_task_updated(
                task_id=task.id,
                user_id=user_id,
                changes=changes
            )
        except Exception as e:
            import logging
            logging.error(f"Failed to publish task.updated event: {e}")

    # Load tags for response
    tags = session.exec(
        select(Tag).join(TaskTag).where(TaskTag.task_id == task.id)
    ).all()

    response = TaskResponse.model_validate(task)
    response.tags = tags
    return response


@router.patch("/todos/{task_id}/complete", response_model=TaskResponse)
async def complete_task(
    task_id: int,
    deps: Tuple[Session, str] = Depends(get_user_session)
):
    """Mark a task as complete.

    TASK-015: Phase V complete endpoint
    - Uses /api/todos/{task_id}/complete path (consistent with other Phase V endpoints)
    - Publishes task.completed event to Kafka
    - Returns 404 if not found or not owned by user
    """
    session, user_id = deps

    task = session.exec(
        select(Todo).where(Todo.id == task_id, Todo.user_id == user_id, Todo.deleted_at.is_(None))
    ).first()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    task.completed = True
    task.updated_at = datetime.now(timezone.utc)

    session.add(task)
    session.commit()
    session.refresh(task)

    # Publish event
    try:
        publisher = get_event_publisher()
        await publisher.publish_task_updated(
            task_id=task.id,
            user_id=user_id,
            changes={"completed": {"old": False, "new": True}}
        )
    except Exception as e:
        import logging
        logging.error(f"Failed to publish task.completed event: {e}")

    # Load tags for response
    tags = session.exec(
        select(Tag).join(TaskTag).where(TaskTag.task_id == task.id)
    ).all()

    response = TaskResponse.model_validate(task)
    response.tags = tags
    return response


@router.delete("/todos/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: int,
    deps: Tuple[Session, str] = Depends(get_user_session)
):
    """Soft delete a task.

    TASK-015: Soft delete with event publishing
    - Sets deleted_at timestamp instead of hard delete
    - Publishes task.deleted event to Kafka
    - Returns 404 if task not found or already deleted
    """
    session, user_id = deps

    # Find non-deleted task
    task = session.exec(
        select(Todo).where(Todo.id == task_id, Todo.user_id == user_id, Todo.deleted_at.is_(None))
    ).first()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    # Soft delete
    deleted_at = datetime.now(timezone.utc)
    task.deleted_at = deleted_at

    session.add(task)
    session.commit()

    # Publish event
    try:
        publisher = get_event_publisher()
        await publisher.publish_task_deleted(
            task_id=task.id,
            user_id=user_id,
            deleted_at=deleted_at
        )
    except Exception as e:
        import logging
        logging.error(f"Failed to publish task.deleted event: {e}")


@router.get("/todos/search", response_model=List[TaskResponse])
def search_tasks(
    q: str = Query(..., min_length=1, description="Search query"),
    status_filter: Optional[str] = Query(None, alias="status"),
    priority: Optional[str] = Query(None),
    tags: Optional[str] = Query(None),
    due_before: Optional[datetime] = Query(None),
    due_after: Optional[datetime] = Query(None),
    sort_by: str = Query("relevance", regex="^(relevance|due_date|priority|created_at)$"),
    limit: int = Query(50, ge=1, le=500),
    deps: Tuple[Session, str] = Depends(get_user_session)
):
    """Full-text search tasks with PostgreSQL.

    TASK-017: Full-text search implementation
    - Uses PostgreSQL tsvector and GIN index for fast search
    - Searches across title and description (title weighted higher)
    - Supports all filters from GET /todos
    - Sorts by relevance (ts_rank) or other fields
    - Returns up to 500 results
    """
    session, user_id = deps

    # Base query with full-text search
    from sqlalchemy import text, func as sqla_func

    # Build the search query using to_tsquery
    search_query = text("to_tsquery('english', :query)")

    query = select(
        Todo,
        sqla_func.ts_rank(Todo.search_vector, search_query.bindparams(query=q)).label('rank')
    ).where(
        Todo.user_id == user_id,
        Todo.deleted_at.is_(None),
        Todo.search_vector.op('@@')(search_query.bindparams(query=q))
    )

    # Apply filters (same as list_tasks)
    if status_filter == "pending":
        query = query.where(Todo.completed == False)
    elif status_filter == "completed":
        query = query.where(Todo.completed == True)

    if priority:
        query = query.where(Todo.priority == priority)

    if due_before:
        query = query.where(Todo.due_date < due_before)
    if due_after:
        query = query.where(Todo.due_date > due_after)

    if tags:
        tag_list = [t.strip() for t in tags.split(",") if t.strip()]
        for tag_name in tag_list:
            tag_subquery = (
                select(TaskTag.task_id)
                .join(Tag)
                .where(Tag.name == tag_name, Tag.user_id == user_id)
            )
            query = query.where(Todo.id.in_(tag_subquery))

    # Sort by specified field
    if sort_by == "relevance":
        query = query.order_by(text("rank DESC"))
    elif sort_by == "due_date":
        query = query.order_by(Todo.due_date.desc().nulls_last())
    elif sort_by == "priority":
        # Custom order for priority
        from sqlalchemy import case
        priority_order = case(
            (Todo.priority == "critical", 1),
            (Todo.priority == "high", 2),
            (Todo.priority == "medium", 3),
            (Todo.priority == "low", 4),
            else_=5
        )
        query = query.order_by(priority_order)
    else:  # created_at
        query = query.order_by(Todo.created_at.desc())

    # Limit results
    query = query.limit(limit)

    # Execute query
    results = session.exec(query).all()

    # Build responses with tags
    task_responses = []
    for row in results:
        task = row[0]  # First element is the Todo object

        # Load tags
        tags_for_task = session.exec(
            select(Tag).join(TaskTag).where(TaskTag.task_id == task.id)
        ).all()

        response = TaskResponse.model_validate(task)
        response.tags = tags_for_task
        task_responses.append(response)

    return task_responses


@router.put("/todos/{task_id}/priority", response_model=TaskResponse)
async def set_task_priority(
    task_id: int,
    priority: str = Query(..., pattern="^(low|medium|high|critical)$", description="Priority level"),
    deps: Tuple[Session, str] = Depends(get_user_session)
):
    """Set task priority.

    TASK-021: Priority endpoint
    - Updates task priority
    - Publishes task.priority_changed event
    - Returns updated TaskResponse
    """
    session, user_id = deps

    task = session.exec(
        select(Todo).where(Todo.id == task_id, Todo.user_id == user_id, Todo.deleted_at.is_(None))
    ).first()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    old_priority = task.priority
    if old_priority != priority:
        task.priority = priority
        task.updated_at = datetime.now(timezone.utc)

        session.add(task)
        session.commit()
        session.refresh(task)

        try:
            publisher = get_event_publisher()
            await publisher.publish_task_priority_changed(
                task_id=task.id,
                user_id=user_id,
                old_priority=old_priority,
                new_priority=priority
            )
        except Exception as e:
            import logging
            logging.error(f"Failed to publish task.priority_changed event: {e}")

    tags = session.exec(
        select(Tag).join(TaskTag).where(TaskTag.task_id == task.id)
    ).all()

    response = TaskResponse.model_validate(task)
    response.tags = tags
    return response


@router.put("/todos/{task_id}/due-date", response_model=TaskResponse)
async def set_task_due_date(
    task_id: int,
    due_date: datetime = Query(..., description="Due date in ISO 8601 format"),
    reminder_schedule: Optional[str] = Query(None, description="Comma-separated reminder times: 1h,1d,1w"),
    deps: Tuple[Session, str] = Depends(get_user_session)
):
    """Set task due date and reminder schedule.

    TASK-022: Due date endpoint
    - Updates task due_date and reminder_schedule
    - Publishes task.due_date_set event
    - Returns updated TaskResponse

    Reminder schedule format: "1h,1d,1w" means reminders at 1 hour, 1 day, and 1 week before due date.
    """
    session, user_id = deps

    task = session.exec(
        select(Todo).where(Todo.id == task_id, Todo.user_id == user_id, Todo.deleted_at.is_(None))
    ).first()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    task.due_date = due_date
    task.updated_at = datetime.now(timezone.utc)

    # Parse reminder schedule
    reminder_list = None
    if reminder_schedule:
        reminder_list = [r.strip() for r in reminder_schedule.split(",") if r.strip()]
        task.reminder_schedule = {"reminders": reminder_list}

    session.add(task)
    session.commit()
    session.refresh(task)

    try:
        publisher = get_event_publisher()
        await publisher.publish_task_due_date_set(
            task_id=task.id,
            user_id=user_id,
            due_date=due_date,
            reminder_schedule=reminder_list
        )
    except Exception as e:
        import logging
        logging.error(f"Failed to publish task.due_date_set event: {e}")

    tags = session.exec(
        select(Tag).join(TaskTag).where(TaskTag.task_id == task.id)
    ).all()

    response = TaskResponse.model_validate(task)
    response.tags = tags
    return response
