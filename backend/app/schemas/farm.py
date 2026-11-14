from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field as PydanticField
from app.schemas.field import FieldOut


class FarmBase(BaseModel):
    farm_name: str = PydanticField(..., min_length=2, max_length=100)
    location_name: str = PydanticField(..., min_length=2, max_length=100)
    current_crop: Optional[str] = None
    planting_date: Optional[str] = None
    expected_harvest_date: Optional[str] = None
    irrigation_available: bool = False
    farming_priorities: str = "Soil Health"


class FarmCreate(FarmBase):
    boundary_geojson: Dict[str, Any]


class FarmUpdate(BaseModel):
    farm_name: Optional[str] = None
    location_name: Optional[str] = None
    boundary_geojson: Optional[Dict[str, Any]] = None
    current_crop: Optional[str] = None
    planting_date: Optional[str] = None
    expected_harvest_date: Optional[str] = None
    irrigation_available: Optional[bool] = None
    farming_priorities: Optional[str] = None


class FarmOut(FarmBase):
    id: str
    user_id: str
    latitude: float
    longitude: float
    total_area_hectares: float
    total_area_acres: float
    boundary_geojson: Dict[str, Any]
    created_at: datetime
    fields: Optional[List[FieldOut]] = []

    model_config = ConfigDict(from_attributes=True)

