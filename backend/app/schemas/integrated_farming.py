from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class LivestockItem(BaseModel):
    id: str
    farm_id: str
    animal_type: str
    breed_name: str
    unit_count: int
    daily_yield_metric: Optional[str] = None
    daily_manure_kg_total: float
    biogas_linked: bool
    notes: Optional[str] = None
    created_at: str


class LivestockCreate(BaseModel):
    animal_type: str = Field(..., description="dairy_cattle, poultry, duck, or goat")
    breed_name: str = Field(..., description="Breed name e.g. Vechoor, Gramasree")
    unit_count: int = Field(1, ge=1)
    daily_yield_metric: Optional[str] = None
    daily_manure_kg_total: Optional[float] = 0.0
    biogas_linked: Optional[bool] = False
    notes: Optional[str] = None


class FarmPondItem(BaseModel):
    id: str
    farm_id: str
    pond_name: str
    surface_area_sqm: float
    mean_depth_m: float
    capacity_litres: float
    primary_fish_species: str
    stocking_density_count: int
    harvestable_catchment_m3: float
    irrigation_drawdown_days: int
    water_source: str
    created_at: str


class FarmPondCreate(BaseModel):
    pond_name: Optional[str] = "Rainwater Catchment Pond"
    surface_area_sqm: float = Field(..., gt=0)
    mean_depth_m: Optional[float] = 1.8
    primary_fish_species: Optional[str] = "Composite Carp (Catla, Rohu, Mrigal)"
    stocking_density_count: Optional[int] = 300
    water_source: Optional[str] = "Rainwater Runoff"


class ApicultureItem(BaseModel):
    id: str
    farm_id: str
    bee_species: str
    hive_count: int
    target_pollination_crops: List[str]
    annual_honey_yield_kg: float
    estimated_pollination_value_inr: float
    medicinal_honey_market: bool
    created_at: str


class ApicultureCreate(BaseModel):
    bee_species: str = Field(..., description="Apis cerana indica or Tetragonula iridipennis")
    hive_count: int = Field(4, ge=1)
    target_pollination_crops: Optional[List[str]] = None
    medicinal_honey_market: Optional[bool] = False


class CattleTHIStatus(BaseModel):
    farm_id: str
    farm_name: str
    temperature_c: float
    relative_humidity_pct: float
    thi_value: float
    stress_level: str  # "Normal / Comfortable", "Mild Stress", "Moderate Stress", "Severe Stress"
    respiration_impact: str
    milk_yield_risk_pct: float
    alert_triggered: bool
    recommended_interventions: List[str]
    nasa_telemetry_source: str


class RainwaterPondTelemetry(BaseModel):
    farm_id: str
    farm_name: str
    farm_area_acres: float
    cumulative_30d_rain_mm: float
    harvestable_runoff_m3: float
    harvestable_runoff_litres: float
    pond_capacity_m3: float
    pond_fill_percentage: float
    fish_carrying_capacity_kg: float
    emergency_dry_irrigation_days: int
    species_mix: List[Dict[str, Any]]
    management_advisory: str


class PollinationImpactTelemetry(BaseModel):
    farm_id: str
    active_crop: str
    hive_count: int
    bee_species: str
    projected_yield_increase_pct: float
    estimated_additional_harvest_value_inr: float
    annual_honey_production_kg: float
    annual_honey_gross_revenue_inr: float
    forage_calendar_status: str
    synergy_summary: str


class NutrientBioResourceBalance(BaseModel):
    farm_id: str
    total_fym_produced_tons_year: float
    total_poultry_manure_kg_year: float
    biogas_slurry_litres_year: float
    nitrogen_n_displaced_kg: float
    phosphorus_p_displaced_kg: float
    potassium_k_displaced_kg: float
    synthetic_fertilizer_cost_saved_inr: float
    soil_organic_carbon_gain_rate: str
    circular_loops: List[Dict[str, str]]


class IntegratedFarmingOverview(BaseModel):
    farm_id: str
    farm_name: str
    livestock: List[LivestockItem]
    ponds: List[FarmPondItem]
    apiculture: List[ApicultureItem]
    thi_status: CattleTHIStatus
    rainwater_telemetry: RainwaterPondTelemetry
    pollination_telemetry: PollinationImpactTelemetry
    nutrient_balance: NutrientBioResourceBalance
