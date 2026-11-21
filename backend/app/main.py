from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app import database
from app.config import get_settings
from app.routers import admin, auth, health, neighborhoods, reports
from app.seed import seed

UPLOAD_DIR = Path(__file__).resolve().parent / "uploads"


@asynccontextmanager
async def lifespan(_app: FastAPI):
    settings = get_settings()
    database.init_engine(settings)
    database.create_tables()
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    if settings.seed_demo_data:
        if database.SessionLocal is None:
            raise RuntimeError("Database session factory is not initialized")
        db = database.SessionLocal()
        try:
            seed(db)
        finally:
            db.close()
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="FixMyStreet Pro API", version="0.1.0", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(health.router, prefix="/api")
    app.include_router(auth.router, prefix="/api")
    app.include_router(neighborhoods.router, prefix="/api")
    app.include_router(admin.router, prefix="/api")
    app.include_router(reports.router, prefix="/api")
    app.mount("/api/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")
    return app


app = create_app()
