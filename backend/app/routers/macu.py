import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import exigir_aluno, exigir_professor

router = APIRouter(prefix="/macu", tags=["macu"])

# Itás (moeda/pontuação do aluno, referência a "itá" = pedra/semente em
# tupi) não são um contador guardado à parte — são derivados da atividade
# que já existe (check-in do Reko, conteúdo concluído no Ayvu, pesquisa
# feita, desenho corrigido no Desafio de Desenho), então não tem como
# "burlar" ganhando Itás sem realmente participar, e não precisa de uma
# tabela nova só pra isso. Todo aluno recém-cadastrado começa em 0 porque
# ainda não tem nenhuma dessas atividades registrada.
_ITAS_POR_CHECKIN_REKO = 10
_ITAS_POR_CONTEUDO_CONCLUIDO = 5
_ITAS_POR_PESQUISA = 2


def _calcular_itas(db: Session, aluno_id: int) -> schemas.ItasOut:
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
    # itas_concedidos só é preenchido quando o professor corrige o desenho
    # (routers/desafios.py::dar_nota) — antes disso fica nulo e não entra
    # na soma.
    total_itas_desenhos = db.scalar(
        select(func.sum(models.DesenhoEnviado.itas_concedidos)).where(
            models.DesenhoEnviado.aluno_id == aluno_id,
            models.DesenhoEnviado.itas_concedidos.isnot(None),
        )
    )

    itas_total = (
        total_checkins * _ITAS_POR_CHECKIN_REKO
        + total_concluidos * _ITAS_POR_CONTEUDO_CONCLUIDO
        + total_pesquisas * _ITAS_POR_PESQUISA
        + (total_itas_desenhos or 0)
    )

    return schemas.ItasOut(itas_total=itas_total)


@router.get("/itas", response_model=schemas.ItasOut)
def obter_itas(
    db: Session = Depends(get_db),
    aluno: models.Usuario = Depends(exigir_aluno),
):
    return _calcular_itas(db, aluno.id)


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
