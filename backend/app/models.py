import enum
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Enum, Float, ForeignKey, Integer, String, Text, UniqueConstraint, func
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

    # Nulo até o aluno entrar numa Oka com o código de convite.
    oka_id: Mapped[int | None] = mapped_column(ForeignKey("okas.id"), index=True, nullable=True)

    criado_em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class Oka(Base):
    """A "ilha"/turma de um professor — alunos entram via código de convite."""

    __tablename__ = "okas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nome: Mapped[str] = mapped_column(String(120))
    professor_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), index=True)
    codigo: Mapped[str] = mapped_column(String(10), unique=True, index=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class RekoCheckin(Base):
    """Um check-in diário do Reko (CASEL 5), 1 nota (1-5) por competência."""

    __tablename__ = "reko_checkins"
    __table_args__ = (
        UniqueConstraint("user_id", "data", name="uq_reko_checkin_user_data"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    # A Oka do check-in é lida via usuarios.oka_id no momento da agregação,
    # então não é duplicada aqui.
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
    """Um registro por aluno; salvar de novo substitui o anterior (upsert em routers/macu.py)."""

    __tablename__ = "macu_avatares"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), unique=True, index=True)

    # JSON serializado em vez de uma coluna por campo: o formato é decidido
    # pelo frontend e pode ganhar opção nova sem migração de banco.
    avatar_config: Mapped[str] = mapped_column(Text)

    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )


class PresencaIlha(Base):
    """Posição atual do aluno na ilha (fração 0-1 da elipse de grama), pra
    multiplayer via polling — o backend é serverless (Vercel), não mantém
    WebSocket aberto, então cada aluno manda sua posição periodicamente e
    os colegas da mesma Oka fazem polling disso (ver routers/okas.py). Usa
    datetime.utcnow() (não server_default=func.now()) de propósito: a
    verificação de "presença recente" compara direto com utcnow() em
    Python, e misturar hora do servidor de banco com hora da aplicação дá
    dá margem a erro de fuso.
    """

    __tablename__ = "presencas_ilha"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), unique=True, index=True)

    # Guardado explícito (não via usuarios.oka_id) porque o professor TAMBÉM
    # tem presença agora, e usuarios.oka_id só existe pro aluno que entrou
    # numa ilha — o dono da ilha (professor) não tem esse campo preenchido.
    # Nullable só por causa de linhas antigas de antes dessa coluna existir;
    # elas já estão velhas o bastante pra nunca passar no filtro de
    # "presença recente" mesmo assim.
    oka_id: Mapped[int | None] = mapped_column(ForeignKey("okas.id"), index=True, nullable=True)

    fx: Mapped[float] = mapped_column(Float)
    fy: Mapped[float] = mapped_column(Float)
    atualizado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class OkaPessoal(Base):
    """
    A Oka pessoal do aluno — espaço privado pra decorar (referência à oca
    indígena, grafada com K como o resto do projeto — sem relação com a
    Oka/ilha do professor em routers/okas.py além do nome). Prototipo:
    só decoração de ambiente (cor de parede, chão, item central), sem
    sistema de itens desbloqueáveis ainda.
    """

    __tablename__ = "okas_pessoais"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), unique=True, index=True)
    cor_parede: Mapped[str] = mapped_column(String(20), default="c2a35f")
    cor_chao: Mapped[str] = mapped_column(String(20), default="7a5636")
    item_central: Mapped[str] = mapped_column(String(30), default="nenhum")

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

    # Texto (leitura/desafio), URL (video) ou mini-quiz em JSON (jogo) —
    # o significado depende de `tipo` (ver seed.py).
    corpo_ou_url: Mapped[str] = mapped_column(Text)

    # Só dica visual; o aluno pode abrir os conteúdos do tema em qualquer ordem.
    ordem_sugerida: Mapped[int] = mapped_column(Integer, default=0)

    tema: Mapped["Tema"] = relationship(back_populates="conteudos")


