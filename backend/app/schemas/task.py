from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: str = "general"
    priority: str = "medium"
    due_date: Optional[str] = None
    trigger_source: str = "Farmer"


class TaskStatusUpdate(BaseModel):
    status: str  # "pending", "completed", "dismissed", "postponed"


class TaskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    farm_id: str
    user_id: str
    title: str
    description: Optional[str] = None
    category: str
    priority: str
    status: str
    due_date: Optional[str] = None
    trigger_source: str
    created_at: datetime
    completed_at: Optional[datetime] = None
