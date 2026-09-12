'use strict';

/*
 * Macu — avatar de corpo inteiro do aluno (AYVU)
 *
 * Usa sprites da comunidade Liberated Pixel Cup (LPC), via o projeto
 * "Universal LPC Spritesheet Character Generator" (CC-BY-SA 3.0 / GPL 3.0).
 * Créditos completos em assets/lpc/CREDITS.md.
 *
 * Cada "parte" do avatar (corpo, cabelo, roupa...) é uma spritesheet com
 * várias animações. Aqui só usamos UM quadro fixo e parado de cada uma:
 * linha 10, coluna 0 (o mesmo quadro que o próprio gerador original usa
 * como preview estático), que corresponde a "andando, de frente, parado".
 * As camadas são empilhadas por CSS (background-position/aspect igual em
 * todas), então não precisamos de <canvas>.
 */

const LPC_ASSETS_BASE = 'assets/lpc';
const LPC_CELL = 64;
const LPC_FRAME_ROW = 10;
const LPC_FRAME_COL = 0;

const STORAGE_KEY = 'ayvu_macu_config';

// Placeholder até existir login/autenticação de verdade no AYVU.
// Quando houver, troque por o id real do aluno logado.
const MACU_USER_ID_PLACEHOLDER = null;

// ---------------------------------------------------------------------------
// Opções disponíveis (curadoria de um subconjunto do catálogo LPC completo,
// que tem centenas de combinações — os nomes/pastas abaixo foram conferidos
// um a um contra o repositório de origem antes de baixar os arquivos).
// ---------------------------------------------------------------------------

const GENDERS = [
  { valor: 'male', rotulo: 'Base A' },
  { valor: 'female', rotulo: 'Base B' },
];

const SKIN_TONES = [
  { valor: 'light', hex: 'faece7' },
  { valor: 'amber', hex: 'fbe7a4' },
  { valor: 'olive', hex: 'e4a47c' },
  { valor: 'taupe', hex: 'c7935f' },
  { valor: 'bronze', hex: 'd38b59' },
  { valor: 'brown', hex: 'b8773f' },
  { valor: 'black', hex: '7f4c31' },
];

const HAIR_STYLES = [
  { valor: 'plain', rotulo: 'Liso' },
  { valor: 'bangs', rotulo: 'Franja' },
  { valor: 'long', rotulo: 'Longo' },
  { valor: 'ponytail', rotulo: 'Rabo de cavalo' },
  { valor: 'afro', rotulo: 'Afro' },
];

const HAIR_COLORS = [
  { valor: 'black', rotulo: 'Preto', hex: '4a5057' },
  { valor: 'dark_brown', rotulo: 'Castanho escuro', hex: '792806' },
  { valor: 'light_brown', rotulo: 'Castanho claro', hex: 'c88d58' },
  { valor: 'blonde', rotulo: 'Loiro', hex: 'ffe67d' },
  { valor: 'red', rotulo: 'Ruivo', hex: 'f1583a' },
  { valor: 'gray', rotulo: 'Grisalho', hex: 'd9d9d9' },
  { valor: 'white', rotulo: 'Branco', hex: 'd8dcdc' },
  { valor: 'blue', rotulo: 'Azul', hex: '1e85ef' },
];

const EYEBROW_STYLES = [
  { valor: 'thick', rotulo: 'Grossa' },
  { valor: 'thin', rotulo: 'Fina' },
];

const EYE_COLORS = [
  { valor: 'blue', rotulo: 'Azul', hex: '50d4ec' },
  { valor: 'brown', rotulo: 'Castanho', hex: '7e4e20' },
  { valor: 'gray', rotulo: 'Cinza', hex: 'ada18f' },
  { valor: 'green', rotulo: 'Verde', hex: '84ec50' },
  { valor: 'orange', rotulo: 'Âmbar', hex: 'ea9b71' },
  { valor: 'purple', rotulo: 'Violeta', hex: 'eba0e0' },
  { valor: 'red', rotulo: 'Vermelho', hex: 'ff3d62' },
  { valor: 'yellow', rotulo: 'Amarelo', hex: 'fedf47' },
];

