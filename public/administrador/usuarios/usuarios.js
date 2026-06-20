let allUsuarios = [];
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
  await loadUsuarios();
}

async function loadUsuarios(params) {
  const container = document.getElementById('usrTableContainer');
  container.innerHTML = '<p class="empty-state">Cargando...</p>';

  try {
    allUsuarios = await listarUsuarios(params || {});
  } catch {
    allUsuarios = [];
    container.innerHTML = '<p class="empty-state">No se pudieron cargar los usuarios.</p>';
    return;
  }

  renderTabla();
}

function renderTabla() {
  const container = document.getElementById('usrTableContainer');
  const count = document.getElementById('usrCount');

  count.textContent = allUsuarios.length;

  if (allUsuarios.length === 0) {
    container.innerHTML = '<p class="empty-state">No se encontraron usuarios.</p>';
    return;
  }

  container.innerHTML =
    '<div class="usr-table">' +
      '<div class="usr-row usr-header-row">' +
        '<span class="usr-col usr-col-nombre">Nombre</span>' +
        '<span class="usr-col usr-col-codigo">Código</span>' +
        '<span class="usr-col usr-col-rol">Rol</span>' +
        '<span class="usr-col usr-col-estado">Estado</span>' +
        '<span class="usr-col usr-col-acciones">Acciones</span>' +
      '</div>' +
      allUsuarios.map(createRow).join('') +
    '</div>';
}

