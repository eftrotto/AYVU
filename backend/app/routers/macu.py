import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import exigir_aluno

router = APIRouter(prefix="/macu", tags=["macu"])


def _avatar_padrao(user_id: int) -> schemas.MacuAvatarOut:
    return schemas.MacuAvatarOut(user_id=user_id, avatar_config={}, atualizado_em=datetime.now(timezone.utc))


@router.get("/avatar", response_model=schemas.MacuAvatarOut)
def obter_avatar(
    db: Session = Depends(get_db),
    aluno: models.Usuario = Depends(exigir_aluno),
):
    registro = db.execute(
        select(models.MacuAvatar).where(models.MacuAvatar.user_id == aluno.id)
    ).scalar_one_or_none()

    if registro is None:
        # Aluno ainda não personalizou o Macu — devolve config vazia em vez
        # de 404, pra o frontend simplesmente cair nos valores padrão.
        return _avatar_padrao(aluno.id)

    return schemas.MacuAvatarOut(
        user_id=registro.user_id,
        avatar_config=json.loads(registro.avatar_config),
        atualizado_em=registro.atualizado_em,
    )


@router.put("/avatar", response_model=schemas.MacuAvatarOut)
def salvar_avatar(
    entrada: schemas.MacuAvatarUpsert,
    db: Session = Depends(get_db),
    aluno: models.Usuario = Depends(exigir_aluno),
):
    registro = db.execute(
        select(models.MacuAvatar).where(models.MacuAvatar.user_id == aluno.id)
    ).scalar_one_or_none()

    config_serializada = json.dumps(entrada.avatar_config, ensure_ascii=False)

    if registro is None:
        registro = models.MacuAvatar(user_id=aluno.id, avatar_config=config_serializada)
        db.add(registro)
    else:
        registro.avatar_config = config_serializada

    db.commit()
    db.refresh(registro)

    return schemas.MacuAvatarOut(
        user_id=registro.user_id,
        avatar_config=json.loads(registro.avatar_config),
        atualizado_em=registro.atualizado_em,
    )
