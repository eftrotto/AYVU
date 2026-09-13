from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from . import models

# ---------------------------------------------------------------------------
# Erros — formato padronizado de resposta de erro (ver main.py)
# ---------------------------------------------------------------------------


class ErroResponse(BaseModel):
    detail: str


# ---------------------------------------------------------------------------
# Autenticação
# ---------------------------------------------------------------------------


class UsuarioCreate(BaseModel):
    nome: str
    email: EmailStr
    senha: str = Field(min_length=6)
    tipo: models.TipoUsuario
    oka_id: int | None = None


class UsuarioLogin(BaseModel):
    email: EmailStr
    senha: str


class UsuarioResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    tipo: models.TipoUsuario
    oka_id: int | None


class LoginResponse(BaseModel):
    token: str
    usuario: UsuarioResponse


# ---------------------------------------------------------------------------
# Reko
# ---------------------------------------------------------------------------

# Nota de cada competência do CASEL 5, sempre na escala Likert 1-5.
NotaCompetencia = Field(ge=1, le=5)


class RekoCheckinCreate(BaseModel):
    # user_id NÃO vem mais do corpo da requisição — o router deriva do
    # token de quem está logado (ver deps.get_usuario_atual), pra ninguém
    # conseguir enviar check-in em nome de outro aluno.
    data: date
    autoconhecimento: int = NotaCompetencia
    autogestao: int = NotaCompetencia
    consciencia_social: int = NotaCompetencia
    relacionamento: int = NotaCompetencia
    decisao_responsavel: int = NotaCompetencia


class RekoCheckinOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
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
    oka_id: int
    total_checkins: int
    dados_suficientes: bool
    minimo_necessario: int
    medias: RekoMedias | None


# ---------------------------------------------------------------------------
# Macu
# ---------------------------------------------------------------------------


class MacuAvatarUpsert(BaseModel):
    # Formato livre (decidido pelo frontend — estilos/cores do LPC) em vez
    # de um campo por opção: evita ter que alterar o backend toda vez que
    # o Macu ganha uma opção nova de customização.
    avatar_config: dict[str, Any]


class MacuAvatarOut(BaseModel):
    user_id: int
    avatar_config: dict[str, Any]
    atualizado_em: datetime


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
    # user_id também não vem mais do corpo — deriva do token (mesmo motivo
    # do Reko: antes dava pra registrar progresso em nome de outro aluno).
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


class VideoSugerido(BaseModel):
    id: str
    titulo: str
    canal: str
    miniatura: str


class PesquisaCreate(BaseModel):
    # user_id vem do token, mesmo padrão do Reko/Progresso — nunca do corpo.
    termo: str = Field(min_length=1, max_length=200)


# ---------------------------------------------------------------------------
# Okas — a "ilha"/turma do professor
# ---------------------------------------------------------------------------


class OkaCreate(BaseModel):
    nome: str = Field(min_length=1, max_length=120)


class OkaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    codigo: str
    criado_em: datetime


class EntrarOkaPayload(BaseModel):
    codigo: str = Field(min_length=1, max_length=10)


class EntrarOkaOut(BaseModel):
    oka_id: int
    nome_oka: str


class AlunoDaOkaOut(BaseModel):
    id: int
    nome: str
    # 'atencao' | 'neutro' | 'bem' | 'sem_dados' — nunca a nota exata do
    # Reko, só um sinal. Ver routers/okas.py pra regra de cálculo.
    sinal_bem_estar: str
    frase_bem_estar: str
    temas_pesquisados: list[str]


class ColegaDaOkaOut(BaseModel):
    # Visão do aluno dos colegas da própria Oka. De propósito NÃO tem
    # temas_pesquisados nem sinal_bem_estar aqui: entre alunos, só nome +
    # Macu, nada do que só o professor pode ver.
    id: int
    nome: str
    avatar_config: dict[str, Any]


class MensagemChatCreate(BaseModel):
    texto: str = Field(min_length=1, max_length=1000)


class MensagemChatOut(BaseModel):
    id: int
    oka_id: int
    autor_id: int
    autor_nome: str
    texto: str
    criado_em: datetime


# ---------------------------------------------------------------------------
# Notas — o boletim
# ---------------------------------------------------------------------------


class NotaCreate(BaseModel):
    disciplina: str = Field(min_length=1, max_length=100)
    prova: str = Field(min_length=1, max_length=150)
    nota: float = Field(ge=0, le=10)
    data: date


class NotaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    aluno_id: int
    disciplina: str
    prova: str
    nota: float
    data: date
