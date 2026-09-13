"""
Popula o banco com temas/conteúdos de exemplo pro Ayvu — só o suficiente
pra demonstrar o fluxo funcionando, não é conteúdo pedagógico de verdade.

Rode a partir da pasta backend/:
    python -m app.seed
"""

import json

from .database import Base, SessionLocal, engine
from .models import Conteudo, Tema, TipoConteudo

# Placeholder — troque pela URL real do vídeo curado quando existir.
VIDEO_EXEMPLO = "https://www.youtube.com/embed/M7lc1UVf-VE"


def _quiz(pergunta, alternativas, correta, feedback_certo, feedback_errado):
    return json.dumps(
        {
            "pergunta": pergunta,
            "alternativas": alternativas,
            "correta": correta,
            "feedback_certo": feedback_certo,
            "feedback_errado": feedback_errado,
        },
        ensure_ascii=False,
    )


TEMAS_SEED = [
    {
        "nome": "Buracos negros",
        "descricao": "O que são, como se formam e por que nem a luz escapa.",
        "dentro_do_curriculo": False,
        "conteudos": [
            {
                "tipo": TipoConteudo.VIDEO,
                "titulo": "Buracos negros em 5 minutos",
                "corpo_ou_url": VIDEO_EXEMPLO,
                "ordem_sugerida": 1,
            },
            {
                "tipo": TipoConteudo.LEITURA,
                "titulo": "Por que a luz não escapa?",
                "corpo_ou_url": (
                    "Um buraco negro se forma quando uma quantidade enorme de massa "
                    "fica comprimida num espaço muito pequeno. A gravidade ali fica "
                    "tão forte que, a partir de uma certa distância — o chamado "
                    "horizonte de eventos — nem a luz consegue escapar. Não é um "
                    '"buraco" no espaço, é mais como uma região onde as regras '
                    "normais da física ficam esticadas ao extremo."
                ),
                "ordem_sugerida": 2,
            },
            {
                "tipo": TipoConteudo.JOGO,
                "titulo": "Teste rápido: horizonte de eventos",
                "corpo_ou_url": _quiz(
                    "O que é o 'horizonte de eventos' de um buraco negro?",
                    [
                        "O centro do buraco negro",
                        "A fronteira a partir da qual nada escapa, nem a luz",
                        "Uma estrela próxima ao buraco negro",
                        "O nome de um telescópio espacial",
                    ],
                    1,
                    "Isso mesmo! Depois dessa fronteira, nem a luz tem velocidade suficiente pra escapar.",
                    "Quase — o horizonte de eventos é a fronteira a partir da qual nada escapa, nem a luz.",
                ),
                "ordem_sugerida": 3,
            },
            {
                "tipo": TipoConteudo.DESAFIO,
                "titulo": "Desafio: explique com suas palavras",
                "corpo_ou_url": (
                    "Imagine que você precisa explicar o que é um buraco negro pra "
                    "alguém que nunca ouviu falar disso — pode ser um colega, um "
                    "familiar, até uma criança pequena. Escreva aqui como você "
                    "explicaria, com suas próprias palavras."
                ),
                "ordem_sugerida": 4,
            },
        ],
    },
    {
        "nome": "Como funciona a blockchain",
        "descricao": "A ideia por trás das criptomoedas, sem economês.",
        "dentro_do_curriculo": False,
        "conteudos": [
            {
                "tipo": TipoConteudo.VIDEO,
                "titulo": "Blockchain explicada de forma simples",
                "corpo_ou_url": VIDEO_EXEMPLO,
                "ordem_sugerida": 1,
            },
            {
                "tipo": TipoConteudo.LEITURA,
                "titulo": "Um livro-razão que todo mundo pode conferir",
                "corpo_ou_url": (
                    "Pensa numa planilha compartilhada que ninguém consegue apagar "
                    "ou editar escondido — só adicionar novas linhas, e todo mundo "
                    "que participa tem uma cópia. É mais ou menos isso que uma "
                    "blockchain é: um registro de transações organizado em blocos, "
                    'onde cada bloco novo carrega uma "impressão digital" do bloco '
                    "anterior, tornando muito difícil forjar o histórico."
                ),
                "ordem_sugerida": 2,
            },
            {
                "tipo": TipoConteudo.JOGO,
                "titulo": "Teste rápido: o que muda numa blockchain",
                "corpo_ou_url": _quiz(
                    "O que torna difícil alterar um registro antigo numa blockchain?",
                    [
                        "Ela fica guardada só num computador central",
                        "Cada bloco novo depende do anterior, e todos têm uma cópia",
                        "Só o governo pode alterar os dados",
                        "Os registros são apagados a cada 24 horas",
                    ],
                    1,
                    "Exatamente! Mudar um bloco antigo quebraria a cadeia toda — e todo mundo tem uma cópia pra comparar.",
                    "Quase — o que protege o histórico é que cada bloco depende do anterior, e todos os participantes têm uma cópia.",
                ),
                "ordem_sugerida": 3,
            },
        ],
    },
    {
        "nome": "Por que sonhamos",
        "descricao": "O que a ciência já entendeu (e o que ainda é mistério) sobre os sonhos.",
        "dentro_do_curriculo": False,
        "conteudos": [
            {
                "tipo": TipoConteudo.LEITURA,
                "titulo": "O sono também trabalha",
                "corpo_ou_url": (
                    "Durante o sono REM — a fase em que mais sonhamos — o cérebro "
                    "fica quase tão ativo quanto quando estamos acordados. Uma das "
                    "hipóteses mais aceitas é que os sonhos ajudam a consolidar "
                    "memórias e processar emoções do dia, meio que uma faxina e "
                    "organização do que vivemos."
                ),
                "ordem_sugerida": 1,
            },
            {
                "tipo": TipoConteudo.JOGO,
                "titulo": "Teste rápido: sono REM",
                "corpo_ou_url": _quiz(
                    "Em qual fase do sono ocorrem os sonhos mais vívidos?",
                    [
                        "Sono profundo",
                        "Sono REM",
                        "Cochilo rápido",
                        "Os primeiros 5 minutos de sono",
                    ],
                    1,
                    "Isso mesmo! É durante o sono REM que o cérebro fica mais ativo e os sonhos ficam mais vívidos.",
                    "Quase — é durante o sono REM que isso acontece.",
                ),
                "ordem_sugerida": 2,
            },
            {
                "tipo": TipoConteudo.DESAFIO,
                "titulo": "Desafio: registre um sonho",
                "corpo_ou_url": (
                    "Na próxima vez que lembrar de um sonho (mesmo que seja só um "
                    "pedacinho), escreva aqui o que você lembra. Não precisa "
                    "interpretar nada, só registrar."
                ),
                "ordem_sugerida": 3,
            },
        ],
    },
    {
        "nome": "A história por trás de um prato típico brasileiro",
        "descricao": "De onde vêm os ingredientes e as histórias da nossa comida.",
        "dentro_do_curriculo": False,
        "conteudos": [
            {
                "tipo": TipoConteudo.VIDEO,
                "titulo": "A origem da feijoada",
                "corpo_ou_url": VIDEO_EXEMPLO,
                "ordem_sugerida": 1,
            },
            {
                "tipo": TipoConteudo.LEITURA,
                "titulo": "Muito mais que um prato",
                "corpo_ou_url": (
                    "A feijoada é um exemplo de como a culinária carrega história: "
                    "ela mistura tradições indígenas, africanas e portuguesas, e "
                    "foi se transformando ao longo dos séculos até virar um dos "
                    "pratos mais associados ao Brasil hoje."
                ),
                "ordem_sugerida": 2,
            },
            {
                "tipo": TipoConteudo.DESAFIO,
                "titulo": "Desafio: pesquise um prato da sua família",
                "corpo_ou_url": (
                    "Pergunte pra alguém da sua família (ou pesquise) sobre a "
                    "origem de um prato que é comum na sua casa. Escreva aqui o "
                    "que você descobriu."
                ),
                "ordem_sugerida": 3,
            },
        ],
    },
    {
        "nome": "A Revolução Industrial",
        "descricao": "Como as máquinas mudaram o jeito de viver, trabalhar e produzir.",
        "dentro_do_curriculo": True,
        "conteudos": [
            {
                "tipo": TipoConteudo.VIDEO,
                "titulo": "A Revolução Industrial em poucos minutos",
                "corpo_ou_url": VIDEO_EXEMPLO,
                "ordem_sugerida": 1,
            },
            {
                "tipo": TipoConteudo.LEITURA,
                "titulo": "Da mão de obra às máquinas",
                "corpo_ou_url": (
                    "A partir do século 18, máquinas movidas a vapor começaram a "
                    "substituir parte do trabalho manual nas fábricas. Isso mudou "
                    "não só a economia, mas também onde e como as pessoas viviam — "
                    "muita gente saiu do campo para trabalhar nas cidades "
                    "industriais que estavam crescendo."
                ),
                "ordem_sugerida": 2,
            },
            {
                "tipo": TipoConteudo.JOGO,
                "titulo": "Teste rápido: o motor da mudança",
                "corpo_ou_url": _quiz(
                    "Qual invenção é mais associada ao início da Revolução Industrial?",
                    [
                        "O motor a combustão",
                        "A máquina a vapor",
                        "A eletricidade",
                        "O computador",
                    ],
                    1,
                    "Isso mesmo! A máquina a vapor foi central pra transformar a produção nas fábricas.",
                    "Quase — a máquina a vapor é a invenção mais associada a esse período.",
                ),
                "ordem_sugerida": 3,
            },
        ],
    },
]


def popular():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(Tema).count() > 0:
            print("Já existem temas no banco — nada foi alterado.")
            return

        for tema_dado in TEMAS_SEED:
            tema = Tema(
                nome=tema_dado["nome"],
                descricao=tema_dado["descricao"],
                dentro_do_curriculo=tema_dado["dentro_do_curriculo"],
                conteudos=[Conteudo(**c) for c in tema_dado["conteudos"]],
            )
            db.add(tema)

        db.commit()
        print(f"{len(TEMAS_SEED)} temas inseridos.")
    finally:
        db.close()


if __name__ == "__main__":
    popular()
