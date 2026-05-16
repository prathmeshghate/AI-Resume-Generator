from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.resume import router as resume_router


def create_app() -> FastAPI:
    app = FastAPI(title="AI Resume Builder API")

    api_router = APIRouter(prefix="/api")
    api_router.include_router(resume_router, prefix="/resume", tags=["resume"])

    app.include_router(api_router)

    return app


app = create_app()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
