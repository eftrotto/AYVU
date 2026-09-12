import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

# DATABASE_URL vem do .env (ex.: Postgres do Supabase). Sem essa variável,
# cai no SQLite local — útil pra rodar/testar sem depender de nada externo.
DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{BASE_DIR / 'ayvu.db'}")

# O Supabase (e serviços parecidos) dão a string como "postgresql://..." —
# isso faz o SQLAlchemy tentar usar psycopg2 por padrão. Instalamos o
# psycopg (v3) no requirements.txt, então reescrevemos pra usar o dialeto
# certo sem o usuário precisar saber disso.
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)
elif DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)

# connect_args com check_same_thread só faz sentido pro SQLite; o Postgres
# (psycopg) não usa e não aceita esse argumento.
_connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=_connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