class PesquisaAyvu(Base):
    """Alimenta a visão do professor por aluno em routers/okas.py — ao
    contrário do Reko, aqui a visibilidade é individual, não agregada."""

    __tablename__ = "pesquisas_ayvu"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), index=True)
    termo: Mapped[str] = mapped_column(String(200))
    criado_em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class Nota(Base):
    """Uma nota do boletim. Diferente do Reko: aqui é sempre individual,
    visível tanto pro professor quanto pro próprio aluno."""

    __tablename__ = "notas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    aluno_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), index=True)

    # Guardado junto pra não precisar de join extra ao checar posse (routers/notas.py).
    oka_id: Mapped[int] = mapped_column(ForeignKey("okas.id"), index=True)

    disciplina: Mapped[str] = mapped_column(String(100))
    prova: Mapped[str] = mapped_column(String(150))
    nota: Mapped[float] = mapped_column(Float)
    data: Mapped[date] = mapped_column(Date)

    criado_em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class MensagemChat(Base):
    """Chat em grupo de uma Oka — o professor pode ler (supervisão), nunca enviar."""

    __tablename__ = "mensagens_chat"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    oka_id: Mapped[int] = mapped_column(ForeignKey("okas.id"), index=True)
    autor_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), index=True)
    texto: Mapped[str] = mapped_column(String(1000))
    criado_em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), index=True)


class ProgressoAluno(Base):
    """Marca se um aluno concluiu um conteúdo (N:N entre aluno e conteúdo)."""

    __tablename__ = "progresso_aluno"
    __table_args__ = (
        UniqueConstraint("user_id", "conteudo_id", name="uq_progresso_user_conteudo"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), index=True)

    conteudo_id: Mapped[int] = mapped_column(ForeignKey("conteudos.id"), index=True)
    concluido: Mapped[bool] = mapped_column(Boolean, default=True)
    data_ultima_interacao: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    conteudo: Mapped["Conteudo"] = relationship()

    # Gancho futuro: dá pra cruzar isso com conteudos/temas/usuarios.oka_id
    # pra calcular interesses predominantes por Oka — sempre agregado,
    # nunca por aluno (mesmo princípio do Reko).


# ---------------------------------------------------------------------------
# Desafio de Desenho — o quadro/cavalete da ilha do professor
# ---------------------------------------------------------------------------


class DesafioDesenho(Base):
    """Um desafio de desenho que o professor ativa pra própria Oka (só um
    "ativo" por vez — routers/desafios.py desativa o anterior ao criar um
    novo). Usa datetime.utcnow() (não server_default=func.now()) de
    propósito, mesmo motivo do PresencaIlha: o cronômetro do aluno é
    calculado comparando direto com utcnow() no backend (tempo_restante_segundos
    em schemas.DesafioOut), então precisa ser a mesma hora dos dois lados."""

    __tablename__ = "desafios_desenho"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    professor_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), index=True)
    oka_id: Mapped[int] = mapped_column(ForeignKey("okas.id"), index=True)
    tema: Mapped[str] = mapped_column(String(200))
    duracao_segundos: Mapped[int] = mapped_column(Integer)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)


class DesenhoEnviado(Base):
    """Um desenho enviado por um aluno pra um DesafioDesenho — no máximo um
    por (desafio, aluno). `nota`/`itas_concedidos` ficam nulos até o
    professor corrigir (routers/desafios.py); os Itás concedidos não são
    creditados num saldo à parte, só somados em routers/macu.py::_calcular_itas
    (mesmo princípio derivado dos outros Itás — ver comentário lá)."""

    __tablename__ = "desenhos_enviados"
    __table_args__ = (
        UniqueConstraint("desafio_id", "aluno_id", name="uq_desenho_desafio_aluno"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    desafio_id: Mapped[int] = mapped_column(ForeignKey("desafios_desenho.id"), index=True)
    aluno_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), index=True)

    # Data URL PNG base64 — sem Storage configurado no projeto (ver
    # routers/desafios.py), então guarda direto como texto, mesmo padrão de
    # MacuAvatar.avatar_config.
    imagem: Mapped[str] = mapped_column(Text)

    enviado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    nota: Mapped[int | None] = mapped_column(Integer, nullable=True)
    itas_concedidos: Mapped[int | None] = mapped_column(Integer, nullable=True)
