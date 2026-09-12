from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from . import models

# Nota de cada competência do CASEL 5, sempre na escala Likert 1-5.
NotaCompetencia = Field(ge=1, le=5)


class RekoCheckinCreate(BaseModel):
    # Nulo até existir login/matrícula de verdade no AYVU (mesmo padrão de
    # placeholder usado no frontend do Macu). Com user_id nulo, a trava de
    # "um check-in por dia" no banco (ver models.RekoCheckin) não se aplica
    # entre check-ins anônimos, já que NULL nunca é igual a NULL em SQL —
    # a proteção real por enquanto é a checagem de data feita no frontend.
    user_id: int | None = None
    turma_id: int | None = None
    data: date
    autoconhecimento: int = NotaCompetencia
    autogestao: int = NotaCompetencia
    consciencia_social: int = NotaCompetencia
    relacionamento: int = NotaCompetencia
    decisao_responsavel: int = NotaCompetencia


class RekoCheckinOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int | None
    turma_id: int | None
    data: date
    autoconhecimento: int
    autogestao: int
    consciencia_social: int
    relacionamento: int
    decisao_responsavel: int
    criado_em: datetime


class RekoMedias(BaseModel):
    autoconhecimento: float
    autogestao: float
    consciencia_social: float
    relacionamento: float
    decisao_responsavel: float


class RekoAggregateOut(BaseModel):
    turma_id: int
    total_checkins: int
    dados_suficientes: bool
    minimo_necessario: int
    medias: RekoMedias | None


# ---------------------------------------------------------------------------
# Ayvu
# ---------------------------------------------------------------------------


class TemaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    descricao: str
    dentro_do_curriculo: bool


class ContagemPorTipo(BaseModel):
    video: int = 0
    jogo: int = 0
    leitura: int = 0
    desafio: int = 0


class TemaListaOut(TemaOut):
    total_conteudos: int
    contagem_por_tipo: ContagemPorTipo


class ConteudoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tema_id: int
    tipo: models.TipoConteudo
    titulo: str
    corpo_ou_url: str
    ordem_sugerida: int


class TemaDetalheOut(TemaOut):
    conteudos_por_tipo: dict[str, list[ConteudoOut]]


class ProgressoCreate(BaseModel):
    # Id local do dispositivo/navegador até existir login de verdade — ver
    # comentário em models.ProgressoAluno e obterUsuarioIdLocal() em ayvu.js.
    user_id: int
    conteudo_id: int
    concluido: bool = True


class ProgressoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    conteudo_id: int
    concluido: bool
    data_ultima_interacao: datetime


class ProgressoItem(BaseModel):
    conteudo_id: int
    tema_id: int
    concluido: bool


class ProgressoAlunoOut(BaseModel):
    user_id: int
    itens: list[ProgressoItem]
