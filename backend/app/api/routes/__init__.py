from fastapi import APIRouter
from app.api.routes import health, auth, farms, environment, soil, terrain, crops, rotation, digital_twin, assistant, tasks, reports

api_router = APIRouter(prefix="/api")
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router)
api_router.include_router(farms.router)
api_router.include_router(environment.router)
api_router.include_router(soil.router)
api_router.include_router(terrain.router)
api_router.include_router(crops.router)
api_router.include_router(rotation.router)
api_router.include_router(digital_twin.router)
api_router.include_router(assistant.router)
api_router.include_router(tasks.router)
api_router.include_router(reports.router)
