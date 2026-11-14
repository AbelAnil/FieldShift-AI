from fastapi import APIRouter
from app.api.routes import health, auth, farms, environment, soil, terrain, crops

api_router = APIRouter(prefix="/api")
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router)
api_router.include_router(farms.router)
api_router.include_router(environment.router)
api_router.include_router(soil.router)
api_router.include_router(terrain.router)
api_router.include_router(crops.router)
