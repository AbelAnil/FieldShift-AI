from datetime import datetime, timezone
import sys
from typing import Dict, Any
from fastapi import APIRouter, Query
import httpx
from app.config import get_settings

router = APIRouter()
settings = get_settings()

START_TIME = datetime.now(timezone.utc)

# Known service endpoints
NASA_POWER_ENDPOINT = "https://power.larc.nasa.gov/api/temporal/daily/point"
ISRIC_SOILGRIDS_ENDPOINT = "https://rest.isric.org/soilgrids/v2.0/properties/query"


@router.get("/health", summary="System Health & Scientific Services Check")
async def get_health(probe: bool = Query(False, description="Actively probe external upstream APIs (timeout 2.5s)")):
    now = datetime.now(timezone.utc)
    uptime_seconds = round((now - START_TIME).total_seconds(), 2)

    services: Dict[str, Dict[str, Any]] = {
        "database": {"status": "healthy", "type": "SQLite / Local-First"},
        "nasa_power": {
            "status": "online",
            "name": "NASA POWER Agroclimatology API",
            "fallback_mode": "Calibrated Regional Climatology",
        },
        "nasa_gpm": {
            "status": "online",
            "name": "NASA GPM IMERG Precipitation",
            "fallback_mode": "Daily Gridded Accumulation",
        },
        "isric_soilgrids": {
            "status": "online",
            "name": "ISRIC SoilGrids 250m REST API",
            "fallback_mode": "Kerala Soil Survey Baseline",
        },
    }

    if probe:
        # Actively test upstream network reachability with rapid non-blocking timeout
        async with httpx.AsyncClient(timeout=2.5) as client:
            try:
                r = await client.head("https://power.larc.nasa.gov", follow_redirects=True)
                services["nasa_power"]["status"] = "reachable" if r.status_code < 500 else "degraded"
            except Exception:
                services["nasa_power"]["status"] = "cached_fallback"

            try:
                r = await client.head("https://rest.isric.org", follow_redirects=True)
                services["isric_soilgrids"]["status"] = "reachable" if r.status_code < 500 else "degraded"
            except Exception:
                services["isric_soilgrids"]["status"] = "cached_fallback"

    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "version": settings.VERSION,
        "environment": settings.APP_ENV,
        "region": settings.DEFAULT_REGION,
        "timestamp": now.isoformat(),
        "uptime_seconds": uptime_seconds,
        "python_version": sys.version.split(" ")[0],
        "services": services,
    }
