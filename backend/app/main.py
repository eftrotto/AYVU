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
from .routers import auth, ayvu, macu, notas, okas, reko

logger = logging.getLogger("ayvu")

# Build de produção do frontend (Vite). Em desenvolvimento o frontend roda
# no seu próprio servidor (npm run dev, porta 5173) e essa pasta não
# existe — o backend funciona só como API nesse caso, sem problema.
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


# ---------------------------------------------------------------------------
# Tratamento de erro consistente: HTTPException e erro de validação (422) já
# vêm padronizados como {"detail": ...} de fábrica no FastAPI. O que faltava
# era isso valer também pra exceções NÃO tratadas — por padrão, o
# Starlette devolve um 500 em texto puro (não JSON) e nada fica registrado.
# ---------------------------------------------------------------------------


@app.exception_handler(Exception)
async def erro_nao_tratado(request: Request, exc: Exception):
    logger.exception("Erro não tratado em %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Erro interno. Tente novamente."})


app.include_router(auth.router)
app.include_router(macu.router)
app.include_router(reko.router)
app.include_router(ayvu.router)
app.include_router(okas.router)
app.include_router(notas.router)

class SPAStaticFiles(StaticFiles):
    """
    StaticFiles comum só serve arquivo que existe fisicamente — mas o React
    Router cria rotas como /aluno ou /aluno/ayvu/3 que não são arquivos.
    Isso faz um F5 (ou um link direto) numa dessas rotas cair de volta pro
    index.html, que é quem inicializa o React Router pra tratar a rota.
    """

    async def get_response(self, path: str, scope):
        try:
            return await super().get_response(path, scope)
        except StarletteHTTPException as excecao:
            if excecao.status_code == 404:
                return await super().get_response("index.html", scope)
            raise


# Serve o build de produção do frontend, se ele existir (npm run build gera
# frontend/dist). Registrado por último: as rotas de API acima têm
# prioridade sobre esse catch-all.
if FRONTEND_DIST.is_dir():
    app.mount("/", SPAStaticFiles(directory=FRONTEND_DIST, html=True), name="frontend")
