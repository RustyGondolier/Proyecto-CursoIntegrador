let allInfracciones = [];
let selectedUserId = null;
let debounceTimer = null;

async function init() {
  if (!isAuthenticated()) {
    window.location.href = '/auth/login.html';
    return;
  }

  await loadLayout();
  bindModals();
  bindFilters();
  await loadInfracciones();
}

async function loadInfracciones(params) {
  const container = document.getElementById('infTableContainer');
  container.innerHTML = '<p class="empty-state">Cargando...</p>';

  try {
    allInfracciones = await listarInfraccionesAdmin(params || {});
  } catch {
    allInfracciones = [];
    container.innerHTML = '<p class="empty-state">No se pudieron cargar las infracciones.</p>';
    return;
  }

  renderTabla();
}

function renderTabla() {
  const container = document.getElementById('infTableContainer');
  const count = document.getElementById('infCount');

  count.textContent = allInfracciones.length;

  if (allInfracciones.length === 0) {
    container.innerHTML = '<p class="empty-state">No hay infracciones registradas.</p>';
    return;
  }

  container.innerHTML =
    '<div class="inf-table">' +
      '<div class="inf-row inf-header-row">' +
        '<span class="inf-col inf-col-tipo">Tipo</span>' +
        '<span class="inf-col inf-col-usuario">Usuario</span>' +
        '<span class="inf-col inf-col-placa">Placa</span>' +
        '<span class="inf-col inf-col-cochera">Cochera</span>' +
        '<span class="inf-col inf-col-fecha">Fecha</span>' +
      '</div>' +
      allInfracciones.map(createRow).join('') +
    '</div>';
}

function createRow(i) {
  const fecha = i.creado_en ? formatDate(i.creado_en) : '—';
  const badgeClass = 'inf-badge inf-badge-' + (i.tipo_codigo || 'default');

  return (
    '<div class="inf-row" data-id="' + i.id + '">' +
      '<span class="inf-col inf-col-tipo">' +
        '<span class="' + badgeClass + '">' + escapeHtml(i.tipo_descripcion || i.tipo_codigo) + '</span>' +
      '</span>' +
      '<span class="inf-col inf-col-usuario">' +
        '<span class="inf-user">' +
          '<span class="inf-user-name">' + escapeHtml(i.usuario_nombre) + '</span>' +
          '<span class="inf-user-code">' + escapeHtml(i.usuario_codigo) + '</span>' +
        '</span>' +
      '</span>' +
      '<span class="inf-col inf-col-placa">' +
        '<span class="inf-placa-badge">' + escapeHtml(i.placa || '—') + '</span>' +
      '</span>' +
      '<span class="inf-col inf-col-cochera">' + escapeHtml(i.estacionamiento_nombre || '—') + '</span>' +
      '<span class="inf-col inf-col-fecha">' + fecha + '</span>' +
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
  closeModal('suspendModal');
  closeModal('reactivarModal');
}

function closeSuspendModal() {
  closeModal('suspendModal');
  document.getElementById('suspendMotivo').value = '';
  document.getElementById('suspendError').style.display = 'none';
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

  document.getElementById('confirmSuspendBtn').addEventListener('click', function() {
    if (selectedUserId) handleSuspender(selectedUserId);
  });

  document.getElementById('confirmReactivarBtn').addEventListener('click', function() {
    if (selectedUserId) handleReactivar(selectedUserId);
  });

  document.getElementById('suspendMotivo').addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.ctrlKey && selectedUserId) {
      handleSuspender(selectedUserId);
    }
  });

  document.getElementById('infTableContainer').addEventListener('click', function(e) {
    var row = e.target.closest('.inf-row:not(.inf-header-row)');
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
    var inf = await obtenerInfraccionAdmin(id);
    renderDetalle(inf);
  } catch {
    body.innerHTML = '<p class="empty-state" style="color:var(--color-primary)">Error al cargar el detalle de la infraccion.</p>';
  }
}

