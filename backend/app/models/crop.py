from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Text
from app.database import Base


class Crop(Base):
    __tablename__ = "crops"

    id = Column(String(50), primary_key=True)  # CROP-RICE, CROP-BANANA, etc.
    crop_name = Column(String(100), unique=True, nullable=False)
    scientific_name = Column(String(100), nullable=False)
    crop_family = Column(String(50), nullable=False)  # Poaceae, Musaceae, Fabaceae, Euphorbiaceae, Zingiberaceae, Solanaceae

    duration_days_min = Column(Integer, nullable=False)
    duration_days_max = Column(Integer, nullable=False)
    planting_windows = Column(String(255), nullable=False)

    temp_min_c = Column(Float, nullable=False)
    temp_max_c = Column(Float, nullable=False)
    temp_optimal_c = Column(Float, nullable=False)

    ph_min = Column(Float, nullable=False)
    ph_max = Column(Float, nullable=False)
    ph_optimal = Column(Float, nullable=False)

    water_requirement_mm = Column(Integer, nullable=False)
    water_demand_category = Column(String(20), default="Moderate", nullable=False)  # High, Moderate, Low
    drainage_preference = Column(String(100), default="Well-drained", nullable=False)

    nitrogen_fixation = Column(Boolean, default=False, nullable=False)
    soil_cover_rating = Column(String(20), default="Moderate", nullable=False)  # High, Moderate, Low
    nutrient_demand = Column(String(20), default="Moderate", nullable=False)

    compatible_next_crops = Column(Text, nullable=False)  # Comma-separated crop IDs
    incompatible_next_crops = Column(Text, nullable=True)
    agronomic_source = Column(String(255), default="Kerala Agricultural University (KAU) / ICAR", nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