const CLOTH_COLORS = [
  { valor: 'black', rotulo: 'Preto', hex: '4a5057' },
  { valor: 'navy', rotulo: 'Azul-marinho', hex: '466ac9' },
  { valor: 'gray', rotulo: 'Cinza', hex: 'a2a0a4' },
  { valor: 'brown', rotulo: 'Marrom', hex: '996b4a' },
  { valor: 'forest', rotulo: 'Verde', hex: '1b5502' },
  { valor: 'maroon', rotulo: 'Vinho', hex: 'ae424a' },
  { valor: 'teal', rotulo: 'Azul-petróleo', hex: '00cfdf' },
  { valor: 'white', rotulo: 'Branco', hex: 'e5e6c7' },
];

const DEFAULTS = {
  gender: 'male',
  skinTone: 'light',
  hairStyle: 'plain',
  hairColor: 'dark_brown',
  eyebrowStyle: 'thick',
  eyeColor: 'brown',
  shirtColor: 'navy',
  pantsColor: 'brown',
  shoeColor: 'black',
};

let macuState = { ...DEFAULTS };
let ultimoEstadoSalvo = null;

// ---------------------------------------------------------------------------
// GANCHO FUTURO — integração com o Reko (check-in emocional diário)
//
// Hoje "eyebrowStyle" e "eyeColor" são só escolha manual do aluno. No
// futuro, esses traços do Macu poderão ser sugeridos/ajustados
// automaticamente com base no humor predominante do aluno nos últimos
// check-ins do Reko, em vez de (ou além d)a escolha manual feita aqui.
// (O estilo de sprites LPC usado aqui não tem uma peça de "boca" separada
// — ela já vem embutida no corpo-base — por isso o gancho migrou para
// sobrancelha/olhos, que são as únicas partes do rosto trocáveis.)
//
// O backend deve expor esse histórico no campo `reko_checkins` (ex.:
// GET /aluno/{user_id} -> { ..., reko_checkins: [ { data, emocional, ... } ] }).
//
// Esboço de como isso entraria aqui (NÃO implementado ainda):
//
//   function aplicarExpressaoDoReko(reko_checkins) {
//     const checkinMaisRecente = reko_checkins?.[reko_checkins.length - 1];
//     const humor = checkinMaisRecente?.emocional; // ex.: 'feliz', 'cansado', ...
//     // mapear `humor` -> eyebrowStyle/eyeColor e chamar definirCampo(...)
//   }
//
// ---------------------------------------------------------------------------

// Ordem de empilhamento (de baixo pra cima), igual ao zPos oficial do LPC:
// body(10) < shoes(15) < pants(20) < shirt(35) < eyes(105) < eyebrows(106) < hair(120)
const LAYER_ORDER = ['body', 'shoes', 'pants', 'shirt', 'eyes', 'eyebrows', 'hair'];

function caminhoDaCamada(camada, estado) {
  switch (camada) {
    case 'body':
      return `${LPC_ASSETS_BASE}/body/${estado.gender}/${estado.skinTone}.png`;
    case 'shoes':
      return `${LPC_ASSETS_BASE}/shoes/${estado.gender}/${estado.shoeColor}.png`;
    case 'pants':
      return `${LPC_ASSETS_BASE}/pants/${estado.gender}/${estado.pantsColor}.png`;
    case 'shirt':
      return `${LPC_ASSETS_BASE}/shirt/${estado.gender}/${estado.shirtColor}.png`;
    case 'eyes':
      return `${LPC_ASSETS_BASE}/eyes/${estado.eyeColor}.png`;
    case 'eyebrows':
      return `${LPC_ASSETS_BASE}/eyebrows/${estado.eyebrowStyle}/${estado.hairColor}.png`;
    case 'hair':
      return `${LPC_ASSETS_BASE}/hair/${estado.hairStyle}/${estado.gender}/${estado.hairColor}.png`;
    default:
      throw new Error(`Camada desconhecida: ${camada}`);
  }
}

function atualizarPreview() {
  LAYER_ORDER.forEach((camada) => {
    const el = document.querySelector(`.macu-layer[data-layer="${camada}"]`);
    el.style.backgroundImage = `url("${caminhoDaCamada(camada, macuState)}")`;
  });
}

function definirCampo(campo, valor) {
  macuState[campo] = valor;
  atualizarPreview();
  marcarComoNaoSalvo();
}

// ---------------------------------------------------------------------------
// Persistência
// ---------------------------------------------------------------------------

