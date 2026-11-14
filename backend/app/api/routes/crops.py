from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.farm import Farm
from app.services.crop_service import CropService
from app.services.soil_service import SoilService
from app.services.terrain_service import TerrainService
from app.services.nasa_power_service import NASAPowerService
from app.api.deps import get_current_user

router = APIRouter(prefix="/crops", tags=["Crop Intelligence & Suitability"])


class SuitabilityEvaluationRequest(BaseModel):
    farm_id: str
    target_crop_id: Optional[str] = None  # None evaluates all 12 crops


@router.get("")
def list_crops(db: Session = Depends(get_db)):
    """
    Returns the Kerala Crop Knowledge Database (12 regional crops) with agronomic thresholds.
    """
    crops = CropService.list_crops(db)
    return [
        {
            "id": c.id,
            "crop_name": c.crop_name,
            "scientific_name": c.scientific_name,
            "crop_family": c.crop_family,
            "duration_days": f"{c.duration_days_min}-{c.duration_days_max} days",
            "planting_windows": c.planting_windows,
            "water_requirement_mm": c.water_requirement_mm,
            "water_demand_category": c.water_demand_category,
            "ph_range": f"{c.ph_min} - {c.ph_max} (Opt: {c.ph_optimal})",
            "temp_range": f"{c.temp_min_c} - {c.temp_max_c}°C (Opt: {c.temp_optimal_c}°C)",
            "drainage_preference": c.drainage_preference,
            "nitrogen_fixation": c.nitrogen_fixation,
            "soil_cover_rating": c.soil_cover_rating,
            "agronomic_source": c.agronomic_source,
        }
        for c in crops
    ]


@router.get("/{crop_id}")
def get_crop_details(crop_id: str, db: Session = Depends(get_db)):
    crop = CropService.get_crop(db, crop_id)
    if not crop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Crop not found.")
    return crop


@router.post("/suitability")
async def evaluate_farm_crop_suitability(
    payload: SuitabilityEvaluationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Evaluates crop suitability against the farm's live environmental observations,
    soil profile, and terrain hydrology.
    """
    farm = db.query(Farm).filter(Farm.id == payload.farm_id).first()
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found.")
    if farm.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden.")

    # 1. Fetch soil
    soil = SoilService.analyze_soil_profile(db, farm.id)
    ph = soil["effective_ph"]
    texture = soil["effective_texture"]
    has_lab = soil["has_lab_test"]

    # 2. Fetch terrain
    terrain = TerrainService.get_or_calculate_terrain(db, farm.id, farm.latitude, farm.longitude)
    slope = terrain["slope_mean_deg"]
    flow_risk = terrain["flow_accumulation_risk"]

    # 3. Fetch weather
    weather = await NASAPowerService.fetch_and_store_weather(
        db, farm.id, farm.latitude, farm.longitude, days_back=30
    )
    valid_temps = [w["temp_mean"] for w in weather if w.get("temp_mean", -999) > -50]
    avg_temp = sum(valid_temps) / max(len(valid_temps), 1) if valid_temps else 27.2
    rainfall_30d = sum(w["rainfall_mm"] for w in weather)

    # 4. Evaluate crops
    if payload.target_crop_id:
        target = CropService.get_crop(db, payload.target_crop_id)
        if not target:
            raise HTTPException(status_code=404, detail="Crop not found")
        crops_to_eval = [target]
    else:
        crops_to_eval = CropService.list_crops(db)

    evaluations = []
    for c in crops_to_eval:
        result = CropService.calculate_suitability(
            crop=c,
            ph=ph,
            texture=texture,
            avg_temp=avg_temp,
            rainfall_30d=rainfall_30d,
            irrigation_available=farm.irrigation_available,
            slope_deg=slope,
            flow_risk=flow_risk,
            has_lab_test=has_lab,
        )
        evaluations.append(result)

    # Sort by suitability score descending
    evaluations.sort(key=lambda x: x["suitability_score"], reverse=True)

    return {
        "farm_id": farm.id,
        "farm_name": farm.farm_name,
        "evaluation_count": len(evaluations),
        "telemetry_used": {
            "soil_ph": ph,
            "soil_source": soil["data_source_used"],
            "ambient_temp_avg_c": round(avg_temp, 1),
            "precipitation_30d_mm": round(rainfall_30d, 1),
            "slope_deg": slope,
            "drainage_flow_risk": flow_risk,
            "irrigation_active": farm.irrigation_available,
        },
        "crops": evaluations,
    }
