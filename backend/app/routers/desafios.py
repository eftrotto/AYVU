from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import exigir_aluno, exigir_professor, get_usuario_atual

router_desafios = APIRouter(prefix="/desafios", tags=["desafios"])
router_desenhos = APIRouter(prefix="/desenhos", tags=["desafios"])

# Fórmula simples e proporcional — fácil de ajustar o equilíbrio econômico
# do jogo sem mexer no resto da lógica (ver _desenho_out/dar_nota abaixo).
_ITAS_POR_PONTO_DE_NOTA = 5


def _tempo_restante_segundos(desafio: models.DesafioDesenho) -> int:
    fim = desafio.criado_em + timedelta(seconds=desafio.duracao_segundos)
    restante = (fim - datetime.utcnow()).total_seconds()
    return max(0, int(restante))


def _desafio_out(db: Session, desafio: models.DesafioDesenho, aluno_id: int | None) -> schemas.DesafioOut:
    ja_enviei = False
    if aluno_id is not None:
        ja_enviei = (
            db.execute(
                select(models.DesenhoEnviado.id).where(
                    models.DesenhoEnviado.desafio_id == desafio.id,
                    models.DesenhoEnviado.aluno_id == aluno_id,
                )
            ).first()
            is not None
        )

    return schemas.DesafioOut(
        id=desafio.id,
        professor_id=desafio.professor_id,
        oka_id=desafio.oka_id,
        tema=desafio.tema,
        duracao_segundos=desafio.duracao_segundos,
        criado_em=desafio.criado_em,
        ativo=desafio.ativo,
        tempo_restante_segundos=_tempo_restante_segundos(desafio),
        ja_enviei=ja_enviei,
    )


def _desenho_out(desenho: models.DesenhoEnviado, aluno_nome: str) -> schemas.DesenhoOut:
    return schemas.DesenhoOut(
        id=desenho.id,
        desafio_id=desenho.desafio_id,
        aluno_id=desenho.aluno_id,
        aluno_nome=aluno_nome,
        imagem=desenho.imagem,
        enviado_em=desenho.enviado_em,
        nota=desenho.nota,
        itas_concedidos=desenho.itas_concedidos,
    )


@router_desafios.post("", response_model=schemas.DesafioOut, status_code=201)
def criar_desafio(
    dados: schemas.DesafioCreate,
    db: Session = Depends(get_db),
    professor: models.Usuario = Depends(exigir_professor),
):
    oka = db.get(models.Oka, dados.oka_id)
    if oka is None or oka.professor_id != professor.id:
        raise HTTPException(status_code=404, detail="Ilha não encontrada.")

    # Só um desafio ativo por vez por Oka — criar um novo encerra o anterior.
    db.execute(
        update(models.DesafioDesenho)
        .where(models.DesafioDesenho.oka_id == dados.oka_id, models.DesafioDesenho.ativo.is_(True))
        .values(ativo=False)
    )

    desafio = models.DesafioDesenho(
        professor_id=professor.id,
        oka_id=dados.oka_id,
        tema=dados.tema.strip(),
        duracao_segundos=dados.duracao_segundos,
    )
    db.add(desafio)
    db.commit()
    db.refresh(desafio)
    return _desafio_out(db, desafio, aluno_id=None)


@router_desafios.get("/ativo/{oka_id}", response_model=schemas.DesafioOut | None)
def desafio_ativo_da_oka(
    oka_id: int,
    db: Session = Depends(get_db),
    usuario: models.Usuario = Depends(get_usuario_atual),
):
    """Devolve o desafio mais recente daquela Oka — usado tanto pelo aluno
    (pra saber se tem desafio rolando agora) quanto pelo professor (pra ver
    status/corrigir depois). Cada papel tem sua própria checagem de posse."""
    if usuario.tipo == models.TipoUsuario.ALUNO:
        if usuario.oka_id != oka_id:
            raise HTTPException(status_code=403, detail="Você não está nessa ilha.")
    else:
        oka = db.get(models.Oka, oka_id)
        if oka is None or oka.professor_id != usuario.id:
            raise HTTPException(status_code=404, detail="Ilha não encontrada.")

    desafio = db.execute(
        select(models.DesafioDesenho)
        .where(models.DesafioDesenho.oka_id == oka_id)
        .order_by(models.DesafioDesenho.criado_em.desc())
        .limit(1)
    ).scalar_one_or_none()

    if desafio is None:
        return None

    # Pro aluno, um desafio com o tempo esgotado já não existe mais na
    # prática (a tela dele não deve reabrir o modal) — pro professor, ele
    # continua aparecendo pra poder corrigir os desenhos depois do prazo.
    if usuario.tipo == models.TipoUsuario.ALUNO and _tempo_restante_segundos(desafio) <= 0:
        return None

    aluno_id = usuario.id if usuario.tipo == models.TipoUsuario.ALUNO else None
    return _desafio_out(db, desafio, aluno_id=aluno_id)


