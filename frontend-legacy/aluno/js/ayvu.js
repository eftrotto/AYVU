'use strict';

/*
 * Ayvu — núcleo de exploração livre de temas (AYVU).
 * O aluno escolhe um tema e explora vídeos/jogos/leitura/desafios na ordem
 * que quiser. Sem ranking, sem tempo, sem exposição de desempenho.
 */

// Se este HTML for aberto direto (file://) em vez de servido pelo FastAPI,
// troque a linha abaixo por algo como 'http://localhost:8000'.
const AYVU_API_BASE = '';

const STORAGE_KEY_USER_ID = 'ayvu_user_id';
const STORAGE_KEY_PENDENTES = 'ayvu_progresso_pendentes';
const STORAGE_KEY_DESAFIOS = 'ayvu_desafios_respostas';

const TIPOS = [
  { chave: 'video', rotulo: 'Vídeos', icone: '🎬' },
  { chave: 'jogo', rotulo: 'Jogos', icone: '🎲' },
  { chave: 'leitura', rotulo: 'Leitura', icone: '📖' },
  { chave: 'desafio', rotulo: 'Desafios', icone: '🧭' },
];

let temas = [];
let progresso = []; // [{ conteudo_id, tema_id, concluido }]
let temaAtual = null;
let abaAtiva = 'video';
let conteudoAtual = null;

// ---------------------------------------------------------------------------
// Identidade local (até existir login de verdade)
// ---------------------------------------------------------------------------

function obterUsuarioIdLocal() {
  // Ainda não existe login/matrícula no AYVU. Diferente do Macu/Reko (que
  // usam um placeholder nulo, porque só enviam dado e nunca precisam
  // reler por aluno), o Ayvu PRECISA buscar o progresso de volta por
  // user_id (GET /ayvu/progresso/{user_id}) pra montar os indicadores de
  // progresso — um valor sempre nulo misturaria o progresso de todo
  // mundo. Por isso geramos um id local por navegador/dispositivo aqui.
  // Isso NÃO é autenticação: é só o suficiente pra não misturar o
  // progresso de alunos diferentes nesta demo.
  let id = localStorage.getItem(STORAGE_KEY_USER_ID);
  if (!id) {
    id = String(Math.floor(Math.random() * 1_000_000_000));
    localStorage.setItem(STORAGE_KEY_USER_ID, id);
  }
  return Number(id);
}

const usuarioId = obterUsuarioIdLocal();

// ---------------------------------------------------------------------------
// Dados (temas, detalhe do tema, progresso)
// ---------------------------------------------------------------------------

async function carregarTemas() {
  try {
    const resposta = await fetch(`${AYVU_API_BASE}/ayvu/temas`);
    temas = resposta.ok ? await resposta.json() : [];
  } catch (erro) {
    console.warn('Não foi possível carregar os temas agora.', erro);
    temas = [];
  }
}

async function carregarProgresso() {
  try {
    const resposta = await fetch(`${AYVU_API_BASE}/ayvu/progresso/${usuarioId}`);
    const dados = resposta.ok ? await resposta.json() : null;
    progresso = dados?.itens ?? [];
  } catch (erro) {
    console.warn('Não foi possível carregar o progresso agora.', erro);
    progresso = [];
  }
}

async function carregarDetalheTema(id) {
  const resposta = await fetch(`${AYVU_API_BASE}/ayvu/temas/${id}`);
  if (!resposta.ok) {
    throw new Error(`Não foi possível carregar este tema (status ${resposta.status}).`);
  }
  return resposta.json();
}

function conteudoEstaConcluido(conteudoId) {
  return progresso.some((item) => item.conteudo_id === conteudoId && item.concluido);
}

function atualizarProgressoLocal(conteudoId, concluido) {
  const existente = progresso.find((item) => item.conteudo_id === conteudoId);
  if (existente) {
    existente.concluido = concluido;
  } else if (temaAtual) {
    progresso.push({ conteudo_id: conteudoId, tema_id: temaAtual.id, concluido });
  }
}

