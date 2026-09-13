from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import exigir_aluno, exigir_professor

router = APIRouter(prefix="/notas", tags=["notas"])


def _oka_do_professor_ou_404(db: Session, aluno_id: int, professor_id: int) -> models.Usuario:
    """
    Confere que `aluno_id` existe, está numa Oka, e que essa Oka é do
    professor logado — mesmo padrão de posse usado em okas.py. Devolve o
    próprio Usuario (aluno) se tudo bater.
    """
    aluno = db.get(models.Usuario, aluno_id)
    if aluno is None or aluno.tipo != models.TipoUsuario.ALUNO or aluno.oka_id is None:
        raise HTTPException(status_code=404, detail="Aluno não encontrado.")

    oka = db.get(models.Oka, aluno.oka_id)
    if oka is None or oka.professor_id != professor_id:
        raise HTTPException(status_code=403, detail="Esse aluno não é da sua Oka.")

    return aluno


@router.post("/alunos/{aluno_id}", response_model=schemas.NotaOut, status_code=201)
def lancar_nota(
    aluno_id: int,
    dados: schemas.NotaCreate,
    db: Session = Depends(get_db),
    professor: models.Usuario = Depends(exigir_professor),
):
    """Professor lança uma nota de prova pro boletim de um aluno da própria Oka."""
    aluno = _oka_do_professor_ou_404(db, aluno_id, professor.id)

    nota = models.Nota(aluno_id=aluno.id, oka_id=aluno.oka_id, **dados.model_dump())
    db.add(nota)
    db.commit()
    db.refresh(nota)
    return nota


@router.get("/alunos/{aluno_id}", response_model=list[schemas.NotaOut])
def notas_do_aluno(
    aluno_id: int,
    db: Session = Depends(get_db),
    professor: models.Usuario = Depends(exigir_professor),
):
    """Boletim de um aluno específico, só pro professor dono da Oka dele."""
    _oka_do_professor_ou_404(db, aluno_id, professor.id)

    return (
        db.execute(
            select(models.Nota).where(models.Nota.aluno_id == aluno_id).order_by(models.Nota.data.desc())
        )
        .scalars()
        .all()
    )


@router.get("/minhas", response_model=list[schemas.NotaOut])
def minhas_notas(
    db: Session = Depends(get_db),
    aluno: models.Usuario = Depends(exigir_aluno),
):
    """O próprio boletim do aluno logado."""
    return (
        db.execute(
            select(models.Nota).where(models.Nota.aluno_id == aluno.id).order_by(models.Nota.data.desc())
        )
        .scalars()
        .all()
    )
