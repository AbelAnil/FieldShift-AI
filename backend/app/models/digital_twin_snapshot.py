import uuid
import json
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text
from app.database import Base


class DigitalTwinSnapshot(Base):
    __tablename__ = "digital_twin_snapshots"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    farm_id = Column(String(36), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)
    snapshot_date = Column(String(10), nullable=False, index=True)

    environmental_state_raw = Column(Text, nullable=False)
    soil_state_raw = Column(Text, nullable=False)
    vegetation_state_raw = Column(Text, nullable=False)
    crop_state_raw = Column(Text, nullable=False)
    terrain_state_raw = Column(Text, nullable=False)

    overall_risk_score = Column(Float, default=20.0, nullable=False)  # 0 to 100 (0=safe, 100=extreme risk)
    risk_level = Column(String(20), default="Low", nullable=False)  # Low, Moderate, Elevated, High
    risk_factors_raw = Column(Text, nullable=False)
    data_completeness_pct = Column(Float, default=75.0, nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    @property
    def environmental_state(self):
        return json.loads(self.environmental_state_raw) if self.environmental_state_raw else {}

    @property
    def soil_state(self):
        return json.loads(self.soil_state_raw) if self.soil_state_raw else {}

    @property
    def vegetation_state(self):
        return json.loads(self.vegetation_state_raw) if self.vegetation_state_raw else {}

    @property
    def crop_state(self):
        return json.loads(self.crop_state_raw) if self.crop_state_raw else {}

    @property
    def terrain_state(self):
        return json.loads(self.terrain_state_raw) if self.terrain_state_raw else {}

    @property
    def risk_factors(self):
        return json.loads(self.risk_factors_raw) if self.risk_factors_raw else []

