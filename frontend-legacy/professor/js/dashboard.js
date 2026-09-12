'use strict';

/*
 * Controlador do placeholder do painel do professor
 * (frontend/professor/dashboard.html). Depende de frontend/js/auth.js
 * (carregado antes deste script).
 */

function inicializar() {
  const usuario = verificarSessao('professor');
  if (!usuario) return; // verificarSessao já redirecionou pro login

  document.getElementById('dashboardSaudacao').textContent = `Bem-vindo, ${usuario.nome}!`;
  document.getElementById('dashboardLogoutBtn').addEventListener('click', logout);
}

document.addEventListener('DOMContentLoaded', inicializar);
