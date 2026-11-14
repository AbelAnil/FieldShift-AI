from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.farm import Farm
from app.services.terrain_service import TerrainService
from app.api.deps import get_current_user

router = APIRouter(prefix="/farms", tags=["Terrain & Drainage Hydrology"])


class WaterloggingToggle(BaseModel):
    marked: bool


@router.get("/{farm_id}/terrain")
def get_farm_terrain_analysis(
    farm_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns NASADEM / SRTM elevation relief, slope gradient, and PySheds flow accumulation risk.
    """
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found.")
    if farm.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden.")

    return TerrainService.get_or_calculate_terrain(db, farm.id, farm.latitude, farm.longitude)


@router.post("/{farm_id}/terrain/waterlogging")
def mark_observed_waterlogging(
    farm_id: str,
    payload: WaterloggingToggle,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Enables farmers to mark or unmark observed waterlogging zones to calibrate drainage indicators.
    """
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found.")
    if farm.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden.")

    success = TerrainService.set_waterlogging_marker(db, farm.id, payload.marked)
    return {"success": success, "farmer_marked_waterlogging": payload.marked}