function salvarMacu() {
  const configAtual = { ...macuState };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(configAtual));

  // TODO(backend): quando o endpoint FastAPI existir, troque (ou complemente)
  // a linha acima por uma chamada real à API. O contrato combinado é:
  //
  //   POST /macu/{user_id}
  //   body: { user_id, avatar_config: { gender, skinTone, hairStyle, hairColor,
  //                                      eyebrowStyle, eyeColor, shirtColor,
  //                                      pantsColor, shoeColor } }
  //
  // Exemplo de como ficaria:
  //
  //   await fetch(`/macu/${userId}`, {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ user_id: userId, avatar_config: configAtual }),
  //   });

  ultimoEstadoSalvo = JSON.stringify(macuState);
  mostrarFeedback('Macu salvo ✓', true);
}

// Conjuntos de valores válidos por campo, usados para filtrar configurações
// salvas antigas/incompatíveis (ex.: uma config de uma versão anterior do
// Macu, que usava outro esquema de campos) em vez de deixá-las quebrar o
// carregamento silenciosamente com imagens 404.
const VALORES_VALIDOS = {
  gender: GENDERS.map((o) => o.valor),
  skinTone: SKIN_TONES.map((o) => o.valor),
  hairStyle: HAIR_STYLES.map((o) => o.valor),
  hairColor: HAIR_COLORS.map((o) => o.valor),
  eyebrowStyle: EYEBROW_STYLES.map((o) => o.valor),
  eyeColor: EYE_COLORS.map((o) => o.valor),
  shirtColor: CLOTH_COLORS.map((o) => o.valor),
  pantsColor: CLOTH_COLORS.map((o) => o.valor),
  shoeColor: CLOTH_COLORS.map((o) => o.valor),
};

function carregarMacu() {
  const salvo = localStorage.getItem(STORAGE_KEY);
  macuState = { ...DEFAULTS };

  if (salvo) {
    try {
      const configSalva = JSON.parse(salvo);
      Object.keys(DEFAULTS).forEach((campo) => {
        const valor = configSalva[campo];
        if (VALORES_VALIDOS[campo].includes(valor)) {
          macuState[campo] = valor;
        }
      });
    } catch (erro) {
      console.warn('Não foi possível ler o Macu salvo, usando padrão.', erro);
      macuState = { ...DEFAULTS };
    }
  }

  ultimoEstadoSalvo = JSON.stringify(macuState);
}

// ---------------------------------------------------------------------------
// Construção dos controles
// ---------------------------------------------------------------------------

function preencherSelect(selectEl, opcoes, campo) {
  selectEl.innerHTML = '';
  opcoes.forEach(({ valor, rotulo }) => {
    const opcao = document.createElement('option');
    opcao.value = valor;
    opcao.textContent = rotulo;
    selectEl.appendChild(opcao);
  });
  selectEl.addEventListener('change', (evento) => definirCampo(campo, evento.target.value));
}

function criarSwatchesDeCor(containerEl, opcoes, campo) {
  containerEl.innerHTML = '';
  opcoes.forEach(({ valor, rotulo, hex }) => {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'macu-swatch';
    botao.style.backgroundColor = `#${hex}`;
    botao.dataset.valor = valor;
    botao.title = rotulo || `#${hex}`;
    botao.setAttribute('aria-label', rotulo || `#${hex}`);

    botao.addEventListener('click', () => {
      definirCampo(campo, valor);
      atualizarSelecaoVisual(containerEl, valor);
    });

    containerEl.appendChild(botao);
  });
}

function criarSwatchesDeCorpo(containerEl) {
  containerEl.innerHTML = '';
  GENDERS.forEach(({ valor, rotulo }) => {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'macu-swatch macu-swatch--corpo';
    botao.dataset.valor = valor;
    botao.title = rotulo;
    botao.setAttribute('aria-label', rotulo);

    botao.addEventListener('click', () => {
      definirCampo('gender', valor);
      atualizarSelecaoVisual(containerEl, valor);
      atualizarThumbsDeCorpo();
    });

    containerEl.appendChild(botao);
  });
}

// Os dois botões de "base do corpo" mostram uma miniatura de verdade (o
// próprio sprite do corpo, no tom de pele atual), em vez de um texto seco.
function atualizarThumbsDeCorpo() {
  const container = document.getElementById('macuGenderSwatches');
  container.querySelectorAll('.macu-swatch--corpo').forEach((botao) => {
    const gender = botao.dataset.valor;
    const caminho = caminhoDaCamada('body', { ...macuState, gender });
    botao.style.backgroundImage = `url("${caminho}")`;
  });
}