function renderDetalle(inf) {
  var body = document.getElementById('detailBody');

  var fecha = inf.creado_en ? formatDate(inf.creado_en) : '—';
  var badgeClass = 'inf-badge inf-badge-' + (inf.tipo_codigo || 'default');

  var usuarioEstadoBadge = inf.usuario_estado === 'activa'
    ? '<span class="inf-badge inf-badge-activa">Activa</span>'
    : '<span class="inf-badge inf-badge-suspendida">Suspendida</span>';

  body.innerHTML =
    '<div class="detail-head">' +
      '<div>' +
        '<span class="' + badgeClass + '" style="font-size:13px;padding:4px 14px">' + escapeHtml(inf.tipo_descripcion || inf.tipo_codigo) + '</span>' +
      '</div>' +
      '<span style="font-size:13px;color:var(--color-text-light)">' + fecha + '</span>' +
    '</div>' +

    (inf.descripcion ? (
      '<div class="detail-card">' +
        '<h3 class="detail-section-title">Descripcion</h3>' +
        '<p style="margin:0;font-size:14px">' + escapeHtml(inf.descripcion) + '</p>' +
      '</div>'
    ) : '') +

    '<div class="detail-card">' +
      '<h3 class="detail-section-title">Datos del usuario</h3>' +
      '<div class="detail-grid-2col">' +
        field('Nombre', inf.usuario_nombre) +
        field('Codigo', inf.usuario_codigo) +
        field('Correo', inf.usuario_correo || '—') +
        field('Estado', usuarioEstadoBadge) +
      '</div>' +
    '</div>' +

    '<div class="detail-card">' +
      '<h3 class="detail-section-title">Vehiculo</h3>' +
      '<div class="detail-grid-2col">' +
        field('Placa', inf.placa || '—') +
        field('Modelo', inf.modelo || '—') +
      '</div>' +
    '</div>' +

    '<div class="detail-card">' +
      '<h3 class="detail-section-title">Ubicacion</h3>' +
      '<div class="detail-grid-2col">' +
        field('Estacionamiento', inf.estacionamiento_nombre || '—') +
        field('Plaza', (inf.letra_bloque ? inf.letra_bloque + '-' + inf.numero_plaza : inf.plaza_codigo || '—')) +
      '</div>' +
    '</div>' +

    '<div class="detail-card">' +
      '<h3 class="detail-section-title">Registrado por</h3>' +
      '<p style="margin:0;font-size:14px">' + escapeHtml(inf.supervisor_nombre || '—') + '</p>' +
    '</div>' +

    '<div class="detail-actions">' +
      (inf.usuario_estado === 'activa'
        ? '<button class="btn btn-danger" data-action="suspender" data-id="' + inf.usuario_id + '">Suspender cuenta</button>'
        : '<button class="btn btn-success" data-action="reactivar" data-id="' + inf.usuario_id + '">Reactivar cuenta</button>'
      ) +
      '<button class="btn btn-secondary" data-close-modal>Cerrar</button>' +
    '</div>';

  bindDetailActions();
}

function bindDetailActions() {
  var body = document.getElementById('detailBody');
  body.addEventListener('click', function(e) {
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    var id = Number(btn.dataset.id);
    if (!id) return;
    selectedUserId = id;

    if (btn.dataset.action === 'suspender') {
      var userName = 'el usuario';
      try {
        var modal = document.getElementById('detailBody');
        var nameEl = modal.querySelector('.detail-field:first-child .detail-value');
        if (nameEl) userName = nameEl.textContent;
      } catch (err) { console.warn('Error al obtener nombre de usuario:', err); }
      document.getElementById('suspendUserName').textContent = userName;
      openModal('suspendModal');
    }

    if (btn.dataset.action === 'reactivar') {
      document.getElementById('reactivarInfo').innerHTML =
        '¿Estas seguro de reactivar la cuenta de <strong>' + (getUserNameFromDetail() || 'el usuario') + '</strong>?';
      openModal('reactivarModal');
    }
  });
}

