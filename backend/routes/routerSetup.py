from fastapi import APIRouter

from backend.routes.resume import router as resume_router

api_router = APIRouter(prefix="/api")
api_router.include_router(resume_router, prefix="/resume", tags=["resume"])

