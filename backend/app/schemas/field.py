from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field as PydanticField


class FieldBase(BaseModel):
    field_name: str = PydanticField(..., min_length=2, max_length=100)
    current_crop: Optional[str] = None
    planting_date: Optional[str] = None
    expected_harvest_date: Optional[str] = None
    irrigation_available: bool = False
    notes: Optional[str] = None


class FieldCreate(FieldBase):
    boundary_geojson: Dict[str, Any]


class FieldUpdate(BaseModel):
    field_name: Optional[str] = None
    boundary_geojson: Optional[Dict[str, Any]] = None
    current_crop: Optional[str] = None
    planting_date: Optional[str] = None
    expected_harvest_date: Optional[str] = None
    irrigation_available: Optional[bool] = None
    notes: Optional[str] = None


class FieldOut(FieldBase):
    id: str
    farm_id: str
    area_hectares: float
    area_acres: float
    boundary_geojson: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True
