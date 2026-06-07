let allReportes = [];

async function init() {
  if (!isAuthenticated()) {
    window.location.href = '/auth/login.html';
    return;
  }

  await loadLayout();
  bindModals();
  await loadReportes();
}

async function loadReportes() {
  const container = document.getElementById('incTableContainer');
  container.innerHTML = '<p class="empty-state">Cargando...</p>';

  try {
    allReportes = await listarReportesPrioritarios();
  } catch {
    allReportes = [];
    container.innerHTML = '<p class="empty-state">No se pudieron cargar los reportes prioritarios.</p>';
    return;
  }

  renderTabla();
}

function renderTabla() {
  const container = document.getElementById('incTableContainer');
  const count = document.getElementById('incCount');

  count.textContent = allReportes.length;

  if (allReportes.length === 0) {
    container.innerHTML = '<p class="empty-state">No hay reportes prioritarios pendientes.</p>';
    return;
  }

  container.innerHTML =
    '<div class="inc-table">' +
      '<div class="inc-row inc-header-row">' +
        '<span class="inc-col inc-col-usuario">Usuario</span>' +
        '<span class="inc-col inc-col-estacionamiento">Estacionamiento</span>' +
        '<span class="inc-col inc-col-plaza">Plaza</span>' +
        '<span class="inc-col inc-col-supervisor">Supervisor</span>' +
        '<span class="inc-col inc-col-fecha">Fecha</span>' +
        '<span class="inc-col inc-col-accion">Accion</span>' +
      '</div>' +
      allReportes.map(createRow).join('') +
    '</div>';
}

function createRow(r) {
  var fecha = r.creado_en ? formatDate(r.creado_en) : '—';
  var plazaStr = r.letra_bloque ? r.letra_bloque + '-' + r.numero_plaza : (r.plaza_codigo || '—');

  return (
    '<div class="inc-row" data-id="' + r.id + '">' +
      '<span class="inc-col inc-col-usuario">' +
        '<span class="inc-user">' +
          '<span class="inc-user-name">' + escapeHtml(r.usuario_nombre) + '</span>' +
          '<span class="inc-user-code">' + escapeHtml(r.usuario_codigo) + '</span>' +
        '</span>' +
      '</span>' +
      '<span class="inc-col inc-col-estacionamiento">' + escapeHtml(r.estacionamiento_nombre || '—') + '</span>' +
      '<span class="inc-col inc-col-plaza">' + escapeHtml(plazaStr) + '</span>' +
      '<span class="inc-col inc-col-supervisor">' + escapeHtml(r.supervisor_nombre || '—') + '</span>' +
      '<span class="inc-col inc-col-fecha">' + fecha + '</span>' +
      '<span class="inc-col inc-col-accion">' +
        '<button class="btn btn-primary btn-xs btn-resolver" data-id="' + r.id + '">Resolver</button>' +
      '</span>' +
    '</div>'
  );
}

/* MODALS */