function getUserNameFromDetail() {
  try {
    var body = document.getElementById('detailBody');
    var nameEl = body.querySelector('.detail-card:first-of-type .detail-field:first-child .detail-value');
    return nameEl ? nameEl.textContent.trim() : null;
  } catch (err) { console.warn('Error al obtener nombre desde detalle:', err);
    return null;
  }
}

async function handleSuspender(id) {
  var motivo = document.getElementById('suspendMotivo').value.trim();
  var errBox = document.getElementById('suspendError');

  if (motivo.length < 5) {
    errBox.textContent = 'Debe indicar un motivo (minimo 5 caracteres).';
    errBox.style.display = 'block';
    return;
  }
  errBox.style.display = 'none';

  var btn = document.getElementById('confirmSuspendBtn');
  btn.disabled = true;
  btn.textContent = 'Suspendiendo...';

  try {
    await suspenderUsuario(id, motivo);
    closeSuspendModal();
    closeModal('detailModal');
    showSuccessToast('Cuenta suspendida exitosamente');
    await loadInfracciones(getCurrentFilters());
  } catch (e) {
    const esRed = e instanceof TypeError;
    const mensaje = esRed
      ? 'No se puede conectar con el servidor. Intente nuevamente.'
      : (e.message || 'Error al suspender la cuenta');
    errBox.textContent = mensaje;
    errBox.style.display = 'block';
    showErrorToast(mensaje);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Suspender cuenta';
  }
}

async function handleReactivar(id) {
  var errBox = document.getElementById('reactivarError');
  errBox.style.display = 'none';

  var btn = document.getElementById('confirmReactivarBtn');
  btn.disabled = true;
  btn.textContent = 'Reactivando...';

  try {
    await reactivarUsuario(id);
    closeModal('reactivarModal');
    closeModal('detailModal');
    showSuccessToast('Cuenta reactivada exitosamente');
    await loadInfracciones(getCurrentFilters());
  } catch (e) {
    const esRed = e instanceof TypeError;
    const mensaje = esRed
      ? 'No se puede conectar con el servidor. Intente nuevamente.'
      : (e.message || 'Error al reactivar la cuenta');
    errBox.textContent = mensaje;
    errBox.style.display = 'block';
    showErrorToast(mensaje);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Reactivar cuenta';
  }
}

/* FILTERS */

function bindFilters() {
  document.getElementById('searchInput').addEventListener('input', function() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(applyFilters, 300);
  });

  document.getElementById('filterTipo').addEventListener('change', applyFilters);
  document.getElementById('filterUserEstado').addEventListener('change', applyFilters);
  document.getElementById('filterFechaDesde').addEventListener('change', applyFilters);
  document.getElementById('filterFechaHasta').addEventListener('change', applyFilters);
}

function getCurrentFilters() {
  var params = {};
  var search = document.getElementById('searchInput').value.trim();
  var tipo = document.getElementById('filterTipo').value;
  var userEstado = document.getElementById('filterUserEstado').value;
  var fechaDesde = document.getElementById('filterFechaDesde').value;
  var fechaHasta = document.getElementById('filterFechaHasta').value;

  if (search) params.usuario_search = search;
  if (tipo) params.tipo_id = tipo;
  if (userEstado) params.usuario_estado = userEstado;
  if (fechaDesde) params.fecha_desde = fechaDesde;
  if (fechaHasta) params.fecha_hasta = fechaHasta;

  return params;
}

function applyFilters() {
  loadInfracciones(getCurrentFilters());
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

/*
 * testSuspender — SOLO PARA EVALUACION (RF16 CP03)
 * Fuerza error "cuenta ya suspendida" desde consola.
 * Modo de uso: testSuspender(ID_USUARIO)
 */
window.testSuspender = async function(userId) {
  try {
    await suspenderUsuario(userId, 'testing');
  } catch (e) {
    showErrorToast(
      e instanceof TypeError
        ? 'No se puede conectar con el servidor. Intente nuevamente.'
        : (e.message || 'Error al suspender la cuenta')
    );
  }
};

init();
