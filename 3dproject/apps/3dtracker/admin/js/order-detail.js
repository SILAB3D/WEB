'use strict';
/* ================================================
   order-detail.js — Vista de detalle de un pedido
   Gestión de pasos: añadir, completar, actualizar
   ================================================ */

// FRONTEND_URL se obtiene dinámicamente de apiConfig para despliegues

let apiConfig = null;
let orderId   = null;
let orderCode = null;
let currentOrder = null;

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
    toast.style.opacity   = '0';
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

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

// ── Renderizar lista de pasos ─────────────────
function renderSteps(steps) {
  const container = document.getElementById('steps-list');

  if (!steps || steps.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">📝</div>
        <p>No hay etapas todavía.<br>Añade la primera etapa del proyecto.</p>
      </div>`;
    return;
  }

  const sorted = [...steps].sort((a, b) => a.order_index - b.order_index);

  container.innerHTML = sorted.map(step => {
    const isDone = step.status === 'done';
    return `
      <div class="step-row" id="step-row-${step.id}">
        <button
          class="step-checkbox ${isDone ? 'done' : ''}"
          id="check-${step.id}"
          title="${isDone ? 'Marcar como pendiente' : 'Marcar como completado'}"
          onclick="toggleStep('${step.id}', '${isDone ? 'pending' : 'done'}')"
        >
          ${isDone ? '✓' : ''}
        </button>
        <div class="step-info">
          <div class="name ${isDone ? 'done' : ''}">${escapeHtml(step.step_name)}</div>
          ${isDone && step.updated_at
            ? `<div class="date">Completado: ${formatDate(step.updated_at)}</div>`
            : `<div class="date">Pendiente · Posición ${step.order_index}</div>`
          }
        </div>
        <button 
          class="btn btn-ghost btn-sm" 
          style="color: var(--error); padding: 0.25rem 0.5rem; border-color: transparent;" 
          title="Eliminar etapa" 
          onclick="deleteStep('${step.id}')"
        >
          🗑️
        </button>
      </div>`;
  }).join('');
}

// ── Renderizar detalle completo ───────────────
function renderOrder(order) {
  currentOrder = order;
  const steps = order.order_steps || [];

  // Topbar
  document.getElementById('topbar-title').textContent =
    order.customer_name ? `Pedido de ${order.customer_name}` : 'Detalle del pedido';
  document.getElementById('topbar-code').textContent = order.order_code;

  // Information panel
  document.getElementById('info-code').textContent        = order.order_code;
  document.getElementById('info-name').textContent        = order.customer_name || '—';
  document.getElementById('info-email').textContent       = order.customer_email;
  document.getElementById('info-description').textContent = order.description || '—';
  document.getElementById('info-date').textContent        = formatDate(order.created_at);

  // Estado
  const total = steps.length;
  const done  = steps.filter(s => s.status === 'done').length;
  const pct   = total === 0 ? 0 : Math.round((done / total) * 100);

  const statusEl = document.getElementById('info-status');
  if (total === 0)      statusEl.innerHTML = `<span class="badge pending">Sin etapas</span>`;
  else if (pct === 100) statusEl.innerHTML = `<span class="badge done">✅ Completado</span>`;
  else                  statusEl.innerHTML = `<span class="badge partial">⏳ ${done}/${total} pasos</span>`;

  // Progress bar
  document.getElementById('progress-pct').textContent     = `${pct}%`;
  document.getElementById('progress-bar').style.width     = `${pct}%`;

  // Tracking URL dinámica (local o producción)
  const trackUrl = '../frontend/track.html?code=' + order.order_code;
  document.getElementById('tracking-url').textContent = trackUrl;

  // Steps list
  renderSteps(steps);

  // Sugerir próximo order_index en el modal
  const nextIdx = total === 0 ? 0 : Math.max(...steps.map(s => s.order_index)) + 1;
  const idxInput = document.getElementById('step-index-input');
  if (idxInput) idxInput.value = nextIdx;
}

// ── Cargar pedido ─────────────────────────────
async function loadOrderDetail() {
  document.getElementById('loading-state').style.display  = '';
  document.getElementById('detail-content').style.display = 'none';

  try {
    // Usamos el endpoint de track para obtener datos con pasos ordenados
    const data = await window.DPCloud.getOrderById(orderId);
    if (!data) throw new Error('Pedido no encontrado.');
    document.getElementById('loading-state').style.display  = 'none';
    document.getElementById('detail-content').style.display = '';
    renderOrder(data);
  } catch (err) {
    document.getElementById('loading-state').style.display = 'none';
    showToast(`Error al cargar el pedido: ${err.message}`, 'error');
  }
}

// ── Toggle estado de un paso ──────────────────
async function toggleStep(stepId, newStatus) {
  // Feedback visual inmediato (optimistic update)
  const checkBtn = document.getElementById(`check-${stepId}`);
  if (checkBtn) {
    checkBtn.disabled = true;
    checkBtn.style.opacity = '0.5';
  }

  try {
    await window.DPCloud.setStepStatus(orderId, stepId, newStatus);
    // Recargar datos reales
    await loadOrderDetail();
    showToast(
      newStatus === 'done' ? '✅ Etapa completada' : '↩️ Etapa marcada como pendiente',
      'success'
    );
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
    if (checkBtn) {
      checkBtn.disabled = false;
      checkBtn.style.opacity = '1';
    }
  }
}

// ── Eliminar paso ───────────────────────────────
async function deleteStep(stepId) {
  if (!confirm('¿Estás seguro de que quieres eliminar esta etapa? Esta acción no se puede deshacer.')) return;

  try {
    await window.DPCloud.deleteStep(orderId, stepId);
    showToast('🗑️ Etapa eliminada correctamente.', 'success');
    await loadOrderDetail();
  } catch (err) {
    showToast(`Error al eliminar: ${err.message}`, 'error');
  }
}

// ── Modal: Añadir paso ────────────────────────
function openAddStepModal() {
  document.getElementById('add-step-modal').style.display = '';
  document.getElementById('step-name-input').focus();
}

function closeAddStepModal() {
  document.getElementById('add-step-modal').style.display = 'none';
  document.getElementById('step-name-input').value = '';
}

async function addStep() {
  const name  = document.getElementById('step-name-input').value.trim();
  const index = parseInt(document.getElementById('step-index-input').value, 10);

  if (!name) {
    document.getElementById('step-name-input').focus();
    showToast('El nombre de la etapa es obligatorio.', 'error');
    return;
  }

  try {
    await window.DPCloud.addStep(orderId, { step_name: name, order_index: isNaN(index) ? 0 : index });
    closeAddStepModal();
    showToast(`Etapa "${name}" añadida.`, 'success');
    await loadOrderDetail();
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
  }
}

// ── Copiar al portapapeles ────────────────────
async function copyToClipboard(text, btnId) {
  await navigator.clipboard.writeText(text);
  const btn = document.getElementById(btnId);
  if (btn) {
    btn.classList.add('copied');
    const original = btn.textContent;
    btn.textContent = '✓';
    setTimeout(() => {
      btn.classList.remove('copied');
      btn.textContent = original;
    }, 1500);
  }
}

// ── Volver al dashboard ───────────────────────
async function goBack() {
  await window.electronAPI.navigate('dashboard');
}

// ── Logout ────────────────────────────────────
document.getElementById('logout-btn').addEventListener('click', async () => {
  try { await window.DPCloud.logout(); } catch (e) {}
  if (window.parent !== window) { try { window.parent.postMessage({ __dp3:true, type:'home' }, '*'); } catch(e){} }
  else { window.location.href = '../../../index.html'; }
});

// ── Cerrar modales al clic fuera ──────────────
document.getElementById('add-step-modal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('add-step-modal')) closeAddStepModal();
});

// ── Botones de copiar ─────────────────────────
document.getElementById('copy-code-btn').addEventListener('click', () => {
  if (orderCode) copyToClipboard(orderCode, 'copy-code-btn');
});

document.getElementById('copy-link-btn').addEventListener('click', () => {
  const url = document.getElementById('tracking-url').textContent;
  if (url && url !== '—') copyToClipboard(url, 'copy-link-btn');
});

// ── Init ──────────────────────────────────────
async function init() {
  apiConfig = await window.electronAPI.getApiConfig();
  const shared = await window.electronAPI.getSharedData();

  orderId   = shared.orderId;
  orderCode = shared.orderCode;

  if (!orderId || !orderCode) {
    await window.electronAPI.navigate('dashboard');
    return;
  }

  await loadOrderDetail();
  if (window.DPCloud && window.DPCloud.watchOrderByCode && orderId) { try { window.DPCloud.watchOrderByCode(orderId, function(){ loadOrderDetail(); }); } catch(e){} }
}

init();


// ── Plantillas (presets) de etapas ───────────────
function openPresetsModal(){ document.getElementById('presets-modal').style.display=''; renderPresets(); }
function closePresetsModal(){ document.getElementById('presets-modal').style.display='none'; }
async function renderPresets(){
  const box=document.getElementById('presets-list');
  box.innerHTML='<p style="color:var(--text-muted);font-size:.82rem;">Cargando…</p>';
  try{
    const presets=await window.DPCloud.listPresets();
    if(!presets.length){ box.innerHTML='<p style="color:var(--text-muted);font-size:.82rem;">Aún no hay plantillas. Crea una abajo.</p>'; return; }
    box.innerHTML=presets.map(function(p){
      var steps=p.steps||[];
      return '<div style="display:flex;align-items:center;gap:.6rem;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-sm);padding:.6rem .75rem;">'
        +'<div style="flex:1;min-width:0;"><div style="font-weight:600;font-size:.88rem;">'+escapeHtml(p.name)+'</div>'
        +'<div style="font-size:.74rem;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+steps.length+' etapas · '+escapeHtml(steps.join(' → '))+'</div></div>'
        +'<button class="btn btn-primary btn-sm" onclick="applyPreset(\''+p.id+'\')">Aplicar</button>'
        +'<button class="btn btn-ghost btn-sm" onclick="removePreset(\''+p.id+'\')" title="Eliminar">🗑️</button></div>';
    }).join('');
  }catch(e){ box.innerHTML='<p style="color:var(--error);font-size:.82rem;">Error al cargar plantillas.</p>'; }
}
async function savePreset(){
  var name=document.getElementById('preset-name').value.trim();
  var raw=document.getElementById('preset-steps').value;
  var steps=raw.split('\n').map(function(s){return s.trim();}).filter(function(s){return s;});
  if(!name){ showToast('Pon un nombre a la plantilla.','error'); return; }
  if(!steps.length){ showToast('Añade al menos una etapa.','error'); return; }
  try{
    await window.DPCloud.createPreset({name:name, steps:steps});
    document.getElementById('preset-name').value='';
    document.getElementById('preset-steps').value='';
    showToast('Plantilla "'+name+'" guardada.','success');
    renderPresets();
  }catch(e){ showToast('Error: '+e.message,'error'); }
}
async function removePreset(id){
  if(!confirm('¿Eliminar esta plantilla? No afecta a los pedidos ya creados.')) return;
  try{ await window.DPCloud.deletePreset(id); showToast('Plantilla eliminada.','success'); renderPresets(); }
  catch(e){ showToast('Error al eliminar.','error'); }
}
async function applyPreset(id){
  try{
    var presets=await window.DPCloud.listPresets();
    var p=presets.filter(function(x){return x.id===id;})[0];
    if(!p||!p.steps||!p.steps.length) return;
    var steps=(currentOrder&&currentOrder.order_steps)||[];
    var base = steps.length ? Math.max.apply(null, steps.map(function(s){return s.order_index||0;}))+1 : 0;
    closePresetsModal();
    showToast('Aplicando "'+p.name+'"…','info');
    for(var i=0;i<p.steps.length;i++){
      await window.DPCloud.addStep(orderId, { step_name: p.steps[i], order_index: base+i });
    }
    await loadOrderDetail();
    showToast('Plantilla "'+p.name+'" aplicada ('+p.steps.length+' etapas).','success');
  }catch(e){ showToast('Error: '+e.message,'error'); }
}
document.addEventListener('click', function(e){ var m=document.getElementById('presets-modal'); if(m && e.target===m) closePresetsModal(); });

// Exponer funciones globales
window.goBack           = goBack;
window.loadOrderDetail  = loadOrderDetail;
window.toggleStep       = toggleStep;
window.openAddStepModal = openAddStepModal;
window.closeAddStepModal = closeAddStepModal;
window.addStep          = addStep;
window.deleteStep       = deleteStep;
window.openPresetsModal = openPresetsModal;
window.closePresetsModal= closePresetsModal;
window.savePreset       = savePreset;
window.removePreset     = removePreset;
window.applyPreset      = applyPreset;

window.toggleSidebar = function(){ var l=document.querySelector(".app-layout"); if(l) l.classList.toggle("side-collapsed"); };