function atualizarSelecaoVisual(containerEl, valorSelecionado) {
  containerEl.querySelectorAll('.macu-swatch').forEach((botao) => {
    botao.classList.toggle('macu-swatch--selecionado', botao.dataset.valor === valorSelecionado);
  });
}

function mostrarFeedback(mensagem, sucesso) {
  const feedbackEl = document.getElementById('macuSaveFeedback');
  feedbackEl.textContent = mensagem;
  feedbackEl.classList.toggle('macu-save-feedback--sucesso', Boolean(sucesso));

  if (sucesso) {
    setTimeout(() => {
      feedbackEl.textContent = '';
      feedbackEl.classList.remove('macu-save-feedback--sucesso');
    }, 2500);
  }
}

function marcarComoNaoSalvo() {
  if (JSON.stringify(macuState) !== ultimoEstadoSalvo) {
    mostrarFeedback('Alterações não salvas', false);
  }
}

function sortearAleatorio(lista) {
  return lista[Math.floor(Math.random() * lista.length)].valor;
}

function sortearLook() {
  macuState = {
    gender: sortearAleatorio(GENDERS),
    skinTone: sortearAleatorio(SKIN_TONES),
    hairStyle: sortearAleatorio(HAIR_STYLES),
    hairColor: sortearAleatorio(HAIR_COLORS),
    eyebrowStyle: sortearAleatorio(EYEBROW_STYLES),
    eyeColor: sortearAleatorio(EYE_COLORS),
    shirtColor: sortearAleatorio(CLOTH_COLORS),
    pantsColor: sortearAleatorio(CLOTH_COLORS),
    shoeColor: sortearAleatorio(CLOTH_COLORS),
  };
  sincronizarControlesComEstado();
  atualizarPreview();
  marcarComoNaoSalvo();
}

// ---------------------------------------------------------------------------
// Preenche a UI com o estado atual (usado no carregamento inicial e no sorteio)
// ---------------------------------------------------------------------------

function sincronizarControlesComEstado() {
  document.getElementById('macuHairStyleSelect').value = macuState.hairStyle;
  document.getElementById('macuEyebrowStyleSelect').value = macuState.eyebrowStyle;

  atualizarSelecaoVisual(document.getElementById('macuGenderSwatches'), macuState.gender);
  atualizarSelecaoVisual(document.getElementById('macuSkinToneSwatches'), macuState.skinTone);
  atualizarSelecaoVisual(document.getElementById('macuHairColorSwatches'), macuState.hairColor);
  atualizarSelecaoVisual(document.getElementById('macuEyeColorSwatches'), macuState.eyeColor);
  atualizarSelecaoVisual(document.getElementById('macuShirtColorSwatches'), macuState.shirtColor);
  atualizarSelecaoVisual(document.getElementById('macuPantsColorSwatches'), macuState.pantsColor);
  atualizarSelecaoVisual(document.getElementById('macuShoeColorSwatches'), macuState.shoeColor);

  atualizarThumbsDeCorpo();
}

function configurarEventos() {
  document.getElementById('macuShuffleBtn').addEventListener('click', sortearLook);
  document.getElementById('macuSaveBtn').addEventListener('click', salvarMacu);
}

function inicializar() {
  carregarMacu();

  criarSwatchesDeCorpo(document.getElementById('macuGenderSwatches'));
  criarSwatchesDeCor(document.getElementById('macuSkinToneSwatches'), SKIN_TONES, 'skinTone');
  preencherSelect(document.getElementById('macuHairStyleSelect'), HAIR_STYLES, 'hairStyle');
  criarSwatchesDeCor(document.getElementById('macuHairColorSwatches'), HAIR_COLORS, 'hairColor');
  preencherSelect(document.getElementById('macuEyebrowStyleSelect'), EYEBROW_STYLES, 'eyebrowStyle');
  criarSwatchesDeCor(document.getElementById('macuEyeColorSwatches'), EYE_COLORS, 'eyeColor');
  criarSwatchesDeCor(document.getElementById('macuShirtColorSwatches'), CLOTH_COLORS, 'shirtColor');
  criarSwatchesDeCor(document.getElementById('macuPantsColorSwatches'), CLOTH_COLORS, 'pantsColor');
  criarSwatchesDeCor(document.getElementById('macuShoeColorSwatches'), CLOTH_COLORS, 'shoeColor');

  sincronizarControlesComEstado();
  configurarEventos();
  atualizarPreview();
}

document.addEventListener('DOMContentLoaded', inicializar);
