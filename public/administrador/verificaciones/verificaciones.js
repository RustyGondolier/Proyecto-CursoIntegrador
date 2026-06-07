let allPendientes = [];
let selectedUserId = null;

async function init() {
  if (!isAuthenticated()) {
    window.location.href = '/auth/login.html';
    return;
  }

  await loadLayout();
  bindDetailModal();
  bindSuspendModal();
  await loadPendientes();
}

async function loadPendientes() {
  const list = document.getElementById('verList');
  list.innerHTML = '<p class="empty-state">Cargando...</p>';

  try {
    allPendientes = await listarPendientes();
  } catch {
    allPendientes = [];
    list.innerHTML = '<p class="empty-state">No se pudieron cargar los pendientes.</p>';
    return;
  }

  renderPendientes();
}

function renderPendientes() {
  const list = document.getElementById('verList');
  const count = document.getElementById('verCount');

  count.textContent = allPendientes.length;

  if (allPendientes.length === 0) {
    list.innerHTML = '<p class="empty-state">No hay perfiles pendientes de verificación.</p>';
    return;
  }

  list.innerHTML =
    '<div class="ver-list-items">' +
      '<div class="ver-row ver-header-row">' +
        '<span class="ver-col">Usuario</span>' +
        '<span class="ver-col ver-col-rol">Rol</span>' +
        '<span class="ver-col ver-col-vehiculos">Vehículos</span>' +
        '<span class="ver-col">Código</span>' +
        '<span class="ver-col ver-col-fecha">Registrado</span>' +
      '</div>' +
      allPendientes.map(createItem).join('') +
    '</div>';
}

function createItem(u) {
  const fecha = u.creado_en ? formatDate(u.creado_en) : '—';
  const placas = (u.vehiculos || []).map(function(v) {
    return '<span class="ver-placa-badge">' + escapeHtml(v.placa) + '</span>';
  }).join('');

  return (
    '<div class="ver-row" data-id="' + u.id + '">' +
      '<span class="ver-col">' +
        '<span class="ver-user">' +
          '<span class="ver-user-name">' + escapeHtml(u.nombre) + '</span>' +
          '<span class="ver-user-code">' + escapeHtml(u.correo_institucional || '') + '</span>' +
        '</span>' +
      '</span>' +
      '<span class="ver-col ver-col-rol">' + escapeHtml(u.rol) + '</span>' +
      '<span class="ver-col ver-col-vehiculos"><span class="ver-placas">' + (placas || '<span style="color:var(--color-text-light)">—</span>') + '</span></span>' +
      '<span class="ver-col">' + escapeHtml(u.codigo_universitario) + '</span>' +
      '<span class="ver-col ver-col-fecha">' + fecha + '</span>' +
    '</div>'
  );
}

/* MODAL DETALLE */

function openDetailModal() {
  var modal = document.getElementById('detailModal');
  modal.classList.add('open');
}

function closeDetailModal() {
  var modal = document.getElementById('detailModal');
  modal.classList.remove('open');
}

function openSuspendModal() {
  var modal = document.getElementById('suspendModal');
  modal.classList.add('open');
}

function closeSuspendModal() {
  var modal = document.getElementById('suspendModal');
  modal.classList.remove('open');
  document.getElementById('suspendMotivo').value = '';
  document.getElementById('suspendError').style.display = 'none';
}

function bindDetailModal() {
  document.querySelectorAll('[data-close-modal]').forEach(function(el) {
    el.addEventListener('click', function() {
      closeDetailModal();
      closeSuspendModal();
    });
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeDetailModal();
      closeSuspendModal();
    }
  });

  document.addEventListener('click', function(e) {
    var row = e.target.closest('.ver-row:not(.ver-header-row)');
    if (!row) return;
    var id = Number(row.dataset.id);
    if (id) openDetalle(id);
  });

  document.getElementById('detailBody').addEventListener('click', function(e) {
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    var id = Number(btn.dataset.id);
    if (!id) return;
    if (btn.dataset.action === 'aprobar') handleAprobar(id);
    if (btn.dataset.action === 'suspender') {
      selectedUserId = id;
      var user = allPendientes.find(function(u) { return u.id === id; });
      document.getElementById('suspendUserName').textContent = user ? user.nombre : '—';
      openSuspendModal();
    }
  });
}