function salvarProgressoPendente(payload) {
  const pendentes = JSON.parse(localStorage.getItem(STORAGE_KEY_PENDENTES) || '[]');
  pendentes.push(payload);
  localStorage.setItem(STORAGE_KEY_PENDENTES, JSON.stringify(pendentes));
  // TODO: quando houver uma rotina de sincronização (ex.: ao reabrir o app
  // com internet), ler essa fila, reenviar cada item pra POST
  // /ayvu/progresso e só então limpá-la — mesmo padrão usado no Reko.
}

async function marcarProgresso(conteudoId, concluido) {
  const payload = { user_id: usuarioId, conteudo_id: conteudoId, concluido };

  try {
    const resposta = await fetch(`${AYVU_API_BASE}/ayvu/progresso`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!resposta.ok) {
      throw new Error(`Falha ao salvar progresso (status ${resposta.status})`);
    }
  } catch (erro) {
    console.warn('Não foi possível salvar o progresso agora. Guardando localmente.', erro);
    salvarProgressoPendente(payload);
  }

  atualizarProgressoLocal(conteudoId, concluido);
}

// ---------------------------------------------------------------------------
// Registro local das respostas de desafio (texto livre)
//
// O backend hoje só registra "concluído" (ver models.ProgressoAluno) — não
// existe campo pra guardar o texto do desafio no servidor, isso não estava
// no modelo de dados pedido. Por enquanto o texto fica só aqui no
// localStorage; se no futuro isso precisar ser visto pela equipe
// pedagógica ou sincronizado entre dispositivos, ProgressoAluno vai
// precisar de uma coluna de texto (fora do escopo de hoje).
// ---------------------------------------------------------------------------

function obterRespostaDesafioLocal(conteudoId) {
  const todas = JSON.parse(localStorage.getItem(STORAGE_KEY_DESAFIOS) || '{}');
  return todas[conteudoId] || '';
}

function salvarRespostaDesafioLocal(conteudoId, texto) {
  const todas = JSON.parse(localStorage.getItem(STORAGE_KEY_DESAFIOS) || '{}');
  todas[conteudoId] = texto;
  localStorage.setItem(STORAGE_KEY_DESAFIOS, JSON.stringify(todas));
}

// ---------------------------------------------------------------------------
// Navegação entre estados
// ---------------------------------------------------------------------------

function mostrarView(nome) {
  document.getElementById('ayvuViewTemas').hidden = nome !== 'temas';
  document.getElementById('ayvuViewTema').hidden = nome !== 'tema';
  document.getElementById('ayvuViewConteudo').hidden = nome !== 'conteudo';
}

function voltarParaTemas() {
  temaAtual = null;
  mostrarView('temas');
  renderHome();
}

function voltarParaTema() {
  conteudoAtual = null;
  mostrarView('tema');
  renderTema();
}

async function abrirTema(id) {
  try {
    temaAtual = await carregarDetalheTema(id);
  } catch (erro) {
    console.warn(erro);
    return;
  }
  abaAtiva = primeiraAbaComConteudo();
  mostrarView('tema');
  renderTema();
}

function primeiraAbaComConteudo() {
  const encontrada = TIPOS.find((tipo) => (temaAtual.conteudos_por_tipo[tipo.chave] || []).length > 0);
  return encontrada ? encontrada.chave : 'video';
}

function abrirConteudo(conteudo) {
  conteudoAtual = conteudo;
  mostrarView('conteudo');
  renderConteudo();
}

// ---------------------------------------------------------------------------
// Renderização: tela inicial (grade de temas)
// ---------------------------------------------------------------------------

function renderHome() {
  const grid = document.getElementById('ayvuTemasGrid');
  grid.innerHTML = '';

  if (temas.length === 0) {
    grid.innerHTML = '<p class="ayvu-vazio">Não foi possível carregar os temas agora. Tente de novo mais tarde.</p>';
    return;
  }

  temas.forEach((tema) => {
    const concluidos = progresso.filter((item) => item.tema_id === tema.id && item.concluido).length;
    const percentual = tema.total_conteudos > 0 ? (concluidos / tema.total_conteudos) * 100 : 0;

    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'ayvu-tema-card';
    card.innerHTML = `
      <span class="ayvu-tema-tag">${tema.dentro_do_curriculo ? 'Currículo' : 'Curiosidade'}</span>
      <h3>${tema.nome}</h3>
      <p class="ayvu-texto-suave">${tema.descricao}</p>
      <div class="ayvu-tema-progresso">
        <div class="ayvu-tema-progresso-track">
          <div class="ayvu-tema-progresso-fill" style="width:${percentual}%"></div>
        </div>
        <span>${concluidos} de ${tema.total_conteudos} conteúdos explorados</span>
      </div>
    `;
    card.addEventListener('click', () => abrirTema(tema.id));
    grid.appendChild(card);
  });
}

