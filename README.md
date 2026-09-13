# AYVU: educação que escuta

Projeto de solução para a décima edição do hackathon do Hacktudo, cujo tema foi: *"Como construir uma relação mais consciente entre tecnologia e educação em um mundo cada vez mais conectado e cheio de distrações"*.

---

## O paradoxo

Vivemos a contradição de uma geração hiperconectada e hiperdistraída: o celular deu acesso a todo o conhecimento do mundo, mas as redes sociais sequestram justamente o recurso que sustenta o aprendizado, a atenção. A resposta mais comum no Brasil tem sido regulatória (vários estados já restringiram ou baniram o celular em sala de aula), mas isso ataca o sintoma, não a causa.

O AYVU parte de uma pergunta diferente: em vez de disputar com essa tecnologia, como usá-la a favor da educação?

## O que é o AYVU

**AYVU** significa "voz da alma" na tradição guarani, para eles, a palavra tem uma dimensão sagrada de manifestação do ser. A plataforma propõe justamente isso ao aluno: um espaço para despertar e expressar sua própria voz interior, através de alguns pilares.

### Macu - como você se expressa
Um avatar personalizável (estilo pixel art) que representa a identidade do aluno dentro da plataforma. É a camada de expressão visual e pessoal, o aluno escolhe tom de pele, cabelo, roupas e mais, e leva esse avatar consigo pela plataforma inteira.

### Reko - como você está
Um check-in diário e leve, feito em poucos toques, que mapeia o aluno nas cinco competências socioemocionais do modelo CASEL:
- **Autoconhecimento**
- **Autogestão**
- **Consciência social**
- **Relacionamento**
- **Decisão responsável**

Esse dado nunca é exposto entre os alunos. Para o professor, ele nunca aparece como nota individual bruta, no máximo um **sinal de bem-estar** qualitativo por aluno (🙂 Bem / 😐 Neutro / 💛 Atenção / - Sem dados), e um agregado estatístico da Oka inteira (só exibido a partir de um mínimo de check-ins, pra proteger a identidade de quem respondeu).

### Ayvu (Lagoa) - o que te move
O núcleo de exploração livre: o aluno escolhe um tema de interesse, dentro ou fora do currículo formal, e mergulha nele em profundidade, em seu próprio ritmo: vídeos, leituras, jogos e desafios, tudo dentro de uma cena interativa (a Lagoa), com o Macu do aluno navegando entre as ilhas de conteúdo. Isso inclui temas que a escola tradicional cobre mal ou tarde.

## Okas 

O quarto pilar do AYVU é a sala de aula em si, chamada de **Oka**. Um professor cria uma Oka e recebe um código de convite; os alunos entram nela a partir do login, informando esse código. A partir daí:

- O professor enxerga, por aluno, o **sinal de bem-estar** do Reko (nunca a nota bruta) e os **temas que ele pesquisou** na Lagoa — dado individual, pensado como inteligência pedagógica acionável.
- O professor tem acesso ao **boletim** de cada aluno: pode lançar notas (disciplina, prova, nota, data) e consultar o histórico.
- O aluno enxerga o próprio boletim, e uma página **Oka** com os colegas da mesma sala - só nome e Macu de cada um, sem sinal de bem-estar nem temas pesquisados (isso continua privado, visível só ao professor).

## O diferencial

O AYVU não compete com o celular pela atenção do aluno, ele recria, dentro de um ambiente pedagógico e protegido, os mesmos mecanismos que tornam as redes sociais tão envolventes (identidade, progressão, exploração), mas redireciona esses mecanismos para autoconhecimento, bem-estar e curiosidade genuína, em vez de comparação social e validação externa. Não há ranking entre alunos, não há exposição pública de desempenho.

Para a escola, o valor está no cruzamento inédito entre três camadas de dado que normalmente vivem separadas: expressão pessoal, estado emocional/social e interesses genuínos, devolvidas ao professor como inteligência pedagógica acionável, de forma ética e com os limites de privacidade certos para cada dado.

## Stack

- **Backend:** Python + FastAPI, SQLAlchemy 2.0, Pydantic v2, autenticação JWT (PyJWT) com senha em PBKDF2, busca de vídeos via yt-dlp
- **Banco de dados:** PostgreSQL (via Supabase), com fallback automático pra SQLite em desenvolvimento local sem `DATABASE_URL`
- **Frontend:** React 19 + TypeScript + Vite, Tailwind CSS v4, TanStack Query, React Router, Framer Motion
- **Avatar (Macu):** sprites pixel art no estilo LPC (Liberated Pixel Cup), compostos em `<canvas>`

## Estrutura do repositório

```
AYVU/
├── backend/
│   └── app/
│       ├── main.py           # app FastAPI, CORS, tratamento de erro
│       ├── database.py       # engine/sessão (Postgres via Supabase, fallback SQLite)
│       ├── models.py         # Usuario, Oka, RekoCheckin, Nota, Tema, Conteudo, Progresso...
│       ├── schemas.py        # schemas Pydantic (request/response)
│       ├── security.py       # hash de senha (PBKDF2) e JWT
│       ├── deps.py           # dependências de autenticação/rota
│       ├── seed.py           # dados iniciais (temas, conteúdos)
│       └── routers/
│           ├── auth.py       # cadastro e login
│           ├── macu.py       # avatar do aluno
│           ├── reko.py       # check-in e agregado por Oka
│           ├── ayvu.py       # temas, conteúdos, progresso, busca de vídeo
│           ├── okas.py       # criar/entrar/listar Oka, colegas, alunos
│           └── notas.py      # boletim
├── frontend/
│   └── src/
│       ├── features/
│       │   ├── auth/         # login e cadastro
│       │   ├── macu/         # personalização do avatar
│       │   ├── reko/         # check-in diário
│       │   ├── ayvu/lagoa/   # cena de exploração livre
│       │   ├── oka/          # colegas da mesma Oka
│       │   ├── boletim/      # notas do aluno
│       │   ├── professor/    # painel do professor (Okas + boletim)
│       │   └── dashboard/    # tela inicial do aluno
│       ├── components/       # UI e layout compartilhados
│       ├── lib/               # apiClient.ts (client HTTP único) e authStorage
│       └── types/             # tipos espelhando os schemas do backend
└── README.md
```

## Como rodar localmente

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # (Windows) ou source venv/bin/activate no Linux/Mac
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

Sem um `DATABASE_URL` configurado (Postgres/Supabase), o backend cai automaticamente para SQLite local — não precisa de nenhum setup extra pra rodar.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

O Vite já vem configurado com proxy para `http://127.0.0.1:8000`, então o frontend em `localhost:5173` fala com o backend sem configuração extra de CORS/URL.

## Time

- Enzo Trotto - Desenvolvedor e neurocientista em formação.
- Gabriel Fassini - Psicólogo com interesse em IA.

---

*Projeto desenvolvido durante o Hacktudo.*
