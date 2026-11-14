from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.farm import Farm
from app.models.integrated_farming import LivestockProfile, FarmPondProfile, ApicultureProfile
from app.api.deps import get_current_user
from app.schemas.integrated_farming import (
    IntegratedFarmingOverview,
    CattleTHIStatus,
    RainwaterPondTelemetry,
    PollinationImpactTelemetry,
    NutrientBioResourceBalance,
    LivestockCreate,
    LivestockItem,
    FarmPondCreate,
    FarmPondItem,
    ApicultureCreate,
    ApicultureItem,
)
from app.services.integrated_farming_service import IntegratedFarmingService

router = APIRouter(prefix="/integrated-farming", tags=["Integrated Farming Systems (IFS)"])


@router.get("/{farm_id}", response_model=IntegratedFarmingOverview)
async def get_integrated_farming_overview(
    farm_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieves full Integrated Farming System (IFS) overview for the farm:
    - Livestock, Pond, and Apiculture profiles
    - Live cattle Temperature-Humidity Index (THI) heat stress gauge from NASA POWER
    - Rainwater pond capacity and fish stocking from NASA GPM
    - Bee pollination crop yield multiplier
    - Circular bio-resource balance & chemical fertilizer savings
    """
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found")
    if farm.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    return await IntegratedFarmingService.get_full_overview(db, farm)


@router.get("/{farm_id}/thi-telemetry", response_model=CattleTHIStatus)
async def get_cattle_thi_telemetry(
    farm_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Live Temperature-Humidity Index (THI) livestock heat stress monitoring using NASA POWER.
    """
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found")
    if farm.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    return await IntegratedFarmingService.calculate_cattle_thi(db, farm)


@router.get("/{farm_id}/rainwater-pond", response_model=RainwaterPondTelemetry)
async def get_rainwater_pond_telemetry(
    farm_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Calculates harvestable pond volume, fish carrying capacity, and drought irrigation days
    using NASA GPM 30-day precipitation.
    """
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found")
    if farm.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    return await IntegratedFarmingService.calculate_rainwater_pond_telemetry(db, farm)


@router.get("/{farm_id}/pollination-impact", response_model=PollinationImpactTelemetry)
async def get_pollination_impact_telemetry(
    farm_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Calculates apiculture cross-pollination yield boost for active crop and honey revenue.
    """
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found")
    if farm.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    return await IntegratedFarmingService.calculate_pollination_impact(db, farm)


@router.get("/{farm_id}/nutrient-balance", response_model=NutrientBioResourceBalance)
def get_nutrient_bioresource_balance(
    farm_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Calculates circular nutrient balance: cattle dung + poultry manure + biogas slurry
    displacing synthetic NPK purchases in kg and annual INR savings.
    """
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found")
    if farm.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    return IntegratedFarmingService.calculate_nutrient_bioresource_balance(db, farm)


@router.post("/{farm_id}/livestock", response_model=LivestockItem)
def add_livestock_profile(
    farm_id: str,
    payload: LivestockCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Registers or updates a livestock or poultry asset on the farm.
    """
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found")
    if farm.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    manure_estimate = payload.daily_manure_kg_total or (11.0 * payload.unit_count if payload.animal_type == "dairy_cattle" else 0.15 * payload.unit_count)
    item = LivestockProfile(
        farm_id=farm.id,
        animal_type=payload.animal_type,
        breed_name=payload.breed_name,
        unit_count=payload.unit_count,
        daily_yield_metric=payload.daily_yield_metric,
        daily_manure_kg_total=manure_estimate,
        biogas_linked=payload.biogas_linked or False,
        notes=payload.notes,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return LivestockItem(
        id=item.id,
        farm_id=item.farm_id,
        animal_type=item.animal_type,
        breed_name=item.breed_name,
        unit_count=item.unit_count,
        daily_yield_metric=item.daily_yield_metric,
        daily_manure_kg_total=item.daily_manure_kg_total,
        biogas_linked=item.biogas_linked,
        notes=item.notes,
        created_at=item.created_at.isoformat(),
    )


@router.post("/{farm_id}/pond", response_model=FarmPondItem)
def add_farm_pond_profile(
    farm_id: str,
    payload: FarmPondCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Registers a new farm pond profile with capacity calculations.
    """
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found")
    if farm.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    mean_depth = payload.mean_depth_m or 1.8
    capacity_litres = payload.surface_area_sqm * mean_depth * 1000.0
    item = FarmPondProfile(
        farm_id=farm.id,
        pond_name=payload.pond_name or "Rainwater Catchment Pond",
        surface_area_sqm=payload.surface_area_sqm,
        mean_depth_m=mean_depth,
        capacity_litres=capacity_litres,
        primary_fish_species=payload.primary_fish_species or "Composite Carp (Catla, Rohu, Mrigal)",
        stocking_density_count=payload.stocking_density_count or int(payload.surface_area_sqm * 2.5),
        harvestable_catchment_m3=round(capacity_litres / 1000.0, 1),
        irrigation_drawdown_days=45,
        water_source=payload.water_source or "Rainwater Runoff",
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return FarmPondItem(
        id=item.id,
        farm_id=item.farm_id,
        pond_name=item.pond_name,
        surface_area_sqm=item.surface_area_sqm,
        mean_depth_m=item.mean_depth_m,
        capacity_litres=item.capacity_litres,
        primary_fish_species=item.primary_fish_species,
        stocking_density_count=item.stocking_density_count,
        harvestable_catchment_m3=item.harvestable_catchment_m3,
        irrigation_drawdown_days=item.irrigation_drawdown_days,
        water_source=item.water_source,
        created_at=item.created_at.isoformat(),
    )


@router.post("/{farm_id}/apiculture", response_model=ApicultureItem)
def add_apiculture_profile(
    farm_id: str,
    payload: ApicultureCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Registers an apiculture (bee keeping) profile.
    """
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found")
    if farm.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    is_stingless = "stingless" in payload.bee_species.lower() or "tetragonula" in payload.bee_species.lower()
    annual_honey = payload.hive_count * (1.2 if is_stingless else 10.0)
    pollination_val = payload.hive_count * 5500.0

    item = ApicultureProfile(
        farm_id=farm.id,
        bee_species=payload.bee_species,
        hive_count=payload.hive_count,
        target_pollination_crops=payload.target_pollination_crops or ["Nutmeg", "Coconut", "Vegetables"],
        annual_honey_yield_kg=round(annual_honey, 1),
        estimated_pollination_value_inr=round(pollination_val, 0),
        medicinal_honey_market=payload.medicinal_honey_market or is_stingless,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return ApicultureItem(
        id=item.id,
        farm_id=item.farm_id,
        bee_species=item.bee_species,
        hive_count=item.hive_count,
        target_pollination_crops=item.target_pollination_crops or [],
        annual_honey_yield_kg=item.annual_honey_yield_kg,
        estimated_pollination_value_inr=item.estimated_pollination_value_inr,
        medicinal_honey_market=item.medicinal_honey_market,
        created_at=item.created_at.isoformat(),
    )
