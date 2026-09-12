from datetime import date, datetime

from sqlalchemy import Date, DateTime, Integer, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


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
