from datetime import datetime, timezone
from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.farm import Farm
from app.models.data_source import DataSource
from app.services.nasa_power_service import NASAPowerService
from app.services.vegetation_service import VegetationService
from app.services.smap_service import SMAPService
from app.api.deps import get_current_user

router = APIRouter(tags=["Earth Intelligence & Environmental Analysis"])


@router.get("/data-sources")
def get_data_sources_registry(db: Session = Depends(get_db)):
    """
    Returns the scientific registry of Earth observation datasets, spatial/temporal resolutions,
    providers, and data limitations.
    """
    sources = db.query(DataSource).all()
    if not sources:
        # Return default registry if not yet seeded
        return [
            {
                "dataset_name": "NASA GPM IMERG v07",
                "provider": "NASA Precipitation Processing System (PPS)",
                "parameter": "Precipitation Rate, Daily & 7-day Cumulative Rainfall",
                "spatial_resolution": "0.1° (~10 km)",
                "temporal_resolution": "Daily / 30-minute late run",
                "source_url": "https://gpm.nasa.gov/data/imerg",
                "license": "NASA Open Data Policy (No cost)",
                "is_nasa_dataset": "true",
                "scientific_limitations": "Multi-satellite gridded estimate. Captures mesoscale convective rainfall patterns, but cannot replace physical local rain gauges.",
            },
            {
                "dataset_name": "NASA POWER Agroclimatology",
                "provider": "NASA Langley Research Center",
                "parameter": "T2M (Air Temp), Surface Solar Irradiance, Relative Humidity",
                "spatial_resolution": "0.5° x 0.5° gridded",
                "temporal_resolution": "Daily (~2-day latency)",
                "source_url": "https://power.larc.nasa.gov",
                "license": "Open Access",
                "is_nasa_dataset": "true",
                "scientific_limitations": "Assimilation of GEOS models and satellite radiometers; representative of regional microclimate.",
            },
            {
                "dataset_name": "NASA SMAP L4 Global Enhanced",
                "provider": "NASA Jet Propulsion Laboratory (JPL)",
                "parameter": "Surface and Root-Zone Soil Moisture (m³/m³)",
                "spatial_resolution": "~9 km gridded",
                "temporal_resolution": "Daily",
                "source_url": "https://smap.jpl.nasa.gov",
                "license": "Open Access",
                "is_nasa_dataset": "true",
                "scientific_limitations": "Coarse 9 km passive microwave footprint. Shows landscape-scale drying and wetting cycles; not an in-situ farm sensor.",
            },
            {
                "dataset_name": "Landsat 8/9 OLI-2 & Sentinel-2 MSI",
                "provider": "NASA / USGS & ESA Copernicus (Supplementary)",
                "parameter": "NDVI (Canopy Greenness), NDMI (Canopy Moisture Stress)",
                "spatial_resolution": "10 m (Sentinel-2) / 30 m (Landsat 8/9)",
                "temporal_resolution": "5 to 16 days",
                "source_url": "https://landsat.gsfc.nasa.gov",
                "license": "Open Access",
                "is_nasa_dataset": "mixed",
                "scientific_limitations": "Cloud-filtered optical surface reflectance. Indicates foliar vigor, not a definitive diagnosis of plant disease.",
            },
        ]
    return sources