function createRow(u) {
  const estadoBadge = u.estado_cuenta === 'activa'
    ? '<span class="usr-badge usr-badge-activa">Activa</span>'
    : '<span class="usr-badge usr-badge-suspendida">Suspendida</span>';

  const acciones = u.estado_cuenta === 'activa'
    ? '<button class="btn btn-danger btn-xs" data-action="suspender" data-id="' + u.id + '">Suspender</button>'
    : '<button class="btn btn-success btn-xs" data-action="reactivar" data-id="' + u.id + '">Reactivar</button>';

  return (
    '<div class="usr-row" data-id="' + u.id + '">' +
      '<span class="usr-col usr-col-nombre">' +
        '<span class="usr-user">' +
          '<span class="usr-user-name">' + escapeHtml(u.nombre) + '</span>' +
        '</span>' +
      '</span>' +
      '<span class="usr-col usr-col-codigo">' + escapeHtml(u.codigo_universitario) + '</span>' +
      '<span class="usr-col usr-col-rol">' + escapeHtml(u.rol) + '</span>' +
      '<span class="usr-col usr-col-estado">' + estadoBadge + '</span>' +
      '<span class="usr-col usr-col-acciones">' + acciones + '</span>' +
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
  closeSuspendModal();
  closeReactivarModal();
}

function closeSuspendModal() {
  closeModal('suspendModal');
  document.getElementById('suspendMotivo').value = '';
  document.getElementById('suspendError').style.display = 'none';
}

function closeReactivarModal() {
  closeModal('reactivarModal');
  document.getElementById('reactivarError').style.display = 'none';
}

function bindModals() {
  document.querySelectorAll('[data-close-modal]').forEach(function(el) {
    el.addEventListener('click', closeAllModals);
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

  document.getElementById('usrTableContainer').addEventListener('click', function(e) {
    var btn = e.target.closest('[data-action]');
    if (btn) {
      var id = Number(btn.dataset.id);
      if (!id) return;
      var user = allUsuarios.find(function(u) { return u.id === id; });
      if (!user) return;
      selectedUserId = id;

      if (btn.dataset.action === 'suspender') {
        document.getElementById('suspendUserName').textContent = user.nombre;
        openModal('suspendModal');
      }
      if (btn.dataset.action === 'reactivar') {
        document.getElementById('reactivarInfo').innerHTML =
          '¿Estás seguro de reactivar la cuenta de <strong>' + escapeHtml(user.nombre) + '</strong>?';
        openModal('reactivarModal');
      }
      return;
    }

    var row = e.target.closest('.usr-row:not(.usr-header-row)');
    if (!row) return;
    var id = Number(row.dataset.id);
    if (id) openDetalle(id);
  });
}

async function handleSuspender(id) {
  var motivo = document.getElementById('suspendMotivo').value.trim();
  var errBox = document.getElementById('suspendError');

  if (motivo.length < 5) {
    errBox.textContent = 'Debe indicar un motivo (mínimo 5 caracteres).';
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
    await loadUsuarios(getCurrentFilters());
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
    closeReactivarModal();
    closeModal('detailModal');
    showSuccessToast('Cuenta reactivada exitosamente');
    await loadUsuarios(getCurrentFilters());
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

/* DETALLE */

async function openDetalle(id) {
  var body = document.getElementById('detailBody');
  body.innerHTML = '<p class="empty-state">Cargando detalle...</p>';
  openModal('detailModal');

  try {
    var u = await obtenerUsuario(id);
    renderDetalle(u);
  } catch {
    body.innerHTML = '<p class="empty-state" style="color:var(--color-primary)">Error al cargar el detalle del usuario.</p>';
  }
}

function renderDetalle(u) {
  var body = document.getElementById('detailBody');

  var estadoBadge = u.estado_cuenta === 'activa'
    ? '<span class="usr-badge usr-badge-activa" style="font-size:13px;padding:4px 14px">Activa</span>'
    : '<span class="usr-badge usr-badge-suspendida" style="font-size:13px;padding:4px 14px">Suspendida</span>';

  var motivoHtml = '';
  if (u.motivo_suspension) {
    motivoHtml = '<div class="detail-card detail-card-warn">' +
      '<h3 class="detail-section-title">Motivo de suspensión</h3>' +
      '<p style="margin:0;font-size:14px">' + escapeHtml(u.motivo_suspension) + '</p>' +
    '</div>';
  }

  var fechaReg = u.creado_en ? formatDate(u.creado_en) : '—';
  var licenciaStr = u.nro_licencia
    ? u.nro_licencia + ' (vence: ' + (u.licencia_fecha_vencimiento ? formatDate(u.licencia_fecha_vencimiento) : '—') + ')'
    : '—';

  var vehiclesHtml = '';
  if (u.vehiculos && u.vehiculos.length) {
    vehiclesHtml =
      '<table class="detail-vehicles-table">' +
        '<thead><tr><th>Tipo</th><th>Placa</th><th>Modelo</th><th>Activo</th></tr></thead>' +
        '<tbody>' +
          u.vehiculos.map(function(v) {
            return '<tr>' +
              '<td>' + escapeHtml(v.tipo) + '</td>' +
              '<td><strong>' + escapeHtml(v.placa) + '</strong></td>' +
              '<td>' + escapeHtml(v.modelo || '—') + '</td>' +
              '<td>' + (v.activo ? '✅' : '—') + '</td>' +
            '</tr>';
          }).join('') +
        '</tbody>' +
      '</table>';
  } else {
    vehiclesHtml = '<span style="color:var(--color-text-light)">Sin vehículos registrados</span>';
  }

  body.innerHTML =
    '<div class="detail-head">' +
      '<div>' +
        '<h3 style="margin:0;font-size:18px">' + escapeHtml(u.nombre) + '</h3>' +
        '<span style="color:var(--color-text-light);font-size:13px">' + escapeHtml(u.codigo_universitario) + '</span>' +
      '</div>' +
      estadoBadge +
    '</div>' +

    motivoHtml +

    '<div class="detail-card">' +
      '<h3 class="detail-section-title">Datos personales</h3>' +
      '<div class="detail-grid-2col">' +
        field('Rol', u.rol) +
        field('DNI', u.dni || '—') +
        field('Fecha de nacimiento', u.fecha_nacimiento ? formatDate(u.fecha_nacimiento) : '—') +
        field('Teléfono', u.telefono || '—') +
        field('Correo institucional', u.correo_institucional || '—') +
        field('Registrado el', fechaReg) +
        field('Verificado', u.verificado ? '✅ Sí' : '❌ No') +
        field('Requiere reverificación', u.requiere_reverificacion ? '⚠️ Sí' : '—') +
      '</div>' +
    '</div>' +

    '<div class="detail-card">' +
      '<h3 class="detail-section-title">Licencia de conducir</h3>' +
      '<div class="detail-grid-2col">' +
        field('N° Licencia', u.nro_licencia || '—') +
        field('Vencimiento', u.licencia_fecha_vencimiento ? formatDate(u.licencia_fecha_vencimiento) : '—') +
      '</div>' +
    '</div>' +

    '<div class="detail-card">' +
      '<h3 class="detail-section-title">CONADIS</h3>' +
      '<div class="detail-grid-2col">' +
        field('Código CONADIS', u.codigo_conadis || '—') +
        field('Verificado', u.conadis_verificado ? '✅ Sí' : '—') +
      '</div>' +
    '</div>' +

    '<div class="detail-card">' +
      '<h3 class="detail-section-title">Vehículos</h3>' +
      vehiclesHtml +
    '</div>' +

    '<div class="detail-actions">' +
      (u.estado_cuenta === 'activa'
        ? '<button class="btn btn-danger" data-action="suspender" data-id="' + u.id + '">Suspender cuenta</button>'
        : '<button class="btn btn-success" data-action="reactivar" data-id="' + u.id + '">Reactivar cuenta</button>'
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
    var user = allUsuarios.find(function(u) { return u.id === id; });
    if (!user) return;
    selectedUserId = id;

    if (btn.dataset.action === 'suspender') {
      document.getElementById('suspendUserName').textContent = user.nombre;
      openModal('suspendModal');
    }
    if (btn.dataset.action === 'reactivar') {
      document.getElementById('reactivarInfo').innerHTML =
        '¿Estás seguro de reactivar la cuenta de <strong>' + escapeHtml(user.nombre) + '</strong>?';
      openModal('reactivarModal');
    }
  });
}

function field(label, value) {
  return (
    '<div class="detail-field">' +
      '<span class="detail-label">' + escapeHtml(label) + '</span>' +
      '<span class="detail-value">' + value + '</span>' +
    '</div>'
  );
}

/* FILTERS */

function bindFilters() {
  document.getElementById('searchInput').addEventListener('input', function() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(applyFilters, 300);
  });

  document.getElementById('filterRol').addEventListener('change', applyFilters);
  document.getElementById('filterEstado').addEventListener('change', applyFilters);
  document.getElementById('filterFechaDesde').addEventListener('change', applyFilters);
  document.getElementById('filterFechaHasta').addEventListener('change', applyFilters);
}

function getCurrentFilters() {
  var params = {};
  var search = document.getElementById('searchInput').value.trim();
  var rol = document.getElementById('filterRol').value;
  var estado = document.getElementById('filterEstado').value;
  var fechaDesde = document.getElementById('filterFechaDesde').value;
  var fechaHasta = document.getElementById('filterFechaHasta').value;

  if (search) params.search = search;
  if (rol) params.rol = rol;
  if (estado) params.estado = estado;
  if (fechaDesde) params.fecha_desde = fechaDesde;
  if (fechaHasta) params.fecha_hasta = fechaHasta;

  return params;
}

function applyFilters() {
  loadUsuarios(getCurrentFilters());
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
  return new Date(dateStr).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
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
