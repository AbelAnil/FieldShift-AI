import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text, Index, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base


class EnvironmentalObservation(Base):
    __tablename__ = "environmental_observations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    farm_id = Column(String(36), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)
    field_id = Column(String(36), ForeignKey("fields.id", ondelete="CASCADE"), nullable=True)

    dataset = Column(String(100), nullable=False)  # NASA POWER, GPM IMERG, SMAP
    parameter = Column(String(50), nullable=False)  # rainfall, temp_mean, temp_max, temp_min, solar_radiation, relative_humidity, soil_moisture
    value = Column(Float, nullable=False)
    unit = Column(String(20), nullable=False)  # mm/day, degC, MJ/m^2/day, %, m^3/m^3
    observation_date = Column(String(10), nullable=False, index=True)  # YYYY-MM-DD
    spatial_resolution = Column(String(50), nullable=False)  # ~10 km, 0.5 deg, 9 km
    quality_metadata = Column(Text, nullable=True)
    data_class = Column(String(50), default="satellite", nullable=False)  # satellite, modelled, measured, forecast

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        UniqueConstraint("farm_id", "parameter", "observation_date", name="uq_env_farm_param_date"),
        Index("ix_env_farm_param_date", "farm_id", "parameter", "observation_date"),
    )


