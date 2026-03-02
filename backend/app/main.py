from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.database import engine, Base
from app.models import user, project  # noqa: ensure models are registered
from app.routers import auth, projects, tables, data, storage

settings = get_settings()

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MyBase API",
    description="Your own Supabase-like backend platform",
    version="1.0.0",
)

_origins = ["http://localhost:4200", "http://localhost:4201", "http://127.0.0.1:4200"]
if settings.FRONTEND_URL:
    _origins.append(settings.FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(projects.router, prefix="/projects", tags=["Projects"])
app.include_router(tables.router, prefix="/projects", tags=["Tables"])
app.include_router(data.router, prefix="/data", tags=["Data API"])
app.include_router(storage.router, prefix="/projects", tags=["Storage"])


@app.get("/", tags=["Health"])
def root():
    return {"message": "MyBase API is running", "docs": "/docs", "version": "1.0.0"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
