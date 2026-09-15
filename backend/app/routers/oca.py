from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import exigir_aluno

router = APIRouter(prefix="/oca", tags=["oca"])


def _padrao() -> schemas.OkaPessoalOut:
    return schemas.OkaPessoalOut(
        cor_parede="c2a35f",
        cor_chao="7a5636",
        item_central="nenhum",
        atualizado_em=datetime.now(timezone.utc),
    )


@router.get("", response_model=schemas.OkaPessoalOut)
def obter_minha_oca(
    db: Session = Depends(get_db),
    aluno: models.Usuario = Depends(exigir_aluno),
):
    registro = db.execute(
        select(models.OkaPessoal).where(models.OkaPessoal.user_id == aluno.id)
    ).scalar_one_or_none()
    return schemas.OkaPessoalOut.model_validate(registro) if registro else _padrao()


@router.put("", response_model=schemas.OkaPessoalOut)
def salvar_minha_oca(
    dados: schemas.OkaPessoalUpsert,
    db: Session = Depends(get_db),
    aluno: models.Usuario = Depends(exigir_aluno),
):
    registro = db.execute(
        select(models.OkaPessoal).where(models.OkaPessoal.user_id == aluno.id)
    ).scalar_one_or_none()

    if registro is None:
        registro = models.OkaPessoal(user_id=aluno.id, **dados.model_dump())
        db.add(registro)
    else:
        registro.cor_parede = dados.cor_parede
        registro.cor_chao = dados.cor_chao
        registro.item_central = dados.item_central

    db.commit()
    db.refresh(registro)
    return schemas.OkaPessoalOut.model_validate(registro)
