from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from . import models
from .database import Base, engine
from .routers import auth, ayvu, reko

# Raiz de TODO o frontend (login.html, aluno/, professor/, css/ e js/
# compartilhados) — antes só "frontend/aluno" era servido; agora que existe
# tela de login e área do professor, a raiz inteira precisa estar acessível.
FRONTEND_DIR = Path(__file__).resolve().parent.parent.parent / "frontend"


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

app.include_router(auth.router)
app.include_router(reko.router)
app.include_router(ayvu.router)

# Serve o frontend estático (login.html, aluno/, professor/, css/, js/...).
# Registrado por último: as rotas de API acima têm prioridade sobre esse catch-all.
if FRONTEND_DIR.is_dir():
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
