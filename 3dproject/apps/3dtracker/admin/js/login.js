'use strict';
/* ================================================
   login.js — Lógica de autenticación local
   Compara credenciales con las del proceso principal
   via IPC (nunca hardcodeadas en el renderer)
   ================================================ */

let apiConfig = null;

async function init() {
  apiConfig = await window.electronAPI.getApiConfig();
}

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const errorEl  = document.getElementById('login-error');
  const btn      = document.getElementById('login-btn');

  errorEl.style.display = 'none';
  btn.disabled    = true;
  btn.textContent = 'Verificando...';

  // Pequeño delay para UX (evita brute-force visual)
  await new Promise(r => setTimeout(r, 350));

  if (username === apiConfig.username && password === apiConfig.password) {
    btn.textContent = '✓ Accediendo...';
    await window.electronAPI.navigate('dashboard');
  } else {
    errorEl.style.display = 'block';
    btn.disabled    = false;
    btn.textContent = 'Iniciar sesión →';
    document.getElementById('password').value = '';
    document.getElementById('password').focus();
  }
});

// Permitir Enter en el campo usuario
document.getElementById('username').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('password').focus();
});

init();
