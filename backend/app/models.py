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

    # Nulo pra professores sem turma fixa (ex.: coordenação). Alunos
    # normalmente têm turma, mas isso não é reforçado aqui a nível de banco
    # pra manter o cadastro simples nesta etapa.
    turma_id: Mapped[int | None] = mapped_column(Integer, index=True, nullable=True)

    criado_em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class RekoCheckin(Base):
    """Um check-in diário do Reko (CASEL 5), 1 nota (1-5) por competência."""

    __tablename__ = "reko_checkins"
    __table_args__ = (
        # no máximo um check-in por aluno por dia (reforça no banco a mesma
        # regra que o frontend já aplica via localStorage).
        UniqueConstraint("user_id", "data", name="uq_reko_checkin_user_data"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    # Ainda não existe um sistema de contas/login no AYVU (ver placeholders
    # de user_id no frontend), então por enquanto isso não é uma FK de
    # verdade para uma tabela "users" — é só o identificador do aluno.
    # Fica nulo até existir login de verdade (mesmo padrão do frontend).
    user_id: Mapped[int | None] = mapped_column(Integer, index=True, nullable=True)

    # Necessário para o GET /reko/aggregate/{turma_id} poder filtrar por
    # turma. Não estava na lista de campos pedida original, mas sem isso o
    # endpoint de agregação não tem como saber a turma de cada check-in.
    turma_id: Mapped[int | None] = mapped_column(Integer, index=True, nullable=True)

    data: Mapped[date] = mapped_column(Date, index=True)

    autoconhecimento: Mapped[int] = mapped_column(Integer)
    autogestao: Mapped[int] = mapped_column(Integer)
    consciencia_social: Mapped[int] = mapped_column(Integer)
    relacionamento: Mapped[int] = mapped_column(Integer)
    decisao_responsavel: Mapped[int] = mapped_column(Integer)

    criado_em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


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


class ProgressoAluno(Base):
    """Marca se um aluno concluiu um conteúdo (N:N entre aluno e conteúdo)."""

    __tablename__ = "progresso_aluno"
    __table_args__ = (
        UniqueConstraint("user_id", "conteudo_id", name="uq_progresso_user_conteudo"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    # Diferente do user_id do Reko/Macu (que fica nulo até existir login de
    # verdade), aqui precisamos conseguir buscar o progresso DE VOLTA por
    # aluno (GET /ayvu/progresso/{user_id}) para montar os indicadores de
    # progresso na tela inicial — um valor sempre nulo faria isso não fazer
    # sentido (misturaria o progresso de alunos diferentes). Por enquanto,
    # até existir login, o frontend gera e guarda um id local por
    # navegador/dispositivo (ver obterUsuarioIdLocal() em js/ayvu.js) só
    # para manter o progresso separado por aluno nesta demo.
    user_id: Mapped[int] = mapped_column(Integer, index=True)

    conteudo_id: Mapped[int] = mapped_column(ForeignKey("conteudos.id"), index=True)
    concluido: Mapped[bool] = mapped_column(Boolean, default=True)
    data_ultima_interacao: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    conteudo: Mapped["Conteudo"] = relationship()

    # GANCHO FUTURO — interesses predominantes para a equipe pedagógica
    #
    # Cruzando `progresso_aluno` com `conteudos`/`temas`, dá pra calcular
    # quais temas mais prendem a atenção de uma turma (ex.: % de conteúdos
    # concluídos por tema, agregado pela turma). Igual ao Reko, isso deve
    # SEMPRE ser agregado por turma, nunca devolver o detalhe de um aluno
    # específico para o professor.
    #
    # Esboço de como isso entraria (NÃO implementado ainda — precisa antes
    # de um jeito de saber a turma de cada aluno, que ainda não existe):
    #
    #   GET /ayvu/interesses/{turma_id}
    #   -> agrupar progresso_aluno dos alunos da turma por tema_id,
    #      contar quantos concluíram pelo menos 1 conteúdo daquele tema,
    #      devolver só a lista de temas ordenada por popularidade (sem
    #      nomes de aluno nem contagem individual).
