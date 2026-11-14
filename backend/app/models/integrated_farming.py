import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base


class LivestockProfile(Base):
    __tablename__ = "livestock_profiles"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    farm_id = Column(String, ForeignKey("farms.id", ondelete="CASCADE"), nullable=False)
    animal_type = Column(String, nullable=False)  # "dairy_cattle", "poultry", "duck", "goat"
    breed_name = Column(String, nullable=False)   # e.g. "Vechoor Cow", "Gramasree", "Kuttanad Duck"
    unit_count = Column(Integer, default=1, nullable=False)
    daily_yield_metric = Column(String, nullable=True)  # e.g. "12 litres milk/day", "25 eggs/day"
    daily_manure_kg_total = Column(Float, default=0.0)  # total daily manure generated in kg
    biogas_linked = Column(Boolean, default=False)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    farm = relationship("Farm", backref="livestock_profiles")


class FarmPondProfile(Base):
    __tablename__ = "farm_pond_profiles"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    farm_id = Column(String, ForeignKey("farms.id", ondelete="CASCADE"), nullable=False)
    pond_name = Column(String, default="Rainwater Catchment Pond")
    surface_area_sqm = Column(Float, nullable=False)  # e.g. 150 m²
    mean_depth_m = Column(Float, default=1.8, nullable=False)
    capacity_litres = Column(Float, default=0.0)
    primary_fish_species = Column(String, default="Composite Carp (Catla, Rohu, Mrigal)")
    stocking_density_count = Column(Integer, default=300)
    harvestable_catchment_m3 = Column(Float, default=0.0)
    irrigation_drawdown_days = Column(Integer, default=45)  # how many dry days it can support
    water_source = Column(String, default="Rainwater Runoff & Spring")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    farm = relationship("Farm", backref="farm_pond_profiles")


class ApicultureProfile(Base):
    __tablename__ = "apiculture_profiles"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    farm_id = Column(String, ForeignKey("farms.id", ondelete="CASCADE"), nullable=False)
    bee_species = Column(String, nullable=False)  # "Apis cerana indica" or "Tetragonula iridipennis"
    hive_count = Column(Integer, default=4, nullable=False)
    target_pollination_crops = Column(JSON, default=list)  # ["Nutmeg", "Coconut", "Vegetables"]
    annual_honey_yield_kg = Column(Float, default=0.0)
    estimated_pollination_value_inr = Column(Float, default=0.0)
    medicinal_honey_market = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    farm = relationship("Farm", backref="apiculture_profiles")
