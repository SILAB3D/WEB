'use strict';
/* ================================================
   dashboard.js — Panel principal de pedidos
   ================================================ */

let apiConfig  = null;
let allOrders  = [];
let searchTerm = '';

// ── API helper ────────────────────────────────
async function apiFetch(path, options = {}) {
  const url = `${apiConfig.baseUrl}${path}`;
  const res  = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiConfig.apiKey,
      ...(options.headers || {})
    }
  });
  const json = await res.json();
  if (!res.ok) {
    let msg = json.error;
    if (!msg && json.errors && Array.isArray(json.errors)) {
      msg = json.errors.map(e => e.msg).join('; ');
    }
    throw new Error(msg || `Error ${res.status}`);
  }
  return json.data;
}

// ── Toast ─────────────────────────────────────
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type]}</span><span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(str || ''));
  return d.innerHTML;
}

// ── Formatear fecha ───────────────────────────
function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

// ── Calcular estado del pedido ────────────────
function getOrderStatus(order) {
  const steps = order.order_steps;
  // Supabase puede devolver el conteo como array [{count: N}]
  const count = Array.isArray(steps) ? steps[0]?.count ?? steps.length : 0;
  if (count === 0) return { label: 'Sin etapas', css: 'pending' };
  // Para el dashboard solo tenemos el conteo, así que mostramos genérico
  return { label: 'En progreso', css: 'partial' };
}

// ── Renderizar tabla ──────────────────────────
function renderTable(orders) {
  const tbody     = document.getElementById('orders-tbody');
  const table     = document.getElementById('orders-table');
  const emptyEl   = document.getElementById('table-empty');
  const loadingEl = document.getElementById('table-loading');

  loadingEl.style.display = 'none';

  if (!orders || orders.length === 0) {
    table.style.display   = 'none';
    emptyEl.style.display = '';
    return;
  }

  emptyEl.style.display  = 'none';
  table.style.display    = '';

  tbody.innerHTML = orders.map(order => {
    const status = getOrderStatus(order);
    const stepsArr = order.order_steps;
    const count = Array.isArray(stepsArr) ? (stepsArr[0]?.count ?? stepsArr.length) : 0;

    return `
      <tr data-id="${order.id}" data-code="${order.order_code}">
        <td data-label="Código"><span class="code-cell">${escapeHtml(order.order_code)}</span></td>
        <td data-label="Cliente">${escapeHtml(order.customer_name || '—')}</td>
        <td data-label="Email" style="color:var(--text-secondary);">${escapeHtml(order.customer_email)}</td>
        <td data-label="Pasos" style="color:var(--text-secondary);">${count}</td>
        <td data-label="Estado"><span class="badge ${status.css}">${status.label}</span></td>
        <td data-label="Fecha" style="color:var(--text-muted);">${formatDate(order.created_at)}</td>
      </tr>`;
  }).join('');

  // Click en fila → navegar al detalle
  tbody.querySelectorAll('tr').forEach(row => {
    row.addEventListener('click', async () => {
      await window.electronAPI.setSharedData({
        orderId:   row.dataset.id,
        orderCode: row.dataset.code
      });
      await window.electronAPI.navigate('order-detail');
    });
  });
}

// ── Actualizar stats ──────────────────────────
function updateStats(orders) {
  document.getElementById('stat-total').textContent    = orders.length;
  document.getElementById('topbar-subtitle').textContent =
    `${orders.length} pedido${orders.length !== 1 ? 's' : ''} en total`;

  // Nota: sin datos de steps detallados en listado, stats básicos
  document.getElementById('stat-done').textContent     = '—';
  document.getElementById('stat-progress').textContent = orders.length;
}

// ── Filtrar pedidos ───────────────────────────
function filterOrders(term) {
  if (!term) return allOrders;
  const q = term.toLowerCase();
  return allOrders.filter(o =>
    o.order_code.toLowerCase().includes(q) ||
    (o.customer_email || '').toLowerCase().includes(q) ||
    (o.customer_name  || '').toLowerCase().includes(q)
  );
}

// ── Cargar pedidos ────────────────────────────
async function loadOrders() {
  document.getElementById('table-loading').style.display = '';
  document.getElementById('orders-table').style.display  = 'none';
  document.getElementById('table-empty').style.display   = 'none';

  try {
    allOrders = await window.DPCloud.listOrders();
    updateStats(allOrders);
    renderTable(filterOrders(searchTerm));
  } catch (err) {
    document.getElementById('table-loading').style.display = 'none';
    showToast(`Error al cargar pedidos: ${err.message}`, 'error');
  }
}

// ── Modal: Nuevo pedido ───────────────────────
function openNewOrderModal() {
  document.getElementById('new-order-modal').style.display = '';
  document.getElementById('new-email').focus();
}

function closeNewOrderModal() {
  document.getElementById('new-order-modal').style.display = 'none';
  document.getElementById('new-email').value        = '';
  document.getElementById('new-name').value         = '';
  document.getElementById('new-description').value  = '';
}

async function createOrder() {
  const email       = document.getElementById('new-email').value.trim();
  const name        = document.getElementById('new-name').value.trim();
  const description = document.getElementById('new-description').value.trim();
  const btn         = document.getElementById('create-order-btn');

  if (!email) {
    document.getElementById('new-email').focus();
    showToast('El email del cliente es obligatorio.', 'error');
    return;
  }

  btn.disabled    = true;
  btn.textContent = 'Creando...';

  try {
    const order = await window.DPCloud.createOrder({ customer_email: email, customer_name: name, description: description });

    closeNewOrderModal();
    showToast(`✅ Pedido ${order.order_code} creado.`, 'success');
    await loadOrders();
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Crear pedido';
  }
}

// ── Búsqueda en tiempo real ───────────────────
document.getElementById('search-input').addEventListener('input', (e) => {
  searchTerm = e.target.value.trim();
  renderTable(filterOrders(searchTerm));
});

// ── Logout ────────────────────────────────────
document.getElementById('logout-btn').addEventListener('click', async () => {
  try { await window.DPCloud.logout(); } catch (e) {}
  if (window.parent !== window) { try { window.parent.postMessage({ __dp3:true, type:'home' }, '*'); } catch(e){} }
  else { window.location.href = '../../../index.html'; }
});

// ── Cerrar modal al hacer clic fuera ─────────
document.getElementById('new-order-modal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('new-order-modal')) closeNewOrderModal();
});

// ── Init ──────────────────────────────────────
async function init() {
  apiConfig = await window.electronAPI.getApiConfig();
  await loadOrders();
  if (window.DPCloud && window.DPCloud.watchOrders) { try { window.DPCloud.watchOrders(function(){ loadOrders(); }); } catch(e){} }
}

function openWebsite() {
  if (apiConfig && apiConfig.frontendUrl) {
    window.open(apiConfig.frontendUrl, '_blank');
  }
}

init();

// Exponer funciones globales llamadas desde el HTML
window.loadOrders      = loadOrders;
window.openNewOrderModal  = openNewOrderModal;
window.closeNewOrderModal = closeNewOrderModal;
window.createOrder     = createOrder;
window.openWebsite     = openWebsite;

window.toggleSidebar = function(){ var l=document.querySelector(".app-layout"); if(l) l.classList.toggle("side-collapsed"); };
