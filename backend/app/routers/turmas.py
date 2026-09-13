import json
import random
import string

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import exigir_aluno, exigir_professor

router = APIRouter(prefix="/turmas", tags=["turmas"])

_ALFABETO_CODIGO = string.ascii_uppercase + string.digits
_TAMANHO_CODIGO = 6


def _gerar_codigo() -> str:
    return "".join(random.choices(_ALFABETO_CODIGO, k=_TAMANHO_CODIGO))


@router.post("", response_model=schemas.TurmaOut, status_code=201)
def criar_turma(
    dados: schemas.TurmaCreate,
    db: Session = Depends(get_db),
    professor: models.Usuario = Depends(exigir_professor),
):
    """Cria uma turma ("ilha") pro professor logado, com um código de convite único."""
    for _ in range(5):
        turma = models.Turma(nome=dados.nome, professor_id=professor.id, codigo=_gerar_codigo())
        db.add(turma)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            continue
        db.refresh(turma)
        return turma

    raise HTTPException(status_code=500, detail="Não foi possível gerar um código único. Tente de novo.")


@router.get("", response_model=list[schemas.TurmaOut])
def listar_minhas_turmas(
    db: Session = Depends(get_db),
    professor: models.Usuario = Depends(exigir_professor),
):
    return (
        db.execute(
            select(models.Turma)
            .where(models.Turma.professor_id == professor.id)
            .order_by(models.Turma.criado_em.desc())
        )
        .scalars()
        .all()
    )


@router.post("/entrar", response_model=schemas.EntrarTurmaOut)
def entrar_na_turma(
    dados: schemas.EntrarTurmaPayload,
    db: Session = Depends(get_db),
    aluno: models.Usuario = Depends(exigir_aluno),
):
    """Aluno entra numa turma usando o código que o professor compartilhou."""
    codigo = dados.codigo.strip().upper()
    turma = db.execute(select(models.Turma).where(models.Turma.codigo == codigo)).scalar_one_or_none()
    if turma is None:
        raise HTTPException(status_code=404, detail="Código inválido. Confira com o professor.")

    aluno.turma_id = turma.id
    db.commit()
    return schemas.EntrarTurmaOut(turma_id=turma.id, nome_turma=turma.nome)


@router.get("/minha/colegas", response_model=list[schemas.ColegaDaTurmaOut])
def listar_colegas(
    db: Session = Depends(get_db),
    aluno: models.Usuario = Depends(exigir_aluno),
):
    """
    Oka — os colegas de ilha do próprio aluno. De propósito só nome + Macu,
    sem temas pesquisados nem sinal de bem-estar (isso é só pro professor,
    ver listar_alunos_da_turma).
    """
    if aluno.turma_id is None:
        return []

    colegas = db.execute(
        select(models.Usuario).where(
            models.Usuario.turma_id == aluno.turma_id,
            models.Usuario.id != aluno.id,
        )
    ).scalars().all()

    resultado = []
    for colega in colegas:
        avatar = db.execute(
            select(models.MacuAvatar).where(models.MacuAvatar.user_id == colega.id)
        ).scalar_one_or_none()
        config = json.loads(avatar.avatar_config) if avatar else {}
        resultado.append(schemas.ColegaDaTurmaOut(id=colega.id, nome=colega.nome, avatar_config=config))

    return resultado


# Limiares da "média dos últimos check-ins" que viram o sinal de bem-estar —
# nunca a nota exata é exposta pro professor, só essas 3 categorias.
_LIMIAR_ATENCAO = 2.5
_LIMIAR_BEM = 3.5
_QUANTIDADE_CHECKINS_CONSIDERADOS = 3
_QUANTIDADE_TEMAS = 8


def _sinal_bem_estar(db: Session, aluno_id: int) -> tuple[str, str]:
    checkins = (
        db.execute(
            select(models.RekoCheckin)
            .where(models.RekoCheckin.user_id == aluno_id)
            .order_by(models.RekoCheckin.data.desc())
            .limit(_QUANTIDADE_CHECKINS_CONSIDERADOS)
        )
        .scalars()
        .all()
    )

    if not checkins:
        return "sem_dados", "Ainda não fez check-in no Reko."

    medias_por_dia = [
        (c.autoconhecimento + c.autogestao + c.consciencia_social + c.relacionamento + c.decisao_responsavel) / 5
        for c in checkins
    ]
    media = sum(medias_por_dia) / len(medias_por_dia)

    if media < _LIMIAR_ATENCAO:
        return "atencao", "Pode estar passando por um momento mais difícil essa semana."
    if media < _LIMIAR_BEM:
        return "neutro", "Tudo dentro do esperado por aqui."
    return "bem", "Parece estar bem essa semana."


@router.get("/{turma_id}/alunos", response_model=list[schemas.AlunoDaTurmaOut])
def listar_alunos_da_turma(
    turma_id: int,
    db: Session = Depends(get_db),
    professor: models.Usuario = Depends(exigir_professor),
):
    """
    Visão do professor por aluno: um sinal de bem-estar (sem nota — ver
    _sinal_bem_estar) e os temas que o aluno pesquisou no Ayvu (aqui sim
    individual, ao contrário do Reko: foi um pedido explícito).
    """
    turma = db.get(models.Turma, turma_id)
    if turma is None or turma.professor_id != professor.id:
        raise HTTPException(status_code=404, detail="Turma não encontrada.")

    alunos = db.execute(select(models.Usuario).where(models.Usuario.turma_id == turma_id)).scalars().all()

    resultado = []
    for aluno in alunos:
        sinal, frase = _sinal_bem_estar(db, aluno.id)

        termos = (
            db.execute(
                select(models.PesquisaAyvu.termo)
                .where(models.PesquisaAyvu.user_id == aluno.id)
                .order_by(models.PesquisaAyvu.criado_em.desc())
            )
            .scalars()
            .all()
        )

        # dedupe mantendo a ordem (mais recente primeiro), sem diferenciar
        # maiúsculas/minúsculas.
        vistos: set[str] = set()
        temas_unicos: list[str] = []
        for termo in termos:
            chave = termo.strip().lower()
            if chave in vistos:
                continue
            vistos.add(chave)
            temas_unicos.append(termo)
            if len(temas_unicos) >= _QUANTIDADE_TEMAS:
                break

        resultado.append(
            schemas.AlunoDaTurmaOut(
                id=aluno.id,
                nome=aluno.nome,
                sinal_bem_estar=sinal,
                frase_bem_estar=frase,
                temas_pesquisados=temas_unicos,
            )
        )

    return resultado
