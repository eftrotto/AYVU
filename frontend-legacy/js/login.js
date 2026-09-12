'use strict';

/*
 * Controlador da tela de login (frontend/login.html).
 * Usa as funções de frontend/js/auth.js (fazerLogin, cadastrar...).
 */

let modoCadastro = false;

function alternarModo() {
  modoCadastro = !modoCadastro;

  document.getElementById('campoNome').hidden = !modoCadastro;
  document.getElementById('campoTipo').hidden = !modoCadastro;

  document.getElementById('loginSubmitBtn').textContent = modoCadastro ? 'Criar conta' : 'Entrar';
  document.getElementById('loginToggleBtn').textContent = modoCadastro ? 'Já tenho conta' : 'Criar conta';

  esconderErro();
}

function mostrarErro(mensagem) {
  const erroEl = document.getElementById('loginErro');
  erroEl.textContent = mensagem;
  erroEl.hidden = false;
}

function esconderErro() {
  document.getElementById('loginErro').hidden = true;
}

function redirecionarPorTipo(usuario) {
  window.location.href = usuario.tipo === 'professor' ? 'professor/dashboard.html' : 'aluno/index.html';
}

async function aoSubmeterForm(evento) {
  evento.preventDefault();
  esconderErro();

  const email = document.getElementById('loginEmail').value.trim();
  const senha = document.getElementById('loginSenha').value;
  const botao = document.getElementById('loginSubmitBtn');

  botao.disabled = true;
  try {
    if (modoCadastro) {
      const nome = document.getElementById('cadastroNome').value.trim();
      const tipo = document.querySelector('input[name="tipo"]:checked').value;
      await cadastrar({ nome, email, senha, tipo });
      // cadastrou com sucesso — já loga em seguida, sem pedir de novo.
    }

    const usuario = await fazerLogin(email, senha);
    redirecionarPorTipo(usuario);
  } catch (erro) {
    mostrarErro(erro.message);
    botao.disabled = false;
  }
}

function inicializar() {
  // Já tem sessão válida? Nem mostra o login de novo.
  const usuarioExistente = obterUsuarioLogado();
  if (usuarioExistente && obterTokenAtual()) {
    redirecionarPorTipo(usuarioExistente);
    return;
  }

  document.getElementById('loginForm').addEventListener('submit', aoSubmeterForm);
  document.getElementById('loginToggleBtn').addEventListener('click', alternarModo);
}

document.addEventListener('DOMContentLoaded', inicializar);
