from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from .. import models, schemas
from ..database import get_db
from ..deps import exigir_aluno, get_usuario_atual

router = APIRouter(prefix="/ayvu", tags=["ayvu"])


def _contagem_por_tipo(conteudos: list[models.Conteudo]) -> schemas.ContagemPorTipo:
    contagem = schemas.ContagemPorTipo()
    for conteudo in conteudos:
        valor_atual = getattr(contagem, conteudo.tipo.value)
        setattr(contagem, conteudo.tipo.value, valor_atual + 1)
    return contagem


@router.get("/temas", response_model=list[schemas.TemaListaOut])
def listar_temas(
    db: Session = Depends(get_db),
    _usuario: models.Usuario = Depends(get_usuario_atual),
):
    temas = (
        db.execute(select(models.Tema).options(selectinload(models.Tema.conteudos)))
        .scalars()
        .all()
    )

    return [
        schemas.TemaListaOut(
            id=tema.id,
            nome=tema.nome,
            descricao=tema.descricao,
            dentro_do_curriculo=tema.dentro_do_curriculo,
            total_conteudos=len(tema.conteudos),
            contagem_por_tipo=_contagem_por_tipo(tema.conteudos),
        )
        for tema in temas
    ]


@router.get("/temas/{tema_id}", response_model=schemas.TemaDetalheOut)
def detalhe_do_tema(
    tema_id: int,
    db: Session = Depends(get_db),
    _usuario: models.Usuario = Depends(get_usuario_atual),
):
    tema = db.execute(
        select(models.Tema)
        .options(selectinload(models.Tema.conteudos))
        .where(models.Tema.id == tema_id)
    ).scalar_one_or_none()

    if tema is None:
        raise HTTPException(status_code=404, detail="Tema não encontrado.")

    conteudos_por_tipo: dict[str, list[schemas.ConteudoOut]] = defaultdict(list)
    for conteudo in tema.conteudos:
        conteudos_por_tipo[conteudo.tipo.value].append(
            schemas.ConteudoOut.model_validate(conteudo)
        )

    return schemas.TemaDetalheOut(
        id=tema.id,
        nome=tema.nome,
        descricao=tema.descricao,
        dentro_do_curriculo=tema.dentro_do_curriculo,
        conteudos_por_tipo=dict(conteudos_por_tipo),
    )


@router.get("/progresso", response_model=schemas.ProgressoAlunoOut)
def progresso_do_aluno(
    db: Session = Depends(get_db),
    aluno: models.Usuario = Depends(exigir_aluno),
):
    """
    Progresso do aluno logado em TODOS os temas — usado só pra montar os
    indicadores ("2 de 4 conteúdos explorados") na tela inicial e os selos
    de concluído dentro de cada tema. Sempre o do próprio aluno (vem do
    token, nunca de um id arbitrário na URL) — não existe (e não deve
    existir) uma rota que exponha o progresso de um aluno pra outra
    pessoa. Ver o gancho de "interesses predominantes" comentado em
    models.py pra quando isso precisar virar agregado por turma.
    """
    linhas = db.execute(
        select(models.ProgressoAluno, models.Conteudo.tema_id)
        .join(models.Conteudo, models.Conteudo.id == models.ProgressoAluno.conteudo_id)
        .where(models.ProgressoAluno.user_id == aluno.id)
    ).all()

    itens = [
        schemas.ProgressoItem(
            conteudo_id=progresso.conteudo_id,
            tema_id=tema_id,
            concluido=progresso.concluido,
        )
        for progresso, tema_id in linhas
    ]

    return schemas.ProgressoAlunoOut(user_id=aluno.id, itens=itens)


@router.post("/progresso", response_model=schemas.ProgressoOut, status_code=201)
def marcar_progresso(
    entrada: schemas.ProgressoCreate,
    db: Session = Depends(get_db),
    aluno: models.Usuario = Depends(exigir_aluno),
):
    conteudo = db.get(models.Conteudo, entrada.conteudo_id)
    if conteudo is None:
        raise HTTPException(status_code=404, detail="Conteúdo não encontrado.")

    # Upsert: reabrir/revisitar um conteúdo atualiza o mesmo registro, não
    # cria duplicata (diferente do check-in do Reko, aqui marcar de novo é
    # uma ação normal e idempotente, não um erro).
    registro = db.execute(
        select(models.ProgressoAluno).where(
            models.ProgressoAluno.user_id == aluno.id,
            models.ProgressoAluno.conteudo_id == entrada.conteudo_id,
        )
    ).scalar_one_or_none()

    if registro is None:
        registro = models.ProgressoAluno(
            user_id=aluno.id,
            conteudo_id=entrada.conteudo_id,
            concluido=entrada.concluido,
        )
        db.add(registro)
    else:
        registro.concluido = entrada.concluido

    db.commit()
    db.refresh(registro)
    return registro
