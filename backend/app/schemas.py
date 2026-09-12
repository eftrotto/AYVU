from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

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
