from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import exigir_aluno, exigir_professor

router = APIRouter(prefix="/reko", tags=["reko"])

# Abaixo desse número de check-ins na turma, não devolvemos médias: com
# poucos alunos, uma "média" se aproxima demais da nota de uma pessoa só,
# o que fere o princípio do Reko de nunca expor dado individual ao
# professor (ver README do projeto).
MINIMO_RESPOSTAS_PARA_AGREGADO = 5


@router.post("/checkin", response_model=schemas.RekoCheckinOut, status_code=201)
def criar_checkin(
    checkin: schemas.RekoCheckinCreate,
    db: Session = Depends(get_db),
    aluno: models.Usuario = Depends(exigir_aluno),
):
    registro = models.RekoCheckin(user_id=aluno.id, **checkin.model_dump())
    db.add(registro)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Este aluno já fez o check-in de hoje.",
        )
    db.refresh(registro)
    return registro


@router.get("/aggregate/{turma_id}", response_model=schemas.RekoAggregateOut)
def agregado_da_turma(
    turma_id: int,
    db: Session = Depends(get_db),
    _professor: models.Usuario = Depends(exigir_professor),
):
    """
    Médias agregadas da turma inteira — NUNCA um endpoint por aluno.
    Não existe (e não deve existir) uma rota que devolva o check-in de um
    único aluno para o professor; só o agregado aqui. Só professores
    autenticados conseguem chamar essa rota (ver deps.exigir_professor).
    """
    linha = db.execute(
        select(
            func.count(models.RekoCheckin.id),
            func.avg(models.RekoCheckin.autoconhecimento),
            func.avg(models.RekoCheckin.autogestao),
            func.avg(models.RekoCheckin.consciencia_social),
            func.avg(models.RekoCheckin.relacionamento),
            func.avg(models.RekoCheckin.decisao_responsavel),
        )
        .join(models.Usuario, models.Usuario.id == models.RekoCheckin.user_id)
        .where(models.Usuario.turma_id == turma_id)
    ).one()

    total_checkins = linha[0]
    dados_suficientes = total_checkins >= MINIMO_RESPOSTAS_PARA_AGREGADO

    medias = None
    if dados_suficientes:
        medias = schemas.RekoMedias(
            autoconhecimento=round(linha[1], 2),
            autogestao=round(linha[2], 2),
            consciencia_social=round(linha[3], 2),
            relacionamento=round(linha[4], 2),
            decisao_responsavel=round(linha[5], 2),
        )

    return schemas.RekoAggregateOut(
        turma_id=turma_id,
        total_checkins=total_checkins,
        dados_suficientes=dados_suficientes,
        minimo_necessario=MINIMO_RESPOSTAS_PARA_AGREGADO,
        medias=medias,
    )
