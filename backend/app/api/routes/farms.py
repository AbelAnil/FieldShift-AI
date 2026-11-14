from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.farm import Farm
from app.models.field import Field
from app.schemas.farm import FarmCreate, FarmUpdate, FarmOut
from app.schemas.field import FieldCreate, FieldOut
from app.schemas.geojson import GeoJSONValidationRequest, GeoJSONValidationResponse
from app.utils.geo import validate_and_process_geojson
from app.api.deps import get_current_user

router = APIRouter(tags=["Farms & Fields"])


@router.post("/fields/validate-geojson", response_model=GeoJSONValidationResponse)
def validate_geojson_endpoint(payload: GeoJSONValidationRequest):
    """
    Validates a GeoJSON polygon without saving, returning geodesic area and centroid.
    """
    try:
        cleaned_geom, ha, acres, centroid = validate_and_process_geojson(payload.geojson)
        return GeoJSONValidationResponse(
            is_valid=True,
            area_hectares=ha,
            area_acres=acres,
            centroid_lat=centroid[0],
            centroid_lon=centroid[1],
            cleaned_geojson=cleaned_geom,
        )
    except Exception as e:
        return GeoJSONValidationResponse(
            is_valid=False,
            error=str(e),
        )


@router.post("/farms", response_model=FarmOut, status_code=status.HTTP_201_CREATED)
def create_farm(
    farm_in: FarmCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Register a new farm with an interactive field boundary polygon.
    Calculates exact geodesic area from the boundary geometry.
    """
    try:
        cleaned_geom, ha, acres, (lat, lon) = validate_and_process_geojson(farm_in.boundary_geojson)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid field boundary GeoJSON: {str(e)}",
        )

    farm = Farm(
        user_id=current_user.id,
        farm_name=farm_in.farm_name,
        location_name=farm_in.location_name,
        latitude=lat,
        longitude=lon,
        total_area_hectares=ha,
        total_area_acres=acres,
        current_crop=farm_in.current_crop,
        planting_date=farm_in.planting_date,
        expected_harvest_date=farm_in.expected_harvest_date,
        irrigation_available=farm_in.irrigation_available,
        farming_priorities=farm_in.farming_priorities,
    )
    farm.boundary_geojson = cleaned_geom

    db.add(farm)
    db.commit()
    db.refresh(farm)
    return farm


@router.get("/farms", response_model=List[FarmOut])
def list_farms(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List all farms belonging to the authenticated user.
    """
    farms = db.query(Farm).filter(Farm.user_id == current_user.id).order_by(Farm.created_at.desc()).all()
    return farms


@router.get("/farms/{farm_id}", response_model=FarmOut)
def get_farm(
    farm_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve farm profile and boundary. Enforces per-user ownership.
    """
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found.")

    if farm.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: you do not have permission to view this farm.",
        )

    return farm


@router.patch("/farms/{farm_id}", response_model=FarmOut)
def update_farm(
    farm_id: str,
    farm_update: FarmUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found.")

    if farm.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: you do not have permission to update this farm.",
        )

    update_data = farm_update.model_dump(exclude_unset=True)

    if "boundary_geojson" in update_data and update_data["boundary_geojson"]:
        try:
            cleaned_geom, ha, acres, (lat, lon) = validate_and_process_geojson(update_data["boundary_geojson"])
            farm.boundary_geojson = cleaned_geom
            farm.total_area_hectares = ha
            farm.total_area_acres = acres
            farm.latitude = lat
            farm.longitude = lon
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid field boundary GeoJSON: {str(e)}",
            )
        del update_data["boundary_geojson"]

    for field, value in update_data.items():
        setattr(farm, field, value)

    db.commit()
    db.refresh(farm)
    return farm


@router.delete("/farms/{farm_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_farm(
    farm_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found.")

    if farm.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: you do not have permission to delete this farm.",
        )

    # Clean up dependent records explicitly before deleting farm
    from app.models.carbon import CarbonEligibility, CarbonEstimate, CarbonEvidence
    from app.models.chat_session import ChatSession, ChatMessage
    from app.models.digital_twin_snapshot import DigitalTwinSnapshot
    from app.models.environmental_observation import EnvironmentalObservation
    from app.models.field import Field
    from app.models.integrated_farming import IntegratedFarmingPlan, FarmPond, ApicultureUnit
    from app.models.rotation_plan import RotationPlan
    from app.models.soil_profile import SoilProfile
    from app.models.task import Task
    from app.models.terrain_analysis import TerrainAnalysis
    from app.models.vegetation_observation import VegetationObservation

    # Clean up chat messages via sessions
    session_ids = [s.id for s in db.query(ChatSession).filter(ChatSession.farm_id == farm_id).all()]
    if session_ids:
        db.query(ChatMessage).filter(ChatMessage.session_id.in_(session_ids)).delete(synchronize_session=False)

    db.query(ChatSession).filter(ChatSession.farm_id == farm_id).delete(synchronize_session=False)
    db.query(CarbonEligibility).filter(CarbonEligibility.farm_id == farm_id).delete(synchronize_session=False)
    db.query(CarbonEstimate).filter(CarbonEstimate.farm_id == farm_id).delete(synchronize_session=False)
    db.query(CarbonEvidence).filter(CarbonEvidence.farm_id == farm_id).delete(synchronize_session=False)
    db.query(DigitalTwinSnapshot).filter(DigitalTwinSnapshot.farm_id == farm_id).delete(synchronize_session=False)
    db.query(EnvironmentalObservation).filter(EnvironmentalObservation.farm_id == farm_id).delete(synchronize_session=False)
    db.query(Field).filter(Field.farm_id == farm_id).delete(synchronize_session=False)
    db.query(IntegratedFarmingPlan).filter(IntegratedFarmingPlan.farm_id == farm_id).delete(synchronize_session=False)
    db.query(FarmPond).filter(FarmPond.farm_id == farm_id).delete(synchronize_session=False)
    db.query(ApicultureUnit).filter(ApicultureUnit.farm_id == farm_id).delete(synchronize_session=False)
    db.query(RotationPlan).filter(RotationPlan.farm_id == farm_id).delete(synchronize_session=False)
    db.query(SoilProfile).filter(SoilProfile.farm_id == farm_id).delete(synchronize_session=False)
    db.query(Task).filter(Task.farm_id == farm_id).delete(synchronize_session=False)
    db.query(TerrainAnalysis).filter(TerrainAnalysis.farm_id == farm_id).delete(synchronize_session=False)
    db.query(VegetationObservation).filter(VegetationObservation.farm_id == farm_id).delete(synchronize_session=False)

    db.delete(farm)
    db.commit()
    return None


@router.post("/farms/{farm_id}/fields", response_model=FieldOut, status_code=status.HTTP_201_CREATED)
def create_field_block(
    farm_id: str,
    field_in: FieldCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found.")

    if farm.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden.")

    try:
        cleaned_geom, ha, acres, _ = validate_and_process_geojson(field_in.boundary_geojson)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid field block boundary GeoJSON: {str(e)}",
        )

    field_obj = Field(
        farm_id=farm.id,
        field_name=field_in.field_name,
        area_hectares=ha,
        area_acres=acres,
        current_crop=field_in.current_crop,
        planting_date=field_in.planting_date,
        expected_harvest_date=field_in.expected_harvest_date,
        irrigation_available=field_in.irrigation_available,
        notes=field_in.notes,
    )
    field_obj.boundary_geojson = cleaned_geom

    db.add(field_obj)
    db.commit()
    db.refresh(field_obj)
    return field_obj


@router.get("/farms/{farm_id}/fields", response_model=List[FieldOut])
def list_fields(
    farm_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found.")

    if farm.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden.")

    return farm.fields


@router.post("/farms/demo/load", response_model=FarmOut)
async def load_demo_farm(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Demo Mode: Instantly loads or verifies a pre-seeded 2.1-acre Kerala smallholder farm
    (Kanjirappally Valley Farm) complete with field polygon, Krishi Bhavan certified lab test,
    NASA Earth telemetry, terrain analysis, and multi-year rotation plans.
    """
    existing_farm = db.query(Farm).filter(Farm.user_id == current_user.id).first()
    if existing_farm:
        return existing_farm

    # Create demo farm
    kanjirappally_polygon = {
        "type": "Polygon",
        "coordinates": [
            [
                [76.7850, 9.5530],
                [76.7875, 9.5532],
                [76.7880, 9.5555],
                [76.7855, 9.5558],
                [76.7848, 9.5542],
                [76.7850, 9.5530],
            ]
        ],
    }
    cleaned, ha, acres, (lat, lon) = validate_and_process_geojson(kanjirappally_polygon)

    farm = Farm(
        user_id=current_user.id,
        farm_name="Kanjirappally Valley Farm",
        location_name="Kanjirappally, Kottayam, Kerala",
        latitude=lat,
        longitude=lon,
        total_area_hectares=ha,
        total_area_acres=acres,
        current_crop="Robusta Banana",
        planting_date="2026-06-15",
        expected_harvest_date="2027-04-20",
        irrigation_available=True,
        farming_priorities="Soil Health & Moisture Retention",
    )
    farm.boundary_geojson = cleaned
    db.add(farm)
    db.commit()
    db.refresh(farm)

    # Add certified physical soil test
    from app.models.soil_profile import SoilProfile
    soil = SoilProfile(
        farm_id=farm.id,
        ph=6.1,
        nitrogen=245.0,
        phosphorus=32.0,
        potassium=275.0,
        organic_carbon=2.14,
        electrical_conductivity=0.42,
        texture="Clay Loam",
        soil_depth_cm=60.0,
        lab_name="Krishi Bhavan Soil Testing Lab, Kanjirappally",
        measurement_date="2026-09-10",
        notes="Official certified composite sample. Slightly acidic lateritic loam with optimal SOC.",
        data_source="farmer_lab_test",
    )
    db.add(soil)

    # Seed 2 fields
    f1 = Field(
        farm_id=farm.id,
        field_name="Block A (Terraced Banana)",
        area_hectares=round(ha * 0.55, 2),
        area_acres=round(acres * 0.55, 2),
        current_crop="Robusta Banana",
        planting_date="2026-06-15",
        expected_harvest_date="2027-04-20",
        irrigation_available=True,
        notes="Red lateritic loam, drip line installed.",
    )
    f1.boundary_geojson = cleaned
    db.add(f1)

    f2 = Field(
        farm_id=farm.id,
        field_name="Block B (Intercropped Cowpea)",
        area_hectares=round(ha * 0.45, 2),
        area_acres=round(acres * 0.45, 2),
        current_crop="Cowpea (Lobia / Payar)",
        planting_date="2026-08-01",
        expected_harvest_date="2026-11-20",
        irrigation_available=False,
        notes="Nitrogen-fixing pulse along southern gentle slope.",
    )
    f2.boundary_geojson = cleaned
    db.add(f2)
    db.commit()

    # Pre-generate NASA and rotation models
    from app.services.nasa_power_service import NASAPowerService
    from app.services.rotation_optimizer import RotationOptimizer
    await NASAPowerService.fetch_and_store_weather(db, farm.id, lat, lon, days_back=30)
    RotationOptimizer.generate_strategies_for_farm(db, farm)

    return farm


@router.post("/farms/demo/reset")
async def reset_demo_farm(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Demo Mode: Resets the active user's demo farm back to fresh benchmark state.
    """
    user_farms = db.query(Farm).filter(Farm.user_id == current_user.id).all()
    for f in user_farms:
        delete_farm(f.id, db, current_user)

    fresh_farm = await load_demo_farm(db, current_user)
    return {"message": "Demo farm reset to benchmark state successfully.", "farm": fresh_farm}

