import uuid
import json
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base


class Farm(Base):
    __tablename__ = "farms"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    farm_name = Column(String(255), nullable=False)
    location_name = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    
    # Boundary GeoJSON stored as text/json
    boundary_geojson_raw = Column(Text, nullable=False)
    
    total_area_hectares = Column(Float, nullable=False, default=0.0)
    total_area_acres = Column(Float, nullable=False, default=0.0)
    
    current_crop = Column(String(100), nullable=True)
    planting_date = Column(String(50), nullable=True)
    expected_harvest_date = Column(String(50), nullable=True)
    irrigation_available = Column(Boolean, default=False, nullable=False)
    farming_priorities = Column(String(255), default="Soil Health", nullable=False)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    owner = relationship("User", back_populates="farms")
    fields = relationship("Field", back_populates="farm", cascade="all, delete-orphan")

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

