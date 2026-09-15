# AYVU: educação que escuta

Projeto de solução para a décima edição do hackathon do Hacktudo, cujo tema foi: *"Como construir uma relação mais consciente entre tecnologia e educação em um mundo cada vez mais conectado e cheio de distrações"*. Finalista entre os 10 melhores projetos, dentre 200 grupos participantes.

🔗 **MVP em produção:** https://ayvu-omega.vercel.app/

---

## O paradoxo

Vivemos a contradição de uma geração hiperconectada e hiperdistraída: o celular deu acesso a todo o conhecimento do mundo, mas as redes sociais sequestram justamente o recurso que sustenta o aprendizado, a atenção. A resposta mais comum no Brasil tem sido regulatória (vários estados já restringiram ou baniram o celular em sala de aula), mas isso ataca o sintoma, não a causa.

O AYVU parte de uma pergunta diferente: em vez de disputar com essa tecnologia, como usá-la a favor da educação?

## O que é o AYVU

**AYVU** significa "voz da alma" na tradição guarani, para eles, a palavra tem uma dimensão sagrada de manifestação do ser. A plataforma propõe justamente isso ao aluno: um espaço para despertar e expressar sua própria voz interior.

O **Ayvu é a própria ilha**  o espaço central e explorável da plataforma, que dá nome ao projeto inteiro. É dentro dela que vivem os outros pilares:

### Macu - como você se expressa
Um avatar personalizável que representa a identidade do aluno dentro da plataforma, com sprites em pixel art no estilo LPC (cabelo, pele, roupas, acessórios combináveis). O aluno controla o Macu livremente pela ilha.

### Reko - como você está
Um check-in diário e leve, baseado no framework CASEL (Collaborative for Academic, Social, and Emotional Learning), que mapeia o aluno em 5 competências socioemocionais:
- **Autoconhecimento**
- **Autogestão**
- **Consciência social**
- **Habilidades de relacionamento**
- **Tomada de decisão responsável**

Esse dado nunca é exposto entre os alunos e não aparece ao professor como número individual bruto, ele alimenta um perfil agregado por turma (com piso mínimo de respondentes), usado pela equipe pedagógica como indicativo estratégico.

### Oka - onde você habita *(em desenvolvimento)*
Cada aluno terá sua própria Oka (casa, em referência à moradia tradicional indígena), personalizável e visitável por outros colegas. As Okas ficam distribuídas ao redor da ilha principal, com uma fogueira central, reforçando visualmente a ideia de comunidade. O aluno anda livremente até a Oka de outro colega para visitá-la.

### Ilhas de exploração - o que te move *(planejado)*
O núcleo de exploração de conhecimento: o professor cria um link para o seu Ayvu com desafios que testam o que está sendo ensinado, dentro ou fora do currículo formal. O aluno entra na ilha de um professor, explora os desafios propostos, e ganha **pontos** ao completá-los. Esses pontos são usados para comprar itens personalizáveis para o Macu e para a Oka, ligando diretamente o aprendizado à expressão pessoal do aluno na plataforma.

## O diferencial

O AYVU não compete com o celular pela atenção do aluno, mas recria, dentro de um ambiente pedagógico e protegido, os mesmos mecanismos que tornam as redes sociais tão envolventes (identidade, progressão, exploração, pertencimento), mas redireciona esses mecanismos para autoconhecimento, bem-estar e curiosidade genuína, em vez de comparação social e validação externa. Não há ranking entre alunos, não há exposição pública de desempenho.

Para a escola, o valor está no cruzamento inédito entre camadas de dado que normalmente vivem separadas (expressão pessoal, estado socioemocional e engajamento com o conteúdo) devolvidas ao professor como inteligência pedagógica acionável, de forma ética e agregada.

## Stack

**Backend:**
- Python + FastAPI
- SQLAlchemy 2.0 (ORM)
- Pydantic v2 (validação)
- PyJWT (autenticação por token)
- PBKDF2-HMAC-SHA256 (hash de senha, stdlib)
- PostgreSQL hospedado no Supabase

**Frontend:**
- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- TanStack Query (chamadas à API / estado de servidor)
- React Router (navegação)
- Framer Motion (animações)

## Estrutura do repositório
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

Sem um `DATABASE_URL` configurado (Postgres/Supabase), o backend cai automaticamente para SQLite local, não precisa de nenhum setup extra pra rodar.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

O Vite já vem configurado com proxy para `http://127.0.0.1:8000`, então o frontend em `localhost:5173` fala com o backend sem configuração extra de CORS/URL.

## Time

- Enzo Trotto - Desenvolvedor e neurocientista em formação.
- Gabriel Fassini - Psicólogo em formação com interesse em IA e neurociências.

---

*Projeto desenvolvido durante o Hacktudo.*
