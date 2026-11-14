from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.farm import Farm
from app.models.soil_profile import SoilProfile
from app.services.soil_service import SoilService
from app.api.deps import get_current_user

router = APIRouter(prefix="/farms", tags=["Soil Intelligence"])


class SoilTestCreate(BaseModel):
    ph: float = Field(..., ge=3.0, le=10.0)
    nitrogen: Optional[float] = None
    phosphorus: Optional[float] = None
    potassium: Optional[float] = None
    organic_carbon: Optional[float] = None
    electrical_conductivity: Optional[float] = None
    texture: str = "Clay Loam"
    soil_depth_cm: Optional[float] = 60.0
    lab_name: Optional[str] = "Krishi Bhavan Soil Testing Lab"
    measurement_date: Optional[str] = None
    notes: Optional[str] = None


@router.post("/{farm_id}/soil", status_code=status.HTTP_201_CREATED)
def record_farmer_soil_test(
    farm_id: str,
    test_in: SoilTestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Records physical laboratory soil test results entered by the farmer.
    """
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found.")
    if farm.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden.")

    profile = SoilProfile(
        farm_id=farm.id,
        ph=test_in.ph,
        nitrogen=test_in.nitrogen,
        phosphorus=test_in.phosphorus,
        potassium=test_in.potassium,
        organic_carbon=test_in.organic_carbon,
        electrical_conductivity=test_in.electrical_conductivity,
        texture=test_in.texture,
        soil_depth_cm=test_in.soil_depth_cm,
        lab_name=test_in.lab_name,
        measurement_date=test_in.measurement_date,
        notes=test_in.notes,
        data_source="farmer_lab_test",
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)

    return {
        "message": "Physical laboratory soil test record added successfully.",
        "profile_id": profile.id,
        "ph": profile.ph,
        "texture": profile.texture,
        "data_source": profile.data_source,
    }


@router.get("/{farm_id}/soil-analysis")
def get_farm_soil_analysis(
    farm_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns soil condition analysis. Combines farmer laboratory measurements with
    SoilGrids modelled baseline. NPK deficiency warnings are suppressed if physical tests are absent.
    """
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found.")
    if farm.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden.")

    return SoilService.analyze_soil_profile(db, farm.id)

