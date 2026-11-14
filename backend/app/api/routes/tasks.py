from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.farm import Farm
from app.models.task import Task
from app.api.deps import get_current_user
from app.schemas.task import TaskCreate, TaskStatusUpdate, TaskOut
from app.services.task_service import TaskService

router = APIRouter(tags=["Tasks & Reminders"])


@router.get("/farms/{farm_id}/tasks", response_model=List[TaskOut])
async def get_farm_tasks(
    farm_id: str,
    status_filter: Optional[str] = None,
    sync_telemetry: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieves all tasks for the given farm.
    If sync_telemetry is true, scans live Earth observations and generates condition alerts.
    """
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found")
    if farm.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    if sync_telemetry:
        return await TaskService.evaluate_and_sync_telemetry_tasks(db, farm_id, current_user.id)
    return TaskService.list_tasks(db, farm_id, status_filter)


@router.post("/farms/{farm_id}/tasks", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
def create_farm_task(
    farm_id: str,
    task_in: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Allows a farmer to add a custom farm task or reminder.
    """
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found")
    if farm.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    return TaskService.create_custom_task(db, farm_id, current_user.id, task_in)


@router.patch("/tasks/{task_id}/status", response_model=TaskOut)
def update_task_status(
    task_id: str,
    update: TaskStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Updates the status of a task (pending, completed, dismissed, postponed).
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    if task.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    updated = TaskService.update_task_status(db, task_id, update.status)
    return updated


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Deletes a task record.
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    if task.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    TaskService.delete_task(db, task_id)
    return None
