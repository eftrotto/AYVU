import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import exigir_aluno

router = APIRouter(prefix="/macu", tags=["macu"])

# XP não é um contador guardado à parte — é derivado da atividade que já
# existe (check-in do Reko, conteúdo concluído no Ayvu, pesquisa feita),
# então não tem como "burlar" ganhando XP sem realmente participar, e não
# precisa de uma tabela nova só pra isso.
_XP_POR_CHECKIN_REKO = 10
_XP_POR_CONTEUDO_CONCLUIDO = 5
_XP_POR_PESQUISA = 2
_XP_POR_NIVEL = 50


def _calcular_nivel(db: Session, aluno_id: int) -> schemas.NivelOut:
    total_checkins = db.scalar(
        select(func.count(models.RekoCheckin.id)).where(models.RekoCheckin.user_id == aluno_id)
    )
    total_concluidos = db.scalar(
        select(func.count(models.ProgressoAluno.id)).where(
            models.ProgressoAluno.user_id == aluno_id,
            models.ProgressoAluno.concluido.is_(True),
        )
    )
    total_pesquisas = db.scalar(
        select(func.count(models.PesquisaAyvu.id)).where(models.PesquisaAyvu.user_id == aluno_id)
    )

    xp_total = (
        total_checkins * _XP_POR_CHECKIN_REKO
        + total_concluidos * _XP_POR_CONTEUDO_CONCLUIDO
        + total_pesquisas * _XP_POR_PESQUISA
    )

    nivel = 1 + xp_total // _XP_POR_NIVEL
    xp_neste_nivel = xp_total % _XP_POR_NIVEL

    return schemas.NivelOut(
        nivel=nivel,
        xp_total=xp_total,
        xp_neste_nivel=xp_neste_nivel,
        xp_para_proximo_nivel=_XP_POR_NIVEL,
    )


@router.get("/nivel", response_model=schemas.NivelOut)
def obter_nivel(
    db: Session = Depends(get_db),
    aluno: models.Usuario = Depends(exigir_aluno),
):
    return _calcular_nivel(db, aluno.id)


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
