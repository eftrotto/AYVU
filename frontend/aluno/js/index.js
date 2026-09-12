'use strict';

/*
 * Controlador da tela inicial do aluno (frontend/aluno/index.html).
 * Depende de frontend/js/auth.js (carregado antes deste script).
 */

function inicializar() {
  const usuario = verificarSessao('aluno');
  if (!usuario) return; // verificarSessao já redirecionou pro login

  document.getElementById('inicioSaudacao').textContent = `Olá, ${usuario.nome}!`;
  document.getElementById('inicioLogoutBtn').addEventListener('click', logout);
}

document.addEventListener('DOMContentLoaded', inicializar);
