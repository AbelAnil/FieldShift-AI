from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.farm import Farm
from app.models.digital_twin_snapshot import DigitalTwinSnapshot
from app.services.digital_twin_service import DigitalTwinService
from app.api.deps import get_current_user

router = APIRouter(prefix="/farms", tags=["Predictive Farm Digital Twin"])


class SimulationRequest(BaseModel):
    crop_name: str = "Tapioca (Cassava)"
    rainfall_delta_pct: float = Field(0.0, ge=-80.0, le=100.0)  # -80% to +100%
    irrigation_available: Optional[bool] = None
    planting_delay_days: int = Field(0, ge=0, le=90)


@router.get("/{farm_id}/digital-twin")
async def get_farm_digital_twin(
    farm_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns the comprehensive virtual digital twin of the farm:
    Geography, Soil, Terrain, Earth Observation, Vegetation vigor, and Multi-Factor Environmental Risk Assessment.
    """
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found.")
    if farm.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden.")

    return await DigitalTwinService.get_or_create_twin(db, farm)


@router.post("/{farm_id}/digital-twin/simulate")
def simulate_farm_scenario(
    farm_id: str,
    payload: SimulationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Executes what-if simulation:
    Evaluates how changing crop, rainfall shocks, irrigation failure, or delayed planting affects farm risk and suitability.
    """
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found.")
    if farm.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden.")

    return DigitalTwinService.simulate_scenario(
        db=db,
        farm=farm,
        crop_name=payload.crop_name,
        rainfall_delta_pct=payload.rainfall_delta_pct,
        irrigation_available=payload.irrigation_available,
        planting_delay_days=payload.planting_delay_days,
    )


@router.get("/{farm_id}/digital-twin/history")
def get_digital_twin_history(
    farm_id: str,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found.")
    if farm.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden.")

    snapshots = (
        db.query(DigitalTwinSnapshot)
        .filter(DigitalTwinSnapshot.farm_id == farm.id)
        .order_by(DigitalTwinSnapshot.created_at.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "id": s.id,
            "snapshot_date": s.snapshot_date,
            "overall_risk_score": s.overall_risk_score,
            "risk_level": s.risk_level,
            "data_completeness_pct": s.data_completeness_pct,
            "risk_factors": s.risk_factors,
            "created_at": s.created_at.isoformat(),
        }
        for s in snapshots
    ]

