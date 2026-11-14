from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.farm import Farm
from app.api.deps import get_current_user
from app.schemas.carbon import (
    CarbonPathwayInfo,
    EligibilityScreenRequest,
    EligibilityScreenResponse,
    CarbonEstimateResponse,
    EvidenceCreate,
    EvidenceOut,
    CarbonPartnerOut,
    CarbonDossierResponse,
)
from app.services.carbon_service import CarbonService

router = APIRouter(tags=["Carbon Credit Module"])


@router.get("/carbon/pathways", response_model=List[CarbonPathwayInfo])
def get_candidate_pathways():
    """
    Returns candidate carbon credit practice pathways relevant to Kerala agriculture.
    """
    return CarbonService.list_pathways()


@router.get("/carbon/partners", response_model=List[CarbonPartnerOut])
def get_verified_partners():
    """
    Returns list of verified FPO aggregators, cooperatives, and project developers.
    """
    return CarbonService.list_partners()


@router.post("/carbon/eligibility", response_model=EligibilityScreenResponse)
def screen_farm_carbon_eligibility(
    req: EligibilityScreenRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Screens farm eligibility against approved international carbon methodologies (Verra, Gold Standard, CDM).
    """
    farm = db.query(Farm).filter(Farm.id == req.farm_id).first()
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found")
    if farm.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    try:
        return CarbonService.screen_eligibility(
            db=db,
            farm_id=farm.id,
            pathway_id=req.pathway,
            tree_density=req.tree_density_per_acre,
            has_water_control=req.has_water_regime_control,
            practices_cover_crops=req.practices_mulching_or_cover_crops,
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/farms/{farm_id}/carbon/estimate", response_model=CarbonEstimateResponse)
def get_farm_carbon_estimate(
    farm_id: str,
    pathway: str = "agroforestry",
    carbon_price_usd: float = 15.0,
    developer_commission_pct: float = 30.0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Calculates conservative low, expected, and high carbon yields (tCO2e/yr)
    and net farmer revenue after deducting developer/verifier fees.
    """
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found")
    if farm.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    return CarbonService.calculate_estimate(
        db=db,
        farm_id=farm.id,
        pathway_id=pathway,
        carbon_price_usd=carbon_price_usd,
        developer_commission_pct=developer_commission_pct,
    )


@router.get("/farms/{farm_id}/carbon/evidence", response_model=List[EvidenceOut])
def get_farm_carbon_evidence(
    farm_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns recorded evidence items for the farm.
    """
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found")
    if farm.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    return CarbonService.list_evidence(db, farm.id)


@router.post("/farms/{farm_id}/carbon/evidence", response_model=EvidenceOut, status_code=status.HTTP_201_CREATED)
def record_carbon_evidence(
    farm_id: str,
    evidence_in: EvidenceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Records an evidence document (e.g. planting log, geotagged photo, soil test receipt).
    """
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found")
    if farm.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    item = CarbonService.add_evidence(
        db=db,
        farm_id=farm.id,
        pathway=evidence_in.pathway,
        evidence_type=evidence_in.evidence_type,
        title=evidence_in.title,
        description=evidence_in.description,
        metadata_json=evidence_in.metadata_json,
    )
    return item


@router.get("/farms/{farm_id}/carbon/dossier", response_model=CarbonDossierResponse)
def get_carbon_aggregation_dossier(
    farm_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generates a full carbon credit readiness & aggregation submission pack.
    """
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found")
    if farm.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    return CarbonService.generate_carbon_dossier(db, farm.id)
