import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy.pool import NullPool

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{BASE_DIR / 'ayvu.db'}")

# Supabase entrega a string como "postgresql://", mas isso faz o SQLAlchemy
# tentar psycopg2 (não instalado); reescreve pro dialeto psycopg (v3).
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)
elif DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)

if DATABASE_URL.startswith("sqlite"):
    # check_same_thread só existe pro SQLite; o Postgres nem aceita o argumento.
    _engine_kwargs: dict = {"connect_args": {"check_same_thread": False}}
elif os.environ.get("VERCEL"):
    # O Session pooler do Supabase aceita no máximo ~15 clientes no total. No
    # serverless da Vercel cada instância quente segurava o pool padrão do
    # SQLAlchemy (5 fixas + 10 extras) aberto e ocioso, então poucas
    # instâncias já esgotavam o limite ("EMAXCONNSESSION") e o app inteiro
    # caía. NullPool abre a conexão por requisição e fecha logo depois.
    _engine_kwargs = {"poolclass": NullPool}
else:
    # Dev local com Postgres: pool pequeno pra não ocupar sozinho as vagas
    # do mesmo banco que a produção usa.
    _engine_kwargs = {"pool_size": 2, "max_overflow": 1, "pool_recycle": 300, "pool_pre_ping": True}

engine = create_engine(DATABASE_URL, **_engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
