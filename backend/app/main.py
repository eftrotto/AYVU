from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from . import models
from .database import Base, engine
from .routers import ayvu, reko

FRONTEND_DIR = Path(__file__).resolve().parent.parent.parent / "frontend" / "aluno"


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="AYVU", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(reko.router)
app.include_router(ayvu.router)

# Serve o frontend estático (macu.html, reko.html, css/, js/...). Registrado
# por último: as rotas de API acima têm prioridade sobre esse catch-all.
if FRONTEND_DIR.is_dir():
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