@router.get("/farms/{farm_id}/rainfall")
async def get_farm_rainfall(
    farm_id: str,
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve NASA GPM / NASA POWER daily precipitation series, 7-day rolling totals,
    cumulative precipitation, and heavy rainfall anomaly threshold alerts.
    """
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found.")
    if farm.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden.")

    weather, data_status = await NASAPowerService.fetch_and_store_weather(
        db, farm.id, farm.latitude, farm.longitude, days_back=days, with_status=True
    )

    # Compute rolling 7-day totals & heavy rain alerts
    enriched = []
    total_precip_30d = 0.0
    heavy_rain_events = []

    for idx, item in enumerate(weather):
        r = item.get("rainfall_mm", 0.0)
        total_precip_30d += r

        # 7-day window
        window_start = max(0, idx - 6)
        rolling_7d = sum(w.get("rainfall_mm", 0.0) for w in weather[window_start : idx + 1])

        is_heavy = r >= 40.0
        if is_heavy:
            heavy_rain_events.append({
                "date": item["date"],
                "rainfall_mm": r,
                "status": "Heavy Precipitation Event (>40mm/day)",
            })

        enriched.append({
            "date": item["date"],
            "daily_rainfall_mm": r,
            "rolling_7d_rainfall_mm": round(rolling_7d, 2),
            "is_heavy_rain": is_heavy,
        })

    # Multi-year NASA baseline and rainfall anomaly calculation
    climatology = NASAPowerService.get_climatological_normal(farm.latitude, farm.longitude)
    normal_30d = climatology["normal_rainfall_mm"]
    anomaly_pct = round(((total_precip_30d - normal_30d) / max(normal_30d, 1.0)) * 100.0, 1)

    if anomaly_pct > 25.0:
        anomaly_category = "Surplus (Wet Anomaly)"
        anomaly_desc = f"+{anomaly_pct:.1f}% above 30-year normal; inspect contour drainage and root disease."
    elif anomaly_pct < -25.0:
        anomaly_category = "Deficit (Dry Anomaly)"
        anomaly_desc = f"{anomaly_pct:.1f}% below 30-year normal; trigger water conservation / drip irrigation."
    else:
        anomaly_category = "Near Climatological Normal"
        anomaly_desc = f"{anomaly_pct:+.1f}% vs 30-year baseline; rainfall matches historical seasonal average."

    return {
        "farm_id": farm.id,
        "farm_name": farm.farm_name,
        "dataset": "NASA GPM IMERG / NASA POWER",
        "spatial_resolution": "0.1° (~10 km) to 0.5°",
        "data_status": data_status,
        "data_status_label": "Live (NASA GPM / POWER API)" if data_status == "live" else ("Cached Satellite Telemetry" if data_status == "cached" else "Calibrated Regional Baseline"),
        "last_updated": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
        "source_url": "https://gpm.nasa.gov/data/imerg",
        "observation_count": len(enriched),
        "cumulative_rainfall_mm": round(total_precip_30d, 2),
        "climatology_baseline": {
            "source": climatology["source"],
            "climate_regime": climatology["climate_regime"],
            "normal_rainfall_30d_mm": normal_30d,
            "current_rainfall_30d_mm": round(total_precip_30d, 1),
            "rainfall_anomaly_pct": anomaly_pct,
            "anomaly_category": anomaly_category,
            "anomaly_label": f"{abs(anomaly_pct):.0f}% {'above' if anomaly_pct >= 0 else 'below'} normal",
            "adaptation_guidance": anomaly_desc,
        },
        "heavy_rain_events_count": len(heavy_rain_events),
        "heavy_rain_events": heavy_rain_events,
        "timeseries": enriched,
    }


@router.get("/farms/{farm_id}/vegetation")
def get_farm_vegetation(
    farm_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve multispectral vegetation indices (NDVI and NDMI) from Landsat 8/9 and Sentinel-2.
    """
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found.")
    if farm.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden.")

    series = VegetationService.get_or_generate_vegetation_indices(
        db, farm.id, farm.latitude, farm.longitude
    )

    latest = series[-1] if series else {"ndvi": 0.72, "ndmi": 0.28}
    assessment = VegetationService.evaluate_canopy_status(
        latest.get("ndvi", 0.72), latest.get("ndmi", 0.28)
    )

    return {
        "farm_id": farm.id,
        "farm_name": farm.farm_name,
        "sources": "Landsat 8/9 OLI (30m) & Sentinel-2 MSI (10m)",
        "latest_ndvi": latest.get("ndvi"),
        "latest_ndmi": latest.get("ndmi"),
        "latest_acquisition_date": latest.get("date"),
        "canopy_status": assessment,
        "observations": series,
    }


@router.get("/farms/{farm_id}/soil-moisture")
def get_farm_soil_moisture(
    farm_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve NASA SMAP ~9 km enhanced regional soil moisture context.
    """
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found.")
    if farm.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden.")

    smap_data = SMAPService.get_regional_soil_moisture(farm.latitude, farm.longitude)
    return {
        "farm_id": farm.id,
        "farm_name": farm.farm_name,
        **smap_data,
    }


@router.get("/farms/{farm_id}/environment")
async def get_farm_environment_summary(
    farm_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Complete integrated environmental profile:
    NASA POWER Agroclimatology + GPM Rainfall + Landsat/Sentinel Vegetation + SMAP Soil Moisture.
    """
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found.")
    if farm.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden.")

    weather, data_status = await NASAPowerService.fetch_and_store_weather(
        db, farm.id, farm.latitude, farm.longitude, days_back=30, with_status=True
    )
    vegetation = VegetationService.get_or_generate_vegetation_indices(
        db, farm.id, farm.latitude, farm.longitude
    )
    smap = SMAPService.get_regional_soil_moisture(farm.latitude, farm.longitude)

    latest_weather = weather[-1] if weather else {}
    latest_veg = vegetation[-1] if vegetation else {}

    # Calculate average metrics over 30 days
    valid_temps = [w["temp_mean"] for w in weather if w.get("temp_mean", -999) > -50]
    avg_temp = round(sum(valid_temps) / max(len(valid_temps), 1), 1) if valid_temps else 27.5
    total_rain = round(sum(w["rainfall_mm"] for w in weather), 1)
    avg_solar = round(sum(w["solar_radiation"] for w in weather) / max(len(weather), 1), 1)
    avg_rh = round(sum(w["relative_humidity"] for w in weather) / max(len(weather), 1), 1)

    climatology = NASAPowerService.get_climatological_normal(farm.latitude, farm.longitude)
    normal_30d = climatology["normal_rainfall_mm"]
    anomaly_pct = round(((total_rain - normal_30d) / max(normal_30d, 1.0)) * 100.0, 1)

    return {
        "farm_id": farm.id,
        "farm_name": farm.farm_name,
        "location": farm.location_name,
        "coordinates": {"latitude": farm.latitude, "longitude": farm.longitude},
        "period": f"Last {len(weather)} days",
        "data_status": data_status,
        "data_status_label": "Live NASA API" if data_status == "live" else ("Cached Satellite Telemetry" if data_status == "cached" else "Calibrated Regional Baseline"),
        "last_updated": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
        "summary": {
            "avg_temperature_c": avg_temp,
            "cumulative_rainfall_mm": total_rain,
            "normal_rainfall_30d_mm": normal_30d,
            "rainfall_anomaly_pct": anomaly_pct,
            "rainfall_anomaly_label": f"{abs(anomaly_pct):.0f}% {'above' if anomaly_pct >= 0 else 'below'} normal",
            "avg_solar_radiation_mj_m2": avg_solar,
            "avg_relative_humidity_pct": avg_rh,
            "latest_ndvi": latest_veg.get("ndvi"),
            "latest_ndmi": latest_veg.get("ndmi"),
            "smap_surface_moisture_m3m3": smap["surface_soil_moisture_m3m3"],
            "canopy_vigor": VegetationService.evaluate_canopy_status(
                latest_veg.get("ndvi", 0.7), latest_veg.get("ndmi", 0.3)
            )["vigor_status"],
        },
        "climatology_baseline": {
            "source": climatology["source"],
            "climate_regime": climatology["climate_regime"],
            "normal_rainfall_30d_mm": normal_30d,
            "current_rainfall_30d_mm": total_rain,
            "rainfall_anomaly_pct": anomaly_pct,
            "anomaly_label": f"{abs(anomaly_pct):.0f}% {'above' if anomaly_pct >= 0 else 'below'} normal",
        },
        "weather_timeseries": weather,
        "vegetation_timeseries": vegetation,
        "smap_regional": smap,
    }


@router.post("/farms/{farm_id}/analyze")
async def analyze_farm_environment(
    farm_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Trigger a fresh Earth observation analysis pipeline for the farm boundary.
    """
    return await get_farm_environment_summary(farm_id, db, current_user)
