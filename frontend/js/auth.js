'use strict';

/*
 * Autenticação (MVP de hackathon) — funções reutilizáveis por qualquer
 * página do AYVU (aluno/ e professor/). O token (JWT) e os dados públicos
 * do usuário ficam no localStorage.
 *
 * NÃO é adequado para produção: não tem recuperação de senha, verificação
 * de e-mail, proteção contra força bruta, nem refresh token — só o
 * suficiente pra distinguir aluno/professor nesta demo.
 */

// Se estas páginas forem abertas direto (file://) em vez de servidas pelo
// FastAPI, troque a linha abaixo por algo como 'http://localhost:8000'.
const AUTH_API_BASE = '';

const AUTH_STORAGE_KEY_TOKEN = 'ayvu_auth_token';
const AUTH_STORAGE_KEY_USUARIO = 'ayvu_auth_usuario'; // {id, nome, tipo, turma_id}

async function fazerLogin(email, senha) {
  const resposta = await fetch(`${AUTH_API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, senha }),
  });

  const dados = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    throw new Error(dados?.detail || 'Não foi possível entrar. Tente de novo.');
  }

  localStorage.setItem(AUTH_STORAGE_KEY_TOKEN, dados.token);
  localStorage.setItem(AUTH_STORAGE_KEY_USUARIO, JSON.stringify(dados.usuario));
  return dados.usuario;
}

async function cadastrar({ nome, email, senha, tipo }) {
  const resposta = await fetch(`${AUTH_API_BASE}/auth/cadastro`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome, email, senha, tipo }),
  });

  const dados = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    throw new Error(dados?.detail || 'Não foi possível criar a conta. Tente de novo.');
  }

  return dados; // UsuarioResponse
}

function obterUsuarioLogado() {
  const bruto = localStorage.getItem(AUTH_STORAGE_KEY_USUARIO);
  if (!bruto) return null;
  try {
    return JSON.parse(bruto);
  } catch (erro) {
    console.warn('Não foi possível ler o usuário logado.', erro);
    return null;
  }
}

function obterTokenAtual() {
  return localStorage.getItem(AUTH_STORAGE_KEY_TOKEN);
}

// Chame no topo de qualquer página protegida (aluno/index.html,
// professor/dashboard.html...). Redireciona pro login se não houver sessão
// válida e devolve `null`; quem chamou deve parar a inicialização nesse
// caso. Passe 'aluno' ou 'professor' em `tipoEsperado` pra também barrar
// quem está logado com o tipo errado tentando abrir a área errada.
function verificarSessao(tipoEsperado) {
  const usuario = obterUsuarioLogado();
  const token = obterTokenAtual();

  if (!usuario || !token) {
    redirecionarParaLogin();
    return null;
  }

  if (tipoEsperado && usuario.tipo !== tipoEsperado) {
    redirecionarParaLogin();
    return null;
  }

  return usuario;
}

function redirecionarParaLogin() {
  window.location.href = `${caminhoRaizDoSite()}login.html`;
}

// As páginas protegidas (aluno/index.html, professor/dashboard.html) estão
// sempre um nível abaixo da raiz do frontend, então "../" chega lá.
function caminhoRaizDoSite() {
  return '../';
}

function logout() {
  localStorage.removeItem(AUTH_STORAGE_KEY_TOKEN);
  localStorage.removeItem(AUTH_STORAGE_KEY_USUARIO);
  redirecionarParaLogin();
}