// ---------------------------------------------------------------------------
// Renderização: tema aberto (abas + lista de conteúdos)
// ---------------------------------------------------------------------------

function renderTema() {
  document.getElementById('ayvuTemaNome').textContent = temaAtual.nome;
  document.getElementById('ayvuTemaDescricao').textContent = temaAtual.descricao;

  const tabsEl = document.getElementById('ayvuTabs');
  tabsEl.innerHTML = '';

  TIPOS.forEach((tipo) => {
    const itens = temaAtual.conteudos_por_tipo[tipo.chave] || [];
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'ayvu-tab' + (tipo.chave === abaAtiva ? ' ayvu-tab--ativa' : '');
    botao.textContent = `${tipo.icone} ${tipo.rotulo} (${itens.length})`;
    botao.disabled = itens.length === 0;
    botao.addEventListener('click', () => {
      abaAtiva = tipo.chave;
      renderTema();
    });
    tabsEl.appendChild(botao);
  });

  const listaEl = document.getElementById('ayvuConteudosLista');
  listaEl.innerHTML = '';

  const itensDaAba = temaAtual.conteudos_por_tipo[abaAtiva] || [];
  if (itensDaAba.length === 0) {
    listaEl.innerHTML = '<p class="ayvu-vazio">Nenhum conteúdo desse tipo ainda por aqui.</p>';
    return;
  }

  itensDaAba.forEach((conteudo) => {
    const concluido = conteudoEstaConcluido(conteudo.id);
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'ayvu-conteudo-item' + (concluido ? ' ayvu-conteudo-item--concluido' : '');
    item.innerHTML = `
      <span class="ayvu-conteudo-ordem">${conteudo.ordem_sugerida}</span>
      <span class="ayvu-conteudo-titulo">${conteudo.titulo}</span>
      <span class="ayvu-conteudo-selo" aria-hidden="true">${concluido ? '✓' : ''}</span>
    `;
    item.addEventListener('click', () => abrirConteudo(conteudo));
    listaEl.appendChild(item);
  });
}

// ---------------------------------------------------------------------------
// Renderização: visualização de um conteúdo (por tipo)
// ---------------------------------------------------------------------------

function criarBotaoConcluir(rotulo) {
  const jaConcluido = conteudoEstaConcluido(conteudoAtual.id);
  const botao = document.createElement('button');
  botao.type = 'button';
  botao.className = 'ayvu-btn-concluir';
  botao.textContent = jaConcluido ? '✓ Concluído' : rotulo;
  botao.disabled = jaConcluido;

  botao.addEventListener('click', async () => {
    botao.disabled = true;
    botao.textContent = '✓ Concluído';
    await marcarProgresso(conteudoAtual.id, true);
    renderTema();
  });

  return botao;
}

function criarVisualizacaoVideo() {
  const container = document.createElement('div');

  const frameWrap = document.createElement('div');
  frameWrap.className = 'ayvu-video-frame';
  const iframe = document.createElement('iframe');
  iframe.src = conteudoAtual.corpo_ou_url;
  iframe.title = conteudoAtual.titulo;
  iframe.loading = 'lazy';
  iframe.allowFullscreen = true;
  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
  frameWrap.appendChild(iframe);

  container.appendChild(frameWrap);
  container.appendChild(criarBotaoConcluir('Marcar como concluído'));
  return container;
}

function criarVisualizacaoLeitura() {
  const container = document.createElement('div');

  const texto = document.createElement('div');
  texto.className = 'ayvu-leitura-texto';
  texto.textContent = conteudoAtual.corpo_ou_url;

  container.appendChild(texto);
  container.appendChild(criarBotaoConcluir('Marcar como concluído'));
  return container;
}

