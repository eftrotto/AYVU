# AYVU: educação que escuta

Projeto de solução para a décima edição do hackathon do Hacktudo, cujo tema foi: *"Como construir uma relação mais consciente entre tecnologia e educação em um mundo cada vez mais conectado e cheio de distrações"*. Finalista entre os 10 melhores projetos, dentre 200 grupos participantes.

🔗 **MVP em produção:** https://ayvu-omega.vercel.app/

---

## O paradoxo

Vivemos a contradição de uma geração hiperconectada e hiperdistraída: o celular deu acesso a todo o conhecimento do mundo, mas as redes sociais sequestram justamente o recurso que sustenta o aprendizado, a atenção. A resposta mais comum no Brasil tem sido regulatória (vários estados já restringiram ou baniram o celular em sala de aula), mas isso ataca o sintoma, não a causa.

O AYVU parte de uma pergunta diferente: em vez de disputar com essa tecnologia, como usá-la a favor da educação?

## O que é o AYVU

**AYVU** significa "voz da alma" na tradição guarani, para eles, a palavra tem uma dimensão sagrada de manifestação do ser. A plataforma propõe justamente isso ao aluno: um espaço para despertar e expressar sua própria voz interior.

O **Ayvu é a própria ilha**, o espaço central e explorável da plataforma, que dá nome ao projeto inteiro. Nela, o aluno joga uma pergunta na lagoa (uma busca) e mergulha atrás dela pra aprender — o "jogar uma pergunta no lago" que batiza a mecânica central de exploração. É dentro dela que vivem os outros pilares:

### Macu - como você se expressa
Um avatar personalizável que representa a identidade do aluno dentro da plataforma, com sprites em pixel art no estilo LPC (cabelo, pele, roupas, acessórios combináveis). O aluno controla o Macu livremente pela ilha, e parte das opções de personalização (cores de roupa, óculos de sol) é liberada comprando na Vendinha.

### Reko - como você está
Um check-in diário e leve, baseado no framework CASEL (Collaborative for Academic, Social, and Emotional Learning), que mapeia o aluno em 5 competências socioemocionais:
- **Autoconhecimento**
- **Autogestão**
- **Consciência social**
- **Habilidades de relacionamento**
- **Tomada de decisão responsável**

Esse dado nunca é exposto entre os alunos e não aparece ao professor como número individual bruto, ele alimenta um perfil agregado por turma (com piso mínimo de respondentes), usado pela equipe pedagógica como indicativo estratégico.

### Oka - onde você habita
Cada aluno tem sua própria Oka (casa, em referência à moradia tradicional indígena), com fachada em estilo "dollhouse" (paredes e porta transparentes revelando o interior) e o Macu andando livre lá dentro. A decoração (cor da parede, cor do chão, item central — fogueira, cesto, banco, vaso de planta) é personalizável na Vendinha.

### Ilha do professor - a turma
O professor cria uma ilha (turma) e compartilha um código de convite; o aluno entra digitando esse código. Dentro dela:
- **Presença ao vivo** — todo mundo que está na ilha agora aparece se movendo em tempo real (via polling), incluindo o próprio professor, representado por um Pajé.
- **Desafio de Desenho** — o professor lança um tema com um tempo limite; os alunos desenham num canvas e enviam; o professor corrige e atribui uma nota, que também concede Itás.
- **Boletim** — o professor lança notas por disciplina/prova; o aluno acompanha as suas.
- **Chat da turma** — conversa em grupo entre os alunos da mesma ilha, supervisionada pelo professor.
- **Painel de bem-estar** — visão agregada (nunca individual bruta) do Reko da turma, com sinal de atenção por aluno baseado em padrões, não em números expostos.

### Itás - a moeda que não dá pra burlar
Itás são a "moeda" do aluno, mas não existe um saldo guardado em lugar nenhum: ela é sempre **calculada na hora**, somando atividade real (check-in do Reko, conteúdo concluído no Ayvu, pesquisa feita, nota dada num Desafio de Desenho) e subtraindo o que já foi gasto na Vendinha. Não tem como ganhar Itás sem participar de verdade, nem gastar mais do que se tem.

### Vendinha - lojinha da ilha do aluno
Uma barraquinha na própria ilha do aluno (separada da ilha do professor) onde ele gasta Itás pra desbloquear personalizações do Macu (cores de roupa, óculos de sol) e da Oka (parede, chão, item central). Comprar já equipa na hora — sem passo extra — e a posse fica salva permanentemente no banco.

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

```
AYVU/
├── backend/
│   └── app/
│       ├── main.py        # app FastAPI, CORS, erros
│       ├── database.py    # engine/sessão (Postgres/Supabase, fallback SQLite)
│       ├── models.py      # Usuario, Oka, RekoCheckin, MacuAvatar, OkaPessoal,
│       │                  # PresencaIlha, Nota, MensagemChat, DesafioDesenho,
│       │                  # DesenhoEnviado, ItemComprado, Tema, Conteudo...
│       ├── schemas.py     # schemas Pydantic
│       ├── security.py    # hash de senha (PBKDF2) e JWT
│       ├── deps.py        # dependências de auth/rota
│       ├── itas.py        # cálculo derivado do saldo de Itás (ganho - gasto)
│       ├── seed.py        # dados iniciais
│       └── routers/
│           ├── auth.py     # cadastro e login
│           ├── macu.py     # avatar do aluno e do professor, saldo de Itás
│           ├── oca.py      # Oka pessoal do aluno (decoração)
│           ├── reko.py     # check-in e agregado por turma
│           ├── ayvu.py     # temas, conteúdos, progresso, pesquisas
│           ├── okas.py     # criar/entrar/listar turma, presença ao vivo, chat
│           ├── desafios.py # Desafio de Desenho (criar, enviar, corrigir)
│           ├── loja.py     # catálogo e compras da Vendinha
│           └── notas.py    # boletim
├── frontend/
│   └── src/
│       ├── features/
│       │   ├── auth/
│       │   ├── macu/         # avatar (AvatarStage), Pajé do professor
│       │   ├── reko/
│       │   ├── ayvu/lagoa/    # a ilha do aluno (LagoaCena) e desafio de desenho
│       │   ├── oka/           # Oka pessoal e chat da turma
│       │   ├── ilha/          # decorações da ilha (Fogueira, Cavalete, Vendinha)
│       │   ├── loja/          # modal da Vendinha
│       │   ├── desenho/       # canvas do Desafio de Desenho
│       │   ├── boletim/
│       │   ├── professor/     # dashboard, ilha ao vivo
│       │   └── dashboard/
│       ├── components/
│       ├── lib/            # apiClient.ts, authStorage
│       └── types/
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

## Roadmap

- [x] Macu — avatar personalizável (sprites LPC)
- [x] Reko — check-in diário CASEL, com agregação por turma
- [x] Ayvu — ilha explorável, com movimentação livre do Macu
- [x] Oka — casa personalizável e visitável de cada aluno
- [x] Ilha do professor — turma com código de convite, presença ao vivo e chat
- [x] Desafio de Desenho — desafios com correção do professor
- [x] Itás — moeda derivada da atividade real, sem saldo gameável
- [x] Vendinha — loja de personalização do Macu e da Oka
- [ ] Mais conteúdo curado no Ayvu (temas, vídeos, jogos)
- [ ] Mais itens/roupas na Vendinha

## Time

- Enzo Trotto - Desenvolvedor e neurocientista em formação.
- Gabriel Fassini - Psicólogo em formação com interesse em IA e neurociências.

---

*Projeto desenvolvido durante o Hacktudo.*
