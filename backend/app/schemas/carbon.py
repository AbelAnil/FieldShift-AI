from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, ConfigDict


class CarbonPathwayInfo(BaseModel):
    id: str
    name: str
    relevance_kerala: str
    eligible_crops: List[str]
    methodology_code: str
    methodology_name: str
    registry: str
    yield_tco2e_per_ha_range: str
    evidence_required: List[str]
    description: str


class EligibilityScreenRequest(BaseModel):
    farm_id: str
    pathway: str  # "agroforestry", "rice_methane", "soil_carbon", "nitrogen"
    tree_density_per_acre: Optional[int] = None
    has_water_regime_control: Optional[bool] = None
    practices_mulching_or_cover_crops: Optional[bool] = None


class EligibilityScreenResponse(BaseModel):
    farm_id: str
    pathway: str
    status: str  # "eligible", "conditionally_eligible", "ineligible"
    readiness_score: float
    requirements_met: List[str]
    requirements_missing: List[str]
    guidance: str
    methodology_code: str
    next_steps: List[str]


class CarbonEstimateResponse(BaseModel):
    farm_id: str
    farm_name: str
    area_hectares: float
    area_acres: float
    pathway: str
    methodology: str
    conservative_tco2e_yr: float
    expected_tco2e_yr: float
    high_tco2e_yr: float
    assumed_carbon_price_usd: float
    gross_annual_usd_range: Dict[str, float]
    developer_commission_pct: float
    net_farmer_usd_range: Dict[str, float]
    net_farmer_inr_range: Dict[str, float]
    disclaimer: str
    economic_reality_note: str


class EvidenceCreate(BaseModel):
    pathway: str
    evidence_type: str
    title: str
    description: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None


class EvidenceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    farm_id: str
    pathway: str
    evidence_type: str
    title: str
    description: Optional[str] = None
    status: str
    recorded_at: datetime


class CarbonPartnerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    partner_type: str
    location: str
    typical_commission_pct: float
    description: Optional[str] = None
    contact_email: Optional[str] = None
    verified: str


class CarbonDossierResponse(BaseModel):
    farm_id: str
    farm_name: str
    generated_at: str
    eligibility_summary: List[Dict[str, Any]]
    estimates: List[Dict[str, Any]]
    evidence_checklist: List[Dict[str, Any]]
    evidence_gap_count: int
    recommended_aggregator: str
    markdown_pack: str
