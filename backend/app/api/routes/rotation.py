from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.farm import Farm
from app.services.rotation_optimizer import RotationOptimizer
from app.api.deps import get_current_user

router = APIRouter(prefix="/farms", tags=["Crop Rotation Optimization"])


@router.get("/{farm_id}/rotation")
def get_farm_rotation_strategies(
    farm_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns 3 distinct multi-year rotation strategies for the farm:
    Strategy A (Soil Health), Strategy B (Water Efficiency), and Strategy C (Balanced).
    """
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found.")
    if farm.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden.")

    strategies = RotationOptimizer.generate_strategies_for_farm(db, farm)
    return {
        "farm_id": farm.id,
        "farm_name": farm.farm_name,
        "current_crop": farm.current_crop,
        "strategies_count": len(strategies),
        "strategies": strategies,
    }


@router.post("/{farm_id}/rotation/generate")
def force_regenerate_rotation(
    farm_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_farm_rotation_strategies(farm_id, db, current_user)

