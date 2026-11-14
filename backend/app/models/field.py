import uuid
import json
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base


class Field(Base):
    __tablename__ = "fields"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    farm_id = Column(String(36), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)
    field_name = Column(String(255), nullable=False)
    
    boundary_geojson_raw = Column(Text, nullable=False)
    
    area_hectares = Column(Float, nullable=False, default=0.0)
    area_acres = Column(Float, nullable=False, default=0.0)
    
    current_crop = Column(String(100), nullable=True)
    planting_date = Column(String(50), nullable=True)
    expected_harvest_date = Column(String(50), nullable=True)
    irrigation_available = Column(Boolean, default=False, nullable=False)
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    farm = relationship("Farm", back_populates="fields")

    @property
    def boundary_geojson(self):
        try:
            return json.loads(self.boundary_geojson_raw)
        except Exception:
            return None

    @boundary_geojson.setter
    def boundary_geojson(self, value):
        if isinstance(value, str):
            self.boundary_geojson_raw = value
        else:
            self.boundary_geojson_raw = json.dumps(value)
