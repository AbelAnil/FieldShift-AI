import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database import Base


class Task(Base):
    __tablename__ = "tasks"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    farm_id = Column(String, ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String, default="general")  # "weather", "soil", "crop", "drainage", "general"
    priority = Column(String, default="medium")   # "high", "medium", "low"
    status = Column(String, default="pending", index=True)     # "pending", "completed", "dismissed", "postponed"
    due_date = Column(String, nullable=True)
    trigger_source = Column(String, default="system")  # "NASA GPM", "SoilGrids", "Digital Twin", "Farmer"
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    completed_at = Column(DateTime, nullable=True)

    farm = relationship("Farm", backref="tasks")
    user = relationship("User", backref="tasks")
