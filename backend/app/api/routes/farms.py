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
