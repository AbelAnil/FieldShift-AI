import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base


class CarbonMethodology(Base):
    __tablename__ = "carbon_methodologies"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    code = Column(String, unique=True, nullable=False)  # e.g. "VM0042", "AMS-III.AU", "GS-SOC"
    name = Column(String, nullable=False)
    carbon_registry = Column(String, nullable=False)     # "Verra VCS", "Gold Standard", "UNFCCC CDM"
    pathway = Column(String, nullable=False)            # "agroforestry", "rice_methane", "soil_carbon", "nitrogen"
    description = Column(Text, nullable=True)
    typical_tco2e_per_ha_min = Column(Float, default=1.0)
    typical_tco2e_per_ha_max = Column(Float, default=4.5)
    verification_cycle_years = Column(String, default="3-5 years")
    reference_url = Column(String, nullable=True)


class CarbonEligibility(Base):
    __tablename__ = "carbon_eligibilities"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    farm_id = Column(String, ForeignKey("farms.id", ondelete="CASCADE"), nullable=False)
    pathway = Column(String, nullable=False)
    status = Column(String, nullable=False)  # "eligible", "conditionally_eligible", "ineligible"
    readiness_score = Column(Float, default=0.0)
    requirements_met = Column(JSON, default=list)
    requirements_missing = Column(JSON, default=list)
    guidance = Column(Text, nullable=True)
    screened_at = Column(DateTime, default=datetime.utcnow)

    farm = relationship("Farm", backref="carbon_eligibilities")


class CarbonEstimate(Base):
    __tablename__ = "carbon_estimates"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    farm_id = Column(String, ForeignKey("farms.id", ondelete="CASCADE"), nullable=False)
    pathway = Column(String, nullable=False)
    methodology_code = Column(String, nullable=False)
    conservative_tco2e_yr = Column(Float, nullable=False)
    expected_tco2e_yr = Column(Float, nullable=False)
    high_tco2e_yr = Column(Float, nullable=False)
    carbon_price_usd_per_ton = Column(Float, default=15.0)
    gross_revenue_usd_yr = Column(Float, nullable=False)
    developer_commission_pct = Column(Float, default=30.0)
    net_revenue_usd_yr = Column(Float, nullable=False)
    net_revenue_inr_yr = Column(Float, nullable=False)
    disclaimer = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    farm = relationship("Farm", backref="carbon_estimates")


class CarbonEvidence(Base):
    __tablename__ = "carbon_evidences"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    farm_id = Column(String, ForeignKey("farms.id", ondelete="CASCADE"), nullable=False)
    pathway = Column(String, nullable=False)
    evidence_type = Column(String, nullable=False)  # "planting_record", "geotagged_photo", "soil_test", "water_log"
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, default="pending")       # "verified", "submitted", "pending"
    metadata_json = Column(JSON, nullable=True)
    recorded_at = Column(DateTime, default=datetime.utcnow)

    farm = relationship("Farm", backref="carbon_evidences")


class CarbonPartner(Base):
    __tablename__ = "carbon_partners"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    partner_type = Column(String, nullable=False)    # "FPO Aggregator", "Project Developer", "Cooperative"
    location = Column(String, nullable=False)
    pathways_supported = Column(JSON, default=list)
    typical_commission_pct = Column(Float, default=30.0)
    description = Column(Text, nullable=True)
    contact_email = Column(String, nullable=True)
    verified = Column(String, default="true")
