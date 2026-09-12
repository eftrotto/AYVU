'use strict';

/*
 * Reko — check-in diário multi-eixo do aluno (AYVU), baseado no CASEL 5.
 * 5 perguntas, escala Likert 1-5, uma pergunta por vez (fluxo rápido).
 * O aluno nunca vê o resultado agregado — o dado vai só pro backend.
 */

// Se este HTML for aberto direto (file://) em vez de servido pelo FastAPI,
// troque a linha abaixo por algo como 'http://localhost:8000'.
const REKO_API_BASE = '';

// Placeholders até existir login/matrícula de verdade no AYVU.
const REKO_USER_ID_PLACEHOLDER = null;
const REKO_TURMA_ID_PLACEHOLDER = null;

const STORAGE_KEY_ULTIMO_CHECKIN = 'ayvu_reko_ultimo_checkin';
const STORAGE_KEY_PENDENTES = 'ayvu_reko_pendentes';

const PERGUNTAS = [
  {
    chave: 'autoconhecimento',
    texto: 'Hoje eu consegui perceber bem o que estava sentindo.',
  },
  {
    chave: 'autogestao',
    texto: 'Hoje eu consegui lidar bem com o que me estressou ou desanimou.',
  },
  {
    chave: 'consciencia_social',
    texto: 'Hoje eu me senti capaz de entender como as pessoas ao meu redor estavam se sentindo.',
  },
  {
    chave: 'relacionamento',
    texto: 'Hoje eu me senti conectado(a) com as pessoas ao meu redor.',
  },
  {
    chave: 'decisao_responsavel',
    texto: 'Hoje eu fiz escolhas das quais me sinto bem.',
  },
];

const OPCOES_LIKERT = [
  { valor: 1, emoji: '😞', rotulo: 'Discordo totalmente' },
  { valor: 2, emoji: '🙁', rotulo: 'Discordo' },
  { valor: 3, emoji: '😐', rotulo: 'Neutro' },
  { valor: 4, emoji: '🙂', rotulo: 'Concordo' },
  { valor: 5, emoji: '😄', rotulo: 'Concordo totalmente' },
];

// Estado fica só em memória durante o preenchimento — não precisa persistir
// a cada pergunta, só ao final (ou se o envio falhar, ver salvarCheckinPendente).
let indiceAtual = 0;
let respostas = {};
let avancoPendente = false;

// ---------------------------------------------------------------------------
// Data / trava de "um check-in por dia"
// ---------------------------------------------------------------------------

function dataDeHoje() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function jaFezCheckinHoje() {
  return localStorage.getItem(STORAGE_KEY_ULTIMO_CHECKIN) === dataDeHoje();
}

function marcarCheckinDeHoje() {
  localStorage.setItem(STORAGE_KEY_ULTIMO_CHECKIN, dataDeHoje());
}

// ---------------------------------------------------------------------------
// Envio (com fallback local se a rede/API falhar)
// ---------------------------------------------------------------------------

function montarPayload() {
  return {
    user_id: REKO_USER_ID_PLACEHOLDER,
    turma_id: REKO_TURMA_ID_PLACEHOLDER,
    data: dataDeHoje(),
    ...respostas,
  };
}

function salvarCheckinPendente(payload) {
  const pendentes = JSON.parse(localStorage.getItem(STORAGE_KEY_PENDENTES) || '[]');
  pendentes.push(payload);
  localStorage.setItem(STORAGE_KEY_PENDENTES, JSON.stringify(pendentes));

  // TODO: quando houver uma tela/rotina pra sincronizar pendências (ex.: ao
  // reabrir o app com internet), ler STORAGE_KEY_PENDENTES, reenviar cada
  // item pra POST /reko/checkin e só então limpar a fila.
}

async function enviarCheckin(payload) {
  try {
    const resposta = await fetch(`${REKO_API_BASE}/reko/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (resposta.ok) {
      return { ok: true, offline: false };
    }

    if (resposta.status === 409) {
      // já existe um check-in de hoje pra esse aluno no servidor — pro
      // aluno o resultado é o mesmo (dia concluído), não é um erro real.
      return { ok: true, offline: false };
    }

    throw new Error(`Falha ao enviar check-in (status ${resposta.status})`);
  } catch (erro) {
    console.warn('Não foi possível enviar o check-in agora. Guardando localmente.', erro);
    salvarCheckinPendente(payload);
    return { ok: true, offline: true };
  }
}

// ---------------------------------------------------------------------------
// Wizard
// ---------------------------------------------------------------------------

function mostrarView(nome) {
  document.getElementById('rekoViewJaFeito').hidden = nome !== 'jaFeito';
  document.getElementById('rekoViewWizard').hidden = nome !== 'wizard';
  document.getElementById('rekoViewObrigado').hidden = nome !== 'obrigado';
}

function renderPergunta() {
  const pergunta = PERGUNTAS[indiceAtual];

  document.getElementById('rekoQuestionText').textContent = pergunta.texto;
  document.getElementById('rekoProgressLabel').textContent = `Pergunta ${indiceAtual + 1} de ${PERGUNTAS.length}`;
  document.getElementById('rekoProgressBar').style.width = `${(indiceAtual / PERGUNTAS.length) * 100}%`;
  document.getElementById('rekoVoltarBtn').hidden = indiceAtual === 0;

  const opcoesContainer = document.getElementById('rekoOptions');
  opcoesContainer.innerHTML = '';
  OPCOES_LIKERT.forEach((opcao) => {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'reko-opcao';
    if (respostas[pergunta.chave] === opcao.valor) {
      botao.classList.add('reko-opcao--selecionada');
    }
    botao.innerHTML = `
      <span class="reko-opcao-emoji" aria-hidden="true">${opcao.emoji}</span>
      <span class="reko-opcao-rotulo">${opcao.rotulo}</span>
    `;
    botao.addEventListener('click', () => selecionarResposta(pergunta.chave, opcao.valor));
    opcoesContainer.appendChild(botao);
  });

  // reinicia a animação de entrada (transição leve entre perguntas)
  const card = document.getElementById('rekoQuestionCard');
  card.classList.remove('reko-question-card--anim');
  void card.offsetWidth; // força reflow pra reiniciar a animação CSS
  card.classList.add('reko-question-card--anim');
}

function selecionarResposta(chave, valor) {
  if (avancoPendente) return;

  respostas[chave] = valor;
  avancoPendente = true;
  renderPergunta(); // mostra a opção marcada antes de avançar

  setTimeout(() => {
    avancoPendente = false;
    avancar();
  }, 350);
}

function avancar() {
  if (indiceAtual < PERGUNTAS.length - 1) {
    indiceAtual += 1;
    renderPergunta();
  } else {
    finalizarCheckin();
  }
}

function voltar() {
  if (indiceAtual > 0) {
    indiceAtual -= 1;
    renderPergunta();
  }
}

async function finalizarCheckin() {
  document.getElementById('rekoProgressBar').style.width = '100%';

  const payload = montarPayload();
  await enviarCheckin(payload);
  marcarCheckinDeHoje();

  mostrarView('obrigado');
}

function inicializar() {
  document.getElementById('rekoVoltarBtn').addEventListener('click', voltar);

  if (jaFezCheckinHoje()) {
    mostrarView('jaFeito');
    return;
  }

  mostrarView('wizard');
  renderPergunta();
}

document.addEventListener('DOMContentLoaded', inicializar);
