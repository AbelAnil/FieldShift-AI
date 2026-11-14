import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey, Text
from app.database import Base


class TerrainAnalysis(Base):
    __tablename__ = "terrain_analyses"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    farm_id = Column(String(36), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)

    elevation_min = Column(Float, nullable=False)
    elevation_max = Column(Float, nullable=False)
    elevation_mean = Column(Float, nullable=False)
    slope_mean_deg = Column(Float, nullable=False)
    slope_class = Column(String(100), default="Gently sloping (2-5°)", nullable=False)
    aspect_dominant = Column(String(50), default="South-West", nullable=False)

    flow_accumulation_risk = Column(String(100), default="Moderate", nullable=False)  # Low, Moderate, High Swale
    topographic_wetness_index = Column(Float, default=7.2, nullable=False)
    drainage_assessment = Column(Text, nullable=False)
    farmer_marked_waterlogging = Column(Boolean, default=False, nullable=False)
    source_dataset = Column(String(100), default="NASADEM ~30m / Copernicus DEM", nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

