from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import exigir_aluno, exigir_professor

router = APIRouter(prefix="/notas", tags=["notas"])


def _turma_do_professor_ou_404(db: Session, aluno_id: int, professor_id: int) -> models.Usuario:
    """
    Confere que `aluno_id` existe, está numa turma, e que essa turma é do
    professor logado — mesmo padrão de posse usado em turmas.py. Devolve o
    próprio Usuario (aluno) se tudo bater.
    """
    aluno = db.get(models.Usuario, aluno_id)
    if aluno is None or aluno.tipo != models.TipoUsuario.ALUNO or aluno.turma_id is None:
        raise HTTPException(status_code=404, detail="Aluno não encontrado.")

    turma = db.get(models.Turma, aluno.turma_id)
    if turma is None or turma.professor_id != professor_id:
        raise HTTPException(status_code=403, detail="Esse aluno não é da sua turma.")

    return aluno


@router.post("/alunos/{aluno_id}", response_model=schemas.NotaOut, status_code=201)
def lancar_nota(
    aluno_id: int,
    dados: schemas.NotaCreate,
    db: Session = Depends(get_db),
    professor: models.Usuario = Depends(exigir_professor),
):
    """Professor lança uma nota de prova pro boletim de um aluno da própria turma."""
    aluno = _turma_do_professor_ou_404(db, aluno_id, professor.id)

    nota = models.Nota(aluno_id=aluno.id, turma_id=aluno.turma_id, **dados.model_dump())
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
    """Boletim de um aluno específico, só pro professor dono da turma dele."""
    _turma_do_professor_ou_404(db, aluno_id, professor.id)

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
