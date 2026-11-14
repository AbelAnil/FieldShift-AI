from typing import Any, Dict, Optional
from pydantic import BaseModel


class GeoJSONValidationRequest(BaseModel):
    geojson: Dict[str, Any]


class GeoJSONValidationResponse(BaseModel):
    is_valid: bool
    error: Optional[str] = None
    area_hectares: Optional[float] = None
    area_acres: Optional[float] = None
    centroid_lat: Optional[float] = None
    centroid_lon: Optional[float] = None
    cleaned_geojson: Optional[Dict[str, Any]] = None
