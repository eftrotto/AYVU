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

router = APIRouter(prefix="/okas", tags=["okas"])

_ALFABETO_CODIGO = string.ascii_uppercase + string.digits
_TAMANHO_CODIGO = 6


def _gerar_codigo() -> str:
    return "".join(random.choices(_ALFABETO_CODIGO, k=_TAMANHO_CODIGO))


@router.post("", response_model=schemas.OkaOut, status_code=201)
def criar_oka(
    dados: schemas.OkaCreate,
    db: Session = Depends(get_db),
    professor: models.Usuario = Depends(exigir_professor),
):
    for _ in range(5):
        oka = models.Oka(nome=dados.nome, professor_id=professor.id, codigo=_gerar_codigo())
        db.add(oka)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            continue
        db.refresh(oka)
        return oka

    raise HTTPException(status_code=500, detail="Não foi possível gerar um código único. Tente de novo.")


@router.get("", response_model=list[schemas.OkaOut])
def listar_minhas_okas(
    db: Session = Depends(get_db),
    professor: models.Usuario = Depends(exigir_professor),
):
    return (
        db.execute(
            select(models.Oka)
            .where(models.Oka.professor_id == professor.id)
            .order_by(models.Oka.criado_em.desc())
        )
        .scalars()
        .all()
    )


@router.post("/entrar", response_model=schemas.EntrarOkaOut)
def entrar_na_oka(
    dados: schemas.EntrarOkaPayload,
    db: Session = Depends(get_db),
    aluno: models.Usuario = Depends(exigir_aluno),
):
    codigo = dados.codigo.strip().upper()
    oka = db.execute(select(models.Oka).where(models.Oka.codigo == codigo)).scalar_one_or_none()
    if oka is None:
        raise HTTPException(status_code=404, detail="Código inválido. Confira com o professor.")

    aluno.oka_id = oka.id
    db.commit()
    return schemas.EntrarOkaOut(oka_id=oka.id, nome_oka=oka.nome)


@router.get("/minha/colegas", response_model=list[schemas.ColegaDaOkaOut])
def listar_colegas(
    db: Session = Depends(get_db),
    aluno: models.Usuario = Depends(exigir_aluno),
):
    """De propósito só nome + Macu, sem temas pesquisados nem sinal de
    bem-estar (isso é só pro professor, ver listar_alunos_da_oka)."""
    if aluno.oka_id is None:
        return []

    colegas = db.execute(
        select(models.Usuario).where(
            models.Usuario.oka_id == aluno.oka_id,
            models.Usuario.id != aluno.id,
        )
    ).scalars().all()

    resultado = []
    for colega in colegas:
        avatar = db.execute(
            select(models.MacuAvatar).where(models.MacuAvatar.user_id == colega.id)
        ).scalar_one_or_none()
        config = json.loads(avatar.avatar_config) if avatar else {}
        resultado.append(schemas.ColegaDaOkaOut(id=colega.id, nome=colega.nome, avatar_config=config))

    return resultado


_QUANTIDADE_MENSAGENS_CHAT = 200


def _montar_mensagens_out(db: Session, mensagens: list[models.MensagemChat]) -> list[schemas.MensagemChatOut]:
    autor_ids = {m.autor_id for m in mensagens}
    autores = {
        u.id: u.nome
        for u in db.execute(select(models.Usuario).where(models.Usuario.id.in_(autor_ids))).scalars()
    } if autor_ids else {}

    return [
        schemas.MensagemChatOut(
            id=m.id,
            oka_id=m.oka_id,
            autor_id=m.autor_id,
            autor_nome=autores.get(m.autor_id, "?"),
            texto=m.texto,
            criado_em=m.criado_em,
        )
        for m in mensagens
    ]


@router.get("/minha/chat", response_model=list[schemas.MensagemChatOut])
def listar_chat_da_minha_oka(
    db: Session = Depends(get_db),
    aluno: models.Usuario = Depends(exigir_aluno),
):
    if aluno.oka_id is None:
        return []

    mensagens = (
        db.execute(
            select(models.MensagemChat)
            .where(models.MensagemChat.oka_id == aluno.oka_id)
            .order_by(models.MensagemChat.criado_em.desc())
            .limit(_QUANTIDADE_MENSAGENS_CHAT)
        )
        .scalars()
        .all()
    )
    return _montar_mensagens_out(db, list(reversed(mensagens)))


@router.post("/minha/chat", response_model=schemas.MensagemChatOut, status_code=201)
def enviar_mensagem_chat(
    dados: schemas.MensagemChatCreate,
    db: Session = Depends(get_db),
    aluno: models.Usuario = Depends(exigir_aluno),
):
    if aluno.oka_id is None:
        raise HTTPException(status_code=400, detail="Você precisa estar numa Oka pra usar o chat.")

    mensagem = models.MensagemChat(oka_id=aluno.oka_id, autor_id=aluno.id, texto=dados.texto.strip())
    db.add(mensagem)
    db.commit()
    db.refresh(mensagem)
    return _montar_mensagens_out(db, [mensagem])[0]


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


@router.get("/{oka_id}/alunos", response_model=list[schemas.AlunoDaOkaOut])
def listar_alunos_da_oka(
    oka_id: int,
    db: Session = Depends(get_db),
    professor: models.Usuario = Depends(exigir_professor),
):
    """
    Visão do professor por aluno: um sinal de bem-estar (sem nota — ver
    _sinal_bem_estar) e os temas que o aluno pesquisou no Ayvu (aqui sim
    individual, ao contrário do Reko: foi um pedido explícito).
    """
    oka = db.get(models.Oka, oka_id)
    if oka is None or oka.professor_id != professor.id:
        raise HTTPException(status_code=404, detail="Oka não encontrada.")

    alunos = db.execute(select(models.Usuario).where(models.Usuario.oka_id == oka_id)).scalars().all()

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

        # dedupe case-insensitive, mantendo a ordem (mais recente primeiro).
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
            schemas.AlunoDaOkaOut(
                id=aluno.id,
                nome=aluno.nome,
                sinal_bem_estar=sinal,
                frase_bem_estar=frase,
                temas_pesquisados=temas_unicos,
            )
        )

    return resultado


@router.get("/{oka_id}/chat", response_model=list[schemas.MensagemChatOut])
def listar_chat_da_oka_professor(
    oka_id: int,
    db: Session = Depends(get_db),
    professor: models.Usuario = Depends(exigir_professor),
):
    """Só leitura, pra supervisão — professor nunca manda mensagem
    (ver enviar_mensagem_chat, restrito a alunos)."""
    oka = db.get(models.Oka, oka_id)
    if oka is None or oka.professor_id != professor.id:
        raise HTTPException(status_code=404, detail="Oka não encontrada.")

    mensagens = (
        db.execute(
            select(models.MensagemChat)
            .where(models.MensagemChat.oka_id == oka_id)
            .order_by(models.MensagemChat.criado_em.desc())
            .limit(_QUANTIDADE_MENSAGENS_CHAT)
        )
        .scalars()
        .all()
    )
    return _montar_mensagens_out(db, list(reversed(mensagens)))
