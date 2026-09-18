from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import exigir_aluno
from ..itas import calcular_itas

router = APIRouter(prefix="/loja", tags=["loja"])

# Preços em Itás — fácil de ajustar o equilíbrio econômico sem mexer no
# resto da lógica (mesmo padrão de _ITAS_POR_PONTO_DE_NOTA em desafios.py).
_PRECO_ROUPA = 10
_PRECO_ACESSORIO = 15
_PRECO_PAREDE = 15
_PRECO_CHAO = 15
_PRECO_ITEM_CENTRAL = 20

# Espelha (não importa, o backend não lê TS) os catálogos do frontend —
# frontend/src/features/macu/lpcData.ts::CORES_DE_ROUPA e
# frontend/src/features/oka/ocaData.ts::CORES_PAREDE/CORES_CHAO/ITENS_CENTRAIS.
# Os valores já GRÁTIS por padrão (AVATAR_PADRAO e o _padrao() de oca.py)
# ficam de fora do catálogo comprável de propósito. _CAMPO_TIPO mapeia cada
# campo pro "tipo" (macu/oka) — usado tanto pra montar o id do item quanto
# pra validar posse em routers/macu.py e routers/oca.py.
_CAMPO_TIPO = {
    "shirtColor": "macu",
    "pantsColor": "macu",
    "shoeColor": "macu",
    "usaOculos": "macu",
    "cor_parede": "oka",
    "cor_chao": "oka",
    "item_central": "oka",
}

_CORES_ROUPA = [
    ("black", "Preto"),
    ("navy", "Azul-marinho"),
    ("gray", "Cinza"),
    ("brown", "Marrom"),
    ("forest", "Verde"),
    ("maroon", "Vinho"),
    ("teal", "Azul-petróleo"),
    ("white", "Branco"),
]
_ROUPA_GRATIS = {"shirtColor": "navy", "pantsColor": "brown", "shoeColor": "black"}
_CAMPOS_ROUPA = ["shirtColor", "pantsColor", "shoeColor"]

# Acessório desenhado por cima do Macu (ver AvatarStage.tsx) — não é uma
# cor/enum como os outros, é um booleano ("tem óculos ou não"), mas guardado
# no catálogo com o mesmo formato (campo/valor) pra reaproveitar a mesma
# validação de posse; "valor" aqui é só a string "true" por convenção.
_ACESSORIOS_MACU = [
    ("usaOculos", "true", "Óculos de sol"),
]

_CORES_PAREDE = [
    ("c2a35f", "Palha"),
    ("8a6a4a", "Barro"),
    ("a15c38", "Terracota"),
    ("6b4423", "Madeira escura"),
    ("d9c48f", "Bambu"),
]
_PAREDE_GRATIS = "c2a35f"

_CORES_CHAO = [
    ("7a5636", "Terra"),
    ("4a3c2c", "Terra escura"),
    ("9c8352", "Areia"),
    ("5c7a4a", "Grama"),
]
_CHAO_GRATIS = "7a5636"

_ITENS_CENTRAIS = [
    ("nenhum", "Nenhum"),
    ("fogueira", "Fogueira"),
    ("cesto", "Cesto"),
    ("banco", "Banco"),
    ("planta", "Vaso de planta"),
]
_ITEM_CENTRAL_GRATIS = "nenhum"


