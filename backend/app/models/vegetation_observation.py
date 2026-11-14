import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text
from app.database import Base


class VegetationObservation(Base):
    __tablename__ = "vegetation_observations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    farm_id = Column(String(36), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)
    field_id = Column(String(36), ForeignKey("fields.id", ondelete="CASCADE"), nullable=True)

    index_type = Column(String(20), nullable=False, index=True)  # NDVI, NDMI, EVI
    value = Column(Float, nullable=False)
    observation_date = Column(String(10), nullable=False, index=True)  # YYYY-MM-DD
    satellite_source = Column(String(100), nullable=False)  # Landsat 8, Landsat 9, Sentinel-2, MODIS
    spatial_resolution = Column(String(50), default="30m", nullable=False)
    cloud_cover_pct = Column(Float, default=0.0, nullable=False)
    quality_metadata = Column(Text, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

