from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import exigir_aluno

router = APIRouter(prefix="/oca", tags=["oca"])

# Valores grátis por padrão (mesmo de _padrao() abaixo) — qualquer outro
# precisa ter sido comprado na vendinha primeiro (ver routers/loja.py).
_CAMPOS_VENDIVEIS = {"cor_parede": "c2a35f", "cor_chao": "7a5636", "item_central": "nenhum"}


def _validar_posse_da_oca(db: Session, aluno_id: int, dados: schemas.OkaPessoalUpsert) -> None:
    # Import local — mesmo motivo do routers/macu.py: mantém o catálogo só
    # em routers/loja.py, sem um import de topo usado só aqui dentro.
    from .loja import ids_comprados, item_esta_liberado

    comprados = None
    for campo, valor_gratis in _CAMPOS_VENDIVEIS.items():
        valor = getattr(dados, campo)
        if valor == valor_gratis:
            continue
        if comprados is None:
            comprados = ids_comprados(db, aluno_id)
        if not item_esta_liberado(campo, valor, comprados):
            raise HTTPException(
                status_code=400,
                detail="Você ainda não comprou esse item — dá uma olhada na vendinha da sua ilha!",
            )


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
    _validar_posse_da_oca(db, aluno.id, dados)

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
