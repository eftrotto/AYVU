import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import exigir_aluno, exigir_professor
from ..itas import calcular_itas

router = APIRouter(prefix="/macu", tags=["macu"])

# Campos do avatar que precisam ter sido comprados na vendinha antes de
# poder ser salvos — ver routers/loja.py pro catálogo/preços. Os valores
# GRÁTIS por padrão (AVATAR_PADRAO no frontend) ficam de fora e sempre
# passam (ver _validar_posse abaixo).
_CAMPOS_VENDIVEIS = ["shirtColor", "pantsColor", "shoeColor", "usaOculos"]


def _validar_posse_do_avatar(db: Session, aluno_id: int, avatar_config: dict) -> None:
    # Import local só pra manter o catálogo/preços inteiros dentro de
    # routers/loja.py (não duplicado aqui) sem criar um import no topo do
    # arquivo que só é usado dentro desta função.
    from .loja import ids_comprados, item_esta_liberado

    comprados = None
    for campo in _CAMPOS_VENDIVEIS:
        if campo not in avatar_config:
            continue
        valor = avatar_config[campo]
        if campo == "usaOculos":
            if not valor:
                continue  # desligar o acessório é sempre permitido, de graça
            valor = "true"
        if comprados is None:
            comprados = ids_comprados(db, aluno_id)
        if not item_esta_liberado(campo, valor, comprados):
            raise HTTPException(
                status_code=400,
                detail="Você ainda não comprou esse item — dá uma olhada na vendinha da sua ilha!",
            )


@router.get("/itas", response_model=schemas.ItasOut)
def obter_itas(
    db: Session = Depends(get_db),
    aluno: models.Usuario = Depends(exigir_aluno),
):
    return calcular_itas(db, aluno.id)


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
    _validar_posse_do_avatar(db, aluno.id, entrada.avatar_config)

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


# Boneco do professor — fase de teste: ao contrário do Macu do aluno (7
# camadas customizáveis, ver lpcData.ts), o professor só escolhe entre 2
# presets fixos (masculino/feminino) no frontend e manda o config pronto
# aqui. Reaproveita a MESMA tabela MacuAvatar (é só user_id -> config JSON,
# não importa o tipo de usuário) em vez de criar uma tabela nova.


@router.get("/avatar-professor", response_model=schemas.MacuAvatarOut)
def obter_avatar_professor(
    db: Session = Depends(get_db),
    professor: models.Usuario = Depends(exigir_professor),
):
    registro = db.execute(
        select(models.MacuAvatar).where(models.MacuAvatar.user_id == professor.id)
    ).scalar_one_or_none()

    if registro is None:
        return _avatar_padrao(professor.id)

    return schemas.MacuAvatarOut(
        user_id=registro.user_id,
        avatar_config=json.loads(registro.avatar_config),
        atualizado_em=registro.atualizado_em,
    )


@router.put("/avatar-professor", response_model=schemas.MacuAvatarOut)
def salvar_avatar_professor(
    entrada: schemas.MacuAvatarUpsert,
    db: Session = Depends(get_db),
    professor: models.Usuario = Depends(exigir_professor),
):
    registro = db.execute(
        select(models.MacuAvatar).where(models.MacuAvatar.user_id == professor.id)
    ).scalar_one_or_none()

    config_serializada = json.dumps(entrada.avatar_config, ensure_ascii=False)

    if registro is None:
        registro = models.MacuAvatar(user_id=professor.id, avatar_config=config_serializada)
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