@router_desafios.post("/{desafio_id}/enviar", response_model=schemas.DesenhoOut, status_code=201)
def enviar_desenho(
    desafio_id: int,
    dados: schemas.DesenhoEnviarPayload,
    db: Session = Depends(get_db),
    aluno: models.Usuario = Depends(exigir_aluno),
):
    desafio = db.get(models.DesafioDesenho, desafio_id)
    if desafio is None or desafio.oka_id != aluno.oka_id:
        raise HTTPException(status_code=404, detail="Desafio não encontrado.")

    if _tempo_restante_segundos(desafio) <= 0:
        raise HTTPException(status_code=400, detail="O tempo desse desafio já acabou.")

    existente = db.execute(
        select(models.DesenhoEnviado).where(
            models.DesenhoEnviado.desafio_id == desafio_id,
            models.DesenhoEnviado.aluno_id == aluno.id,
        )
    ).scalar_one_or_none()
    if existente is not None:
        raise HTTPException(status_code=400, detail="Você já enviou um desenho pra esse desafio.")

    desenho = models.DesenhoEnviado(desafio_id=desafio_id, aluno_id=aluno.id, imagem=dados.imagem)
    db.add(desenho)
    db.commit()
    db.refresh(desenho)
    return _desenho_out(desenho, aluno.nome)


@router_desafios.get("/{desafio_id}/desenhos", response_model=list[schemas.DesenhoOut])
def listar_desenhos(
    desafio_id: int,
    db: Session = Depends(get_db),
    professor: models.Usuario = Depends(exigir_professor),
):
    desafio = db.get(models.DesafioDesenho, desafio_id)
    if desafio is None or desafio.professor_id != professor.id:
        raise HTTPException(status_code=404, detail="Desafio não encontrado.")

    linhas = db.execute(
        select(models.DesenhoEnviado, models.Usuario)
        .join(models.Usuario, models.Usuario.id == models.DesenhoEnviado.aluno_id)
        .where(models.DesenhoEnviado.desafio_id == desafio_id)
        .order_by(models.DesenhoEnviado.enviado_em.asc())
    ).all()

    return [_desenho_out(desenho, usuario.nome) for desenho, usuario in linhas]


@router_desenhos.post("/{desenho_id}/nota", response_model=schemas.DesenhoOut)
def dar_nota(
    desenho_id: int,
    dados: schemas.NotaDesenhoPayload,
    db: Session = Depends(get_db),
    professor: models.Usuario = Depends(exigir_professor),
):
    desenho = db.get(models.DesenhoEnviado, desenho_id)
    if desenho is None:
        raise HTTPException(status_code=404, detail="Desenho não encontrado.")

    desafio = db.get(models.DesafioDesenho, desenho.desafio_id)
    if desafio is None or desafio.professor_id != professor.id:
        raise HTTPException(status_code=404, detail="Desenho não encontrado.")

    aluno = db.get(models.Usuario, desenho.aluno_id)

    desenho.nota = dados.nota
    # Só grava quanto foi concedido — o crédito em si acontece sozinho na
    # próxima vez que /macu/itas somar (ver _calcular_itas), sem saldo à parte.
    desenho.itas_concedidos = dados.nota * _ITAS_POR_PONTO_DE_NOTA
    db.commit()
    db.refresh(desenho)
    return _desenho_out(desenho, aluno.nome if aluno else "?")
