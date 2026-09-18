"""Cálculo de Itás — extraído de routers/macu.py pra tanto o router de Macu
quanto o da loja (routers/loja.py) poderem usar sem import circular entre
os dois (a loja precisa saber o saldo antes de deixar comprar; o Macu expõe
o saldo em /macu/itas).

Itás (moeda/pontuação do aluno, referência a "itá" = pedra/semente em tupi)
não são um contador guardado à parte — são derivados da atividade que já
existe (check-in do Reko, conteúdo concluído no Ayvu, pesquisa feita,
desenho corrigido no Desafio de Desenho) MENOS o que já foi gasto na loja,
então não tem como "burlar" ganhando Itás sem realmente participar, nem
gastar mais do que tem. Todo aluno recém-cadastrado começa em 0 porque
ainda não tem nenhuma dessas atividades registrada.
"""

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from . import models, schemas

_ITAS_POR_CHECKIN_REKO = 10
_ITAS_POR_CONTEUDO_CONCLUIDO = 5
_ITAS_POR_PESQUISA = 2


def calcular_itas(db: Session, aluno_id: int) -> schemas.ItasOut:
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
    # O que já foi gasto na vendinha (routers/loja.py) — preco_pago fica
    # gravado por compra, não recalculado, então isso não muda se o preço
    # do item mudar depois.
    total_gasto = db.scalar(
        select(func.sum(models.ItemComprado.preco_pago)).where(models.ItemComprado.aluno_id == aluno_id)
    )

    ganho_total = (
        total_checkins * _ITAS_POR_CHECKIN_REKO
        + total_concluidos * _ITAS_POR_CONTEUDO_CONCLUIDO
        + total_pesquisas * _ITAS_POR_PESQUISA
        + (total_itas_desenhos or 0)
    )

    return schemas.ItasOut(itas_total=max(0, ganho_total - (total_gasto or 0)))
