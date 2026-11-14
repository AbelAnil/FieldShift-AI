from fastapi import APIRouter
from app.api.routes import health, auth, farms

api_router = APIRouter(prefix="/api")
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router)
api_router.include_router(farms.router)
