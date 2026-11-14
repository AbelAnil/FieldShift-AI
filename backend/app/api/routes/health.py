from datetime import datetime, timezone
import sys
from fastapi import APIRouter
from app.config import get_settings

router = APIRouter()
settings = get_settings()

START_TIME = datetime.now(timezone.utc)


@router.get("/health", summary="System Health Check")
def get_health():
    now = datetime.now(timezone.utc)
    uptime_seconds = round((now - START_TIME).total_seconds(), 2)

    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "version": settings.VERSION,
        "environment": settings.APP_ENV,
        "region": settings.DEFAULT_REGION,
        "timestamp": now.isoformat(),
        "uptime_seconds": uptime_seconds,
        "python_version": sys.version.split(" ")[0],
    }

