import enum
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class TipoUsuario(str, enum.Enum):
    ALUNO = "aluno"
    PROFESSOR = "professor"


class Usuario(Base):
    """Conta de login — aluno ou professor. Ver security.py para o hash de senha."""

    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nome: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    senha_hash: Mapped[str] = mapped_column(String(255))
    tipo: Mapped[TipoUsuario] = mapped_column(Enum(TipoUsuario), index=True)

    # Nulo até o aluno entrar numa turma com o código de convite (ver Turma
    # abaixo) ou pra professores sem turma fixa (ex.: coordenação).
    turma_id: Mapped[int | None] = mapped_column(ForeignKey("turmas.id"), index=True, nullable=True)

    criado_em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class Turma(Base):
    """
    A "ilha" de um professor — os alunos entram usando o código de convite
    (ver routers/turmas.py). Um professor pode ter várias turmas.
    """

    __tablename__ = "turmas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nome: Mapped[str] = mapped_column(String(120))
    professor_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), index=True)
    codigo: Mapped[str] = mapped_column(String(10), unique=True, index=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class RekoCheckin(Base):
    """Um check-in diário do Reko (CASEL 5), 1 nota (1-5) por competência."""

    __tablename__ = "reko_checkins"
    __table_args__ = (
        # no máximo um check-in por aluno por dia.
        UniqueConstraint("user_id", "data", name="uq_reko_checkin_user_data"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    # FK de verdade agora que existe login (routers/reko.py deriva isso do
    # token via deps.get_usuario_atual — nunca aceita user_id vindo do
    # cliente). A turma do check-in é lida via usuarios.turma_id no momento
    # da agregação, então não é duplicada aqui.
    user_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), index=True)

    data: Mapped[date] = mapped_column(Date, index=True)

    autoconhecimento: Mapped[int] = mapped_column(Integer)
    autogestao: Mapped[int] = mapped_column(Integer)
    consciencia_social: Mapped[int] = mapped_column(Integer)
    relacionamento: Mapped[int] = mapped_column(Integer)
    decisao_responsavel: Mapped[int] = mapped_column(Integer)

    criado_em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


# ---------------------------------------------------------------------------
# Macu — avatar do aluno
# ---------------------------------------------------------------------------


class MacuAvatar(Base):
    """
    Configuração salva do avatar de corpo inteiro do aluno (sprites LPC — ver
    frontend/src/features/macu). Um registro por aluno; salvar de novo
    substitui o anterior (upsert em routers/macu.py).
    """

    __tablename__ = "macu_avatares"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), unique=True, index=True)

    # Guardado como JSON serializado (texto) em vez de uma coluna por campo:
    # o formato do avatar é decidido pelo frontend (estilos/cores do LPC) e
    # pode ganhar novas opções sem precisar de migração de banco.
    avatar_config: Mapped[str] = mapped_column(Text)

    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )


# ---------------------------------------------------------------------------
# Ayvu — núcleo de exploração livre de temas
# ---------------------------------------------------------------------------


class TipoConteudo(str, enum.Enum):
    VIDEO = "video"
    JOGO = "jogo"
    LEITURA = "leitura"
    DESAFIO = "desafio"


class Tema(Base):
    """Um tema de interesse que o aluno pode explorar (dentro ou fora do currículo)."""

    __tablename__ = "temas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nome: Mapped[str] = mapped_column(String(120))
    descricao: Mapped[str] = mapped_column(Text)
    dentro_do_curriculo: Mapped[bool] = mapped_column(Boolean, default=False)

    conteudos: Mapped[list["Conteudo"]] = relationship(
        back_populates="tema",
        order_by="Conteudo.ordem_sugerida",
        cascade="all, delete-orphan",
    )


class Conteudo(Base):
    """Um conteúdo (vídeo/jogo/leitura/desafio) dentro de um tema."""

    __tablename__ = "conteudos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tema_id: Mapped[int] = mapped_column(ForeignKey("temas.id"), index=True)
    tipo: Mapped[TipoConteudo] = mapped_column(Enum(TipoConteudo), index=True)
    titulo: Mapped[str] = mapped_column(String(200))

    # Texto (leitura/desafio) ou URL (video) — o significado depende de `tipo`.
    # Pro tipo "jogo", guarda o mini-quiz serializado como JSON (ver seed.py
    # e routers/ayvu.py para o formato esperado).
    corpo_ou_url: Mapped[str] = mapped_column(Text)

    # Só uma dica visual de ordem (numeração sugerida); o aluno pode abrir
    # qualquer conteúdo do tema na ordem que quiser, isso nunca bloqueia.
    ordem_sugerida: Mapped[int] = mapped_column(Integer, default=0)

    tema: Mapped["Tema"] = relationship(back_populates="conteudos")


class PesquisaAyvu(Base):
    """
    Um termo pesquisado pelo aluno na Lagoa do Ayvu (cada mergulho gera um
    registro). Alimenta a visão do professor por aluno em routers/turmas.py
    — aqui, ao contrário do Reko, o pedido foi visibilidade individual
    mesmo, não agregada.
    """

    __tablename__ = "pesquisas_ayvu"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), index=True)
    termo: Mapped[str] = mapped_column(String(200))
    criado_em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class ProgressoAluno(Base):
    """Marca se um aluno concluiu um conteúdo (N:N entre aluno e conteúdo)."""

    __tablename__ = "progresso_aluno"
    __table_args__ = (
        UniqueConstraint("user_id", "conteudo_id", name="uq_progresso_user_conteudo"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    # FK de verdade agora que existe login (ver nota em RekoCheckin.user_id).
    user_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), index=True)

    conteudo_id: Mapped[int] = mapped_column(ForeignKey("conteudos.id"), index=True)
    concluido: Mapped[bool] = mapped_column(Boolean, default=True)
    data_ultima_interacao: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    conteudo: Mapped["Conteudo"] = relationship()

    # GANCHO FUTURO — interesses predominantes para a equipe pedagógica
    #
    # Cruzando `progresso_aluno` com `conteudos`/`temas`/`usuarios.turma_id`,
    # dá pra calcular quais temas mais prendem a atenção de uma turma (ex.:
    # % de conteúdos concluídos por tema, agregado pela turma). Igual ao
    # Reko, isso deve SEMPRE ser agregado por turma, nunca devolver o
    # detalhe de um aluno específico para o professor.
    #
    # Esboço de como isso entraria (NÃO implementado ainda):
    #
    #   GET /ayvu/interesses/{turma_id}  (só professor, mesmo padrão do Reko)
    #   -> agrupar progresso_aluno dos alunos da turma (join por
    #      usuarios.turma_id) por tema_id, contar quantos concluíram pelo
    #      menos 1 conteúdo daquele tema, devolver só a lista de temas
    #      ordenada por popularidade (sem nomes de aluno nem contagem
    #      individual).