def _montar_catalogo() -> list[schemas.ItemLojaOut]:
    itens: list[schemas.ItemLojaOut] = []

    for campo in _CAMPOS_ROUPA:
        for valor, rotulo in _CORES_ROUPA:
            if valor == _ROUPA_GRATIS[campo]:
                continue
            itens.append(
                schemas.ItemLojaOut(
                    id=f"macu.{campo}.{valor}",
                    tipo="macu",
                    campo=campo,
                    valor=valor,
                    preco=_PRECO_ROUPA,
                    rotulo=rotulo,
                )
            )

    for campo, valor, rotulo in _ACESSORIOS_MACU:
        itens.append(
            schemas.ItemLojaOut(
                id=f"macu.{campo}.{valor}", tipo="macu", campo=campo, valor=valor, preco=_PRECO_ACESSORIO, rotulo=rotulo
            )
        )

    for valor, rotulo in _CORES_PAREDE:
        if valor == _PAREDE_GRATIS:
            continue
        itens.append(
            schemas.ItemLojaOut(
                id=f"oka.cor_parede.{valor}", tipo="oka", campo="cor_parede", valor=valor, preco=_PRECO_PAREDE, rotulo=rotulo
            )
        )

    for valor, rotulo in _CORES_CHAO:
        if valor == _CHAO_GRATIS:
            continue
        itens.append(
            schemas.ItemLojaOut(
                id=f"oka.cor_chao.{valor}", tipo="oka", campo="cor_chao", valor=valor, preco=_PRECO_CHAO, rotulo=rotulo
            )
        )

    for valor, rotulo in _ITENS_CENTRAIS:
        if valor == _ITEM_CENTRAL_GRATIS:
            continue
        itens.append(
            schemas.ItemLojaOut(
                id=f"oka.item_central.{valor}",
                tipo="oka",
                campo="item_central",
                valor=valor,
                preco=_PRECO_ITEM_CENTRAL,
                rotulo=rotulo,
            )
        )

    return itens


_CATALOGO = _montar_catalogo()
_CATALOGO_POR_ID = {item.id: item for item in _CATALOGO}


def item_esta_liberado(campo: str, valor: str, item_ids_comprados: set[str]) -> bool:
    """Usado por routers/macu.py e routers/oca.py pra validar, na hora de
    salvar, se um valor não-grátis foi de fato comprado. Valor grátis (não
    existe no catálogo comprável pra esse campo) sempre passa."""
    item_id = f"{_CAMPO_TIPO.get(campo, 'oka')}.{campo}.{valor}"
    if item_id not in _CATALOGO_POR_ID:
        return True  # não é um valor vendável (ex: o próprio valor grátis) — sempre liberado
    return item_id in item_ids_comprados


def ids_comprados(db: Session, aluno_id: int) -> set[str]:
    linhas = db.execute(
        select(models.ItemComprado.item_id).where(models.ItemComprado.aluno_id == aluno_id)
    ).scalars()
    return set(linhas)


@router.get("/itens", response_model=list[schemas.ItemLojaOut])
def listar_itens(
    aluno: models.Usuario = Depends(exigir_aluno),
):
    return _CATALOGO


@router.get("/minhas-compras", response_model=list[str])
def minhas_compras(
    db: Session = Depends(get_db),
    aluno: models.Usuario = Depends(exigir_aluno),
):
    return sorted(ids_comprados(db, aluno.id))


@router.post("/comprar", response_model=schemas.CompraOut, status_code=201)
def comprar(
    dados: schemas.CompraPayload,
    db: Session = Depends(get_db),
    aluno: models.Usuario = Depends(exigir_aluno),
):
    item = _CATALOGO_POR_ID.get(dados.item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Item não encontrado.")

    ja_tem = db.execute(
        select(models.ItemComprado.id).where(
            models.ItemComprado.aluno_id == aluno.id,
            models.ItemComprado.item_id == item.id,
        )
    ).scalar_one_or_none()
    if ja_tem is not None:
        raise HTTPException(status_code=400, detail="Você já tem esse item.")

    itas_atuais = calcular_itas(db, aluno.id).itas_total
    if itas_atuais < item.preco:
        raise HTTPException(status_code=400, detail="Você não tem Itás suficientes pra esse item.")

    compra = models.ItemComprado(aluno_id=aluno.id, item_id=item.id, preco_pago=item.preco)
    db.add(compra)
    db.commit()

    return schemas.CompraOut(item_id=item.id, preco_pago=item.preco, itas_restantes=itas_atuais - item.preco)
