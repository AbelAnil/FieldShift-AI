import uuid
import json
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text
from app.database import Base


class RotationPlan(Base):
    __tablename__ = "rotation_plans"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    farm_id = Column(String(36), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)
    field_id = Column(String(36), ForeignKey("fields.id", ondelete="CASCADE"), nullable=True)

    strategy = Column(String(50), nullable=False)  # soil_health, water_efficiency, balanced
    strategy_name = Column(String(100), nullable=False)
    overall_score = Column(Float, nullable=False)
    
    # JSON array of rotation steps
    steps_json = Column(Text, nullable=False)
    
    soil_benefit_summary = Column(Text, nullable=False)
    water_benefit_summary = Column(Text, nullable=False)
    economic_benefit_summary = Column(Text, nullable=False)
    considerations = Column(Text, nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    @property
    def steps(self):
        try:
            return json.loads(self.steps_json)
        except Exception:
            return []

    @steps.setter
    def steps(self, value):
        self.steps_json = json.dumps(value) if not isinstance(value, str) else value