function openModal(id) {
  document.getElementById(id).classList.add('open');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

function closeAllModals() {
  closeModal('detailModal');
}

function bindModals() {
  document.addEventListener('click', function(e) {
    if (e.target.closest('[data-close-modal]')) {
      closeAllModals();
    }
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeAllModals();
  });

  document.getElementById('incTableContainer').addEventListener('click', function(e) {
    var btn = e.target.closest('.btn-resolver');
    if (btn) {
      var id = Number(btn.dataset.id);
      if (id) openDetalle(id);
      return;
    }

    var row = e.target.closest('.inc-row:not(.inc-header-row)');
    if (!row) return;
    var id = Number(row.dataset.id);
    if (id) openDetalle(id);
  });
}

/* DETALLE */

async function openDetalle(id) {
  var body = document.getElementById('detailBody');
  body.innerHTML = '<p class="empty-state">Cargando detalle...</p>';
  openModal('detailModal');

  try {
    var r = allReportes.find(function(x) { return x.id === id; });
    if (!r) throw new Error('Reporte no encontrado');
    renderDetalle(r);
  } catch {
    body.innerHTML = '<p class="empty-state" style="color:var(--color-primary)">Error al cargar el detalle del reporte.</p>';
  }
}

function renderDetalle(r) {
  var body = document.getElementById('detailBody');
  var fecha = r.creado_en ? formatDate(r.creado_en) : '—';
  var plazaStr = r.letra_bloque ? r.letra_bloque + '-' + r.numero_plaza : (r.plaza_codigo || '—');

  body.innerHTML =
    '<div class="detail-head">' +
      '<div>' +
        '<span class="inc-badge inc-badge-prioritario">Prioritario</span>' +
        '<span style="margin-left:8px;font-size:13px;color:var(--color-text-light)">#' + r.id + '</span>' +
      '</div>' +
      '<span style="font-size:13px;color:var(--color-text-light)">' + fecha + '</span>' +
    '</div>' +

    '<div class="detail-card detail-card-prioridad">' +
      '<h3 class="detail-section-title">Razon de prioridad</h3>' +
      '<p style="margin:0;font-size:14px;font-weight:500">' + escapeHtml(r.razon_prioridad || 'No se especifico') + '</p>' +
    '</div>' +

    '<div class="detail-card">' +
      '<h3 class="detail-section-title">Descripcion del reporte</h3>' +
      '<p style="margin:0;font-size:14px">' + escapeHtml(r.descripcion || '—') + '</p>' +
    '</div>' +

    '<div class="detail-card">' +
      '<h3 class="detail-section-title">Datos del usuario</h3>' +
      '<div class="detail-grid-2col">' +
        field('Nombre', r.usuario_nombre) +
        field('Codigo', r.usuario_codigo) +
        field('Rol', r.usuario_rol) +
        field('Correo', r.usuario_correo || '—') +
      '</div>' +
    '</div>' +

    '<div class="detail-card">' +
      '<h3 class="detail-section-title">Ubicacion</h3>' +
      '<div class="detail-grid-2col">' +
        field('Estacionamiento', r.estacionamiento_nombre || '—') +
        field('Plaza', plazaStr) +
      '</div>' +
    '</div>' +

    '<div class="detail-card">' +
      '<h3 class="detail-section-title">Registrado por</h3>' +
      '<p style="margin:0;font-size:14px">' + escapeHtml(r.supervisor_nombre || '—') + '</p>' +
    '</div>' +

    '<div class="detail-actions">' +
      '<button class="btn btn-primary" id="confirmResolverBtn" data-id="' + r.id + '">Marcar como resuelto</button>' +
      '<button class="btn btn-secondary" data-close-modal>Cerrar</button>' +
    '</div>';

  document.getElementById('confirmResolverBtn').addEventListener('click', function() {
    var id = Number(this.dataset.id);
    if (id) handleResolver(id);
  });
}

async function handleResolver(id) {
  var btn = document.getElementById('confirmResolverBtn');
  btn.disabled = true;
  btn.textContent = 'Resolviendo...';

  try {
    await resolverReporteAdmin(id);
    closeModal('detailModal');
    showSuccessToast('Reporte resuelto exitosamente');
    await loadReportes();
  } catch (e) {
    showErrorToast(e.message || 'Error al resolver el reporte');
    btn.disabled = false;
    btn.textContent = 'Marcar como resuelto';
  }
}

/* TOAST */

function showSuccessToast(msg) {
  var toast = document.getElementById('successToast');
  toast.textContent = msg;
  toast.style.display = 'block';
  setTimeout(function() { toast.style.display = 'none'; }, 4000);
}

function showErrorToast(msg) {
  var toast = document.getElementById('errorToast');
  toast.textContent = msg;
  toast.style.display = 'block';
  setTimeout(function() { toast.style.display = 'none'; }, 4000);
}

/* UTILIDADES */

function formatDate(dateStr) {
  if (!dateStr) return '—';
  var d = new Date(dateStr);
  var fecha = d.toLocaleDateString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
  var hora = d.toLocaleTimeString('es-PE', {
    hour: '2-digit', minute: '2-digit'
  });
  return fecha + '<br>' + hora;
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function field(label, value) {
  return (
    '<div class="detail-field">' +
      '<span class="detail-label">' + escapeHtml(label) + '</span>' +
      '<span class="detail-value">' + value + '</span>' +
    '</div>'
  );
}

init();
