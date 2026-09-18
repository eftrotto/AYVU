import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException

from . import models
from .database import Base, engine
from .routers import auth, ayvu, desafios, loja, macu, notas, oca, okas, reko

logger = logging.getLogger("ayvu")

# Build de produção do frontend (Vite). Em dev o frontend roda em servidor
# próprio (porta 5173) e essa pasta não existe — backend funciona só como API.
FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"


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


# Sem isso, uma exceção não tratada vira 500 em texto puro (não JSON) e sem
# log — diferente de HTTPException/422, que o FastAPI já padroniza.
@app.exception_handler(Exception)
async def erro_nao_tratado(request: Request, exc: Exception):
    logger.exception("Erro não tratado em %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Erro interno. Tente novamente."})


app.include_router(auth.router)
app.include_router(macu.router)
app.include_router(reko.router)
app.include_router(ayvu.router)
app.include_router(okas.router)
app.include_router(oca.router)
app.include_router(notas.router)
app.include_router(desafios.router_desafios)
app.include_router(desafios.router_desenhos)
app.include_router(loja.router)

class SPAStaticFiles(StaticFiles):
    """Sem fallback pro index.html, um F5 em /aluno/ayvu/3 (rota do React
    Router, não um arquivo) daria 404 em vez de deixar o React tratar a rota."""

    async def get_response(self, path: str, scope):
        try:
            return await super().get_response(path, scope)
        except StarletteHTTPException as excecao:
            if excecao.status_code == 404:
                return await super().get_response("index.html", scope)
            raise


# Registrado por último: as rotas de API acima têm prioridade sobre esse catch-all.
if FRONTEND_DIST.is_dir():
    app.mount("/", SPAStaticFiles(directory=FRONTEND_DIST, html=True), name="frontend")