function criarVisualizacaoJogo() {
  const container = document.createElement('div');

  let quiz;
  try {
    quiz = JSON.parse(conteudoAtual.corpo_ou_url);
  } catch (erro) {
    console.warn('Não foi possível ler este jogo.', erro);
    container.textContent = 'Não foi possível carregar este jogo agora.';
    return container;
  }

  const pergunta = document.createElement('p');
  pergunta.className = 'ayvu-quiz-pergunta';
  pergunta.textContent = quiz.pergunta;
  container.appendChild(pergunta);

  const opcoesEl = document.createElement('div');
  opcoesEl.className = 'ayvu-quiz-opcoes';

  const feedbackEl = document.createElement('p');
  feedbackEl.className = 'ayvu-quiz-feedback';
  feedbackEl.hidden = true;

  const jaConcluido = conteudoEstaConcluido(conteudoAtual.id);

  quiz.alternativas.forEach((alternativa, indice) => {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'ayvu-quiz-opcao';
    botao.textContent = alternativa;
    botao.disabled = jaConcluido;

    botao.addEventListener('click', async () => {
      const acertou = indice === quiz.correta;

      // Sem pontuação, sem tempo, sem ranking — só o feedback de certo/errado.
      // Trava as opções depois de responder (é fixação, não uma prova pra repetir).
      opcoesEl.querySelectorAll('.ayvu-quiz-opcao').forEach((b) => {
        b.disabled = true;
      });
      botao.classList.add(acertou ? 'ayvu-quiz-opcao--certa' : 'ayvu-quiz-opcao--errada');
      if (!acertou) {
        opcoesEl.children[quiz.correta].classList.add('ayvu-quiz-opcao--certa');
      }

      feedbackEl.textContent = acertou ? quiz.feedback_certo : quiz.feedback_errado;
      feedbackEl.hidden = false;

      await marcarProgresso(conteudoAtual.id, true);
      renderTema();
    });

    opcoesEl.appendChild(botao);
  });

  container.appendChild(opcoesEl);
  container.appendChild(feedbackEl);
  return container;
}

function criarVisualizacaoDesafio() {
  const container = document.createElement('div');

  const descricao = document.createElement('p');
  descricao.className = 'ayvu-desafio-descricao';
  descricao.textContent = conteudoAtual.corpo_ou_url;
  container.appendChild(descricao);

  const textarea = document.createElement('textarea');
  textarea.className = 'ayvu-desafio-resposta';
  textarea.rows = 5;
  textarea.placeholder = 'Escreva aqui o que você fez ou descobriu...';
  textarea.value = obterRespostaDesafioLocal(conteudoAtual.id);
  container.appendChild(textarea);

  const jaConcluido = conteudoEstaConcluido(conteudoAtual.id);
  const botaoSalvar = document.createElement('button');
  botaoSalvar.type = 'button';
  botaoSalvar.className = 'ayvu-btn-concluir';
  botaoSalvar.textContent = jaConcluido ? '✓ Resposta salva' : 'Salvar minha resposta';

  botaoSalvar.addEventListener('click', async () => {
    salvarRespostaDesafioLocal(conteudoAtual.id, textarea.value);
    botaoSalvar.textContent = '✓ Resposta salva';
    await marcarProgresso(conteudoAtual.id, true);
    renderTema();
  });

  container.appendChild(botaoSalvar);
  return container;
}

function renderConteudo() {
  document.getElementById('ayvuConteudoTitulo').textContent = conteudoAtual.titulo;

  const corpo = document.getElementById('ayvuConteudoCorpo');
  corpo.innerHTML = '';

  const visualizacoes = {
    video: criarVisualizacaoVideo,
    leitura: criarVisualizacaoLeitura,
    jogo: criarVisualizacaoJogo,
    desafio: criarVisualizacaoDesafio,
  };

  const criar = visualizacoes[conteudoAtual.tipo];
  corpo.appendChild(criar ? criar() : document.createTextNode('Tipo de conteúdo desconhecido.'));
}

// ---------------------------------------------------------------------------
// Inicialização
// ---------------------------------------------------------------------------

async function inicializar() {
  document.getElementById('ayvuVoltarTemasBtn').addEventListener('click', voltarParaTemas);
  document.getElementById('ayvuVoltarConteudoBtn').addEventListener('click', voltarParaTema);

  await Promise.all([carregarTemas(), carregarProgresso()]);

  mostrarView('temas');
  renderHome();
}

document.addEventListener('DOMContentLoaded', inicializar);