function bindSuspendModal() {
  document.getElementById('confirmSuspendBtn').addEventListener('click', function() {
    if (selectedUserId) handleSuspender(selectedUserId);
  });

  document.getElementById('suspendMotivo').addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.ctrlKey) {
      if (selectedUserId) handleSuspender(selectedUserId);
    }
  });
}

async function openDetalle(id) {
  var body = document.getElementById('detailBody');
  body.innerHTML = '<p class="empty-state">Cargando detalle...</p>';
  openDetailModal();

  try {
    var u = await obtenerUsuario(id);
    renderDetalle(u);
  } catch {
    body.innerHTML = '<p class="empty-state" style="color:var(--color-primary)">Error al cargar el detalle del usuario.</p>';
  }
}

function renderDetalle(u) {
  var body = document.getElementById('detailBody');
  var fechaReg = u.creado_en ? formatDate(u.creado_en) : '—';
  var licenciaStr = u.nro_licencia ? u.nro_licencia + ' (vence: ' + (u.licencia_fecha_vencimiento ? formatDate(u.licencia_fecha_vencimiento) : '—') + ')' : '—';

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
              '<td>' + (v.activo ? 'Sí' : '—') + '</td>' +
            '</tr>';
          }).join('') +
        '</tbody>' +
      '</table>';
  } else {
    vehiclesHtml = '<span style="color:var(--color-text-light)">Sin vehículos registrados</span>';
  }

  body.innerHTML =
    '<div class="detail-head">' +
      '<span class="detail-status detail-status-pendiente">Pendiente de verificación</span>' +
    '</div>' +

    '<div class="detail-card">' +
      '<h3 class="detail-section-title">Datos personales</h3>' +
      '<div class="detail-grid-2col">' +
        field('Nombre', u.nombre) +
        field('Código universitario', u.codigo_universitario) +
        field('Rol', u.rol) +
        field('DNI', u.dni || '—') +
        field('Fecha de nacimiento', u.fecha_nacimiento ? formatDate(u.fecha_nacimiento) : '—') +
        field('Teléfono', u.telefono || '—') +
        field('Correo institucional', u.correo_institucional || '—') +
        field('Registrado el', fechaReg) +
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
        field('Verificado', u.conadis_verificado ? 'Sí' : '—') +
      '</div>' +
    '</div>' +

    '<div class="detail-card">' +
      '<h3 class="detail-section-title">Vehículos</h3>' +
      vehiclesHtml +
    '</div>' +

    '<div class="detail-actions">' +
      '<button class="btn btn-primary" data-action="aprobar" data-id="' + u.id + '">Aprobar perfil</button>' +
      '<button class="btn btn-danger" data-action="suspender" data-id="' + u.id + '">Suspender cuenta</button>' +
    '</div>';
}

function field(label, value) {
  return (
    '<div class="detail-field">' +
      '<span class="detail-label">' + escapeHtml(label) + '</span>' +
      '<span class="detail-value">' + value + '</span>' +
    '</div>'
  );
}

async function handleAprobar(id) {
  var btn = document.querySelector('.detail-actions .btn-primary');
  btn.disabled = true;
  btn.textContent = 'Aprobando...';

  try {
    await aprobarUsuario(id);
    showSuccessToast('Perfil aprobado exitosamente');
    closeDetailModal();
    await loadPendientes();
  } catch (e) {
    showErrorToast(e.message || 'Error al aprobar el perfil');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Aprobar perfil';
  }
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
    showSuccessToast('Cuenta suspendida exitosamente');
    closeSuspendModal();
    closeDetailModal();
    await loadPendientes();
  } catch (e) {
    errBox.textContent = e.message || 'Error al suspender la cuenta';
    errBox.style.display = 'block';
    showErrorToast('Error al suspender la cuenta');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Suspender cuenta';
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

init();
