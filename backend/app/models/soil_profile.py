import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base


class SoilProfile(Base):
    __tablename__ = "soil_profiles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    farm_id = Column(String(36), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)
    field_id = Column(String(36), ForeignKey("fields.id", ondelete="CASCADE"), nullable=True)

    # Chemical & Physical properties
    ph = Column(Float, nullable=False)
    nitrogen = Column(Float, nullable=True)  # Available N in kg/ha
    phosphorus = Column(Float, nullable=True)  # Available P2O5 in kg/ha
    potassium = Column(Float, nullable=True)  # Available K2O in kg/ha
    organic_carbon = Column(Float, nullable=True)  # %
    electrical_conductivity = Column(Float, nullable=True)  # dS/m
    texture = Column(String(50), default="Clay Loam", nullable=False)
    soil_depth_cm = Column(Float, default=60.0, nullable=True)
    bulk_density = Column(Float, nullable=True)  # cg/cm3 or g/cm3

    # Provenance
    data_source = Column(String(50), default="farmer_lab_test", nullable=False)  # farmer_lab_test, soilgrids_modelled
    measurement_date = Column(String(10), nullable=True)
    lab_name = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
