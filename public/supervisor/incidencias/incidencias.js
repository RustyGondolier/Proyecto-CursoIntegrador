let allReportes = [];
let currentFiltro = '';

const ESTADOS = {
  enviado:      { label: 'Pendiente' },
  en_revision:  { label: 'En atención' },
  resuelto:     { label: 'Resuelto' },
  prioritario:  { label: 'Prioritario' },
  cancelado:    { label: 'Cancelado' }
};

async function init() {
  if (!isAuthenticated()) {
    window.location.href = '/auth/login.html';
    return;
  }

  await loadLayout();
  bindFilters();
  bindModal();
  await loadReportes();
}

/* FILTROS */

function bindFilters() {
  const container = document.getElementById('incFilters');
  container.addEventListener('click', function(e) {
    const btn = e.target.closest('.inc-filter');
    if (!btn) return;

    container.querySelectorAll('.inc-filter').forEach(function(b) {
      b.classList.remove('active');
    });
    btn.classList.add('active');
    currentFiltro = btn.dataset.estado;
    renderReportes();
  });
}

/* CARGA DE DATOS */

async function loadReportes() {
  const list = document.getElementById('incList');
  list.innerHTML = '<p class="empty-state">Cargando reportes...</p>';

  try {
    allReportes = await listarReportes();
  } catch {
    allReportes = [];
    list.innerHTML = '<p class="empty-state">No se pudieron cargar los reportes.</p>';
    return;
  }

  renderReportes();
}

/* RENDER */

function renderReportes() {
  const list = document.getElementById('incList');
  const count = document.getElementById('incCount');

  let filtered = allReportes;
  if (currentFiltro) {
    filtered = allReportes.filter(function(r) {
      return r.estado_id === Number(currentFiltro);
    });
  }

  count.textContent = filtered.length;

  if (filtered.length === 0) {
    list.innerHTML = '<p class="empty-state">No hay reportes que coincidan con el filtro.</p>';
    return;
  }

  list.innerHTML =
    '<table class="inc-table"><thead><tr>' +
      '<th>Código</th>' +
      '<th>Usuario</th>' +
      '<th>Estacionamiento</th>' +
      '<th>Descripción</th>' +
      '<th>Estado</th>' +
      '<th>Fecha</th>' +
    '</tr></thead><tbody>' +
    filtered.map(createRow).join('') +
    '</tbody></table>';
}

function createRow(r) {
  const estado = r.estado_codigo || 'enviado';
  const estadoLabel = (ESTADOS[estado] || {}).label || estado;
  const fecha = formatDate(r.creado_en);
  const descPreview = stripTipoLabel(r.descripcion).substring(0, 80);

  return (
    '<tr data-id="' + r.id + '">' +
      '<td><span class="inc-code">#REP-' + String(r.id).padStart(5, '0') + '</span></td>' +
      '<td><div class="inc-user">' +
        '<span class="inc-user-name">' + escapeHtml(r.usuario_nombre || '—') + '</span>' +
        '<span class="inc-user-code">' + escapeHtml(r.usuario_codigo || '') + '</span>' +
      '</div></td>' +
      '<td>' + escapeHtml(r.estacionamiento_nombre || '—') + '</td>' +
      '<td><span class="inc-desc-preview" title="' + escapeHtml(stripTipoLabel(r.descripcion)) + '">' + escapeHtml(descPreview) + '</span></td>' +
      '<td><span class="badge badge-' + estado + '">' + estadoLabel + '</span></td>' +
      '<td><span class="inc-fecha">' + fecha + '</span></td>' +
    '</tr>'
  );
}

function stripTipoLabel(desc) {
  if (!desc) return '';
  var match = /^\[([^\]]+)\]\s*(.*)$/s.exec(desc);
  return match ? match[2].trim() : desc;
}

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

/* MODAL */

function openModal() {
  var modal = document.getElementById('detailModal');
  modal.classList.add('open');
  modal.removeAttribute('aria-hidden');
}

function closeModal() {
  var modal = document.getElementById('detailModal');
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
}

function bindModal() {
  document.querySelectorAll('[data-close-modal]').forEach(function(el) {
    el.addEventListener('click', function() {
      closeModal();
    });
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeModal();
    }
  });

  document.addEventListener('click', function(e) {
    var row = e.target.closest('.inc-table tr');
    if (!row) return;
    var id = Number(row.dataset.id);
    if (id) openDetalle(id);
  });

  document.getElementById('detailBody').addEventListener('click', function(e) {
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    var id = Number(btn.dataset.id);
    if (!id) return;
    if (btn.dataset.action === 'responder') handleResponder(id);
    if (btn.dataset.action === 'prioritario') handlePrioritario(id);
  });
}

async function openDetalle(id) {
  var body = document.getElementById('detailBody');
  body.innerHTML = '<p class="empty-state">Cargando detalle...</p>';
  openModal();

  try {
    var r = await obtenerReporte(id);
    if (r.estado_id === 1) {
      marcarEnRevisionApi(id).then(function() {
        var idx = allReportes.findIndex(function(item) { return item.id === id; });
        if (idx !== -1) {
          allReportes[idx].estado_id = 2;
          allReportes[idx].estado_codigo = 'en_revision';
          renderReportes();
        }
      }).catch(function(){});
      r.estado_id = 2;
      r.estado_codigo = 'en_revision';
    }
    renderDetalle(r);
  } catch {
    body.innerHTML = '<p class="empty-state" style="color:var(--color-primary)">Error al cargar el detalle del reporte.</p>';
  }
}

function renderDetalle(r) {
  var body = document.getElementById('detailBody');
  var estado = r.estado_codigo || 'enviado';
  var estadoLabel = (ESTADOS[estado] || {}).label || estado;
  var fecha = formatDate(r.creado_en);
  var ubicacionPlaza = [];
  if (r.letra_bloque) ubicacionPlaza.push('Bloque ' + r.letra_bloque);
  if (r.numero_plaza) ubicacionPlaza.push('Plaza #' + r.numero_plaza);
  if (r.plaza_codigo) ubicacionPlaza.push('(' + r.plaza_codigo + ')');
  var plazaStr = ubicacionPlaza.length ? ubicacionPlaza.join(' ') : '—';
  var esResuelto = r.estado_codigo === 'resuelto' || r.estado_id === 3;
  var esPrioritario = r.estado_codigo === 'prioritario' || r.estado_id === 4;

  body.innerHTML =
    '<div class="detail-head">' +
      '<span class="detail-code">#REP-' + String(r.id).padStart(5, '0') + '</span>' +
      '<span class="badge badge-' + estado + '">' + estadoLabel + '</span>' +
    '</div>' +

    '<div class="detail-card">' +
      '<h3>Información del reporte</h3>' +
      '<div class="detail-grid-2col">' +
        '<div class="detail-section">' +
          '<span class="detail-label">Estacionamiento</span>' +
          '<span class="detail-value">' + escapeHtml(r.estacionamiento_nombre || 'No especificado') + '</span>' +
        '</div>' +
        '<div class="detail-section">' +
          '<span class="detail-label">Plaza / Ubicación</span>' +
          '<span class="detail-value">' + escapeHtml(plazaStr) + '</span>' +
        '</div>' +
        '<div class="detail-section">' +
          '<span class="detail-label">Fecha de creación</span>' +
          '<span class="detail-value">' + fecha + '</span>' +
        '</div>' +
        (r.actualizado_en !== r.creado_en ? (
          '<div class="detail-section">' +
            '<span class="detail-label">Última actualización</span>' +
            '<span class="detail-value">' + formatDate(r.actualizado_en) + '</span>' +
          '</div>'
        ) : '') +
      '</div>' +
    '</div>' +

    '<div class="detail-card">' +
      '<h3>Usuario reportante</h3>' +
      '<div class="detail-grid-2col">' +
        '<div class="detail-section">' +
          '<span class="detail-label">Nombre</span>' +
          '<span class="detail-value">' + escapeHtml(r.usuario_nombre || '—') + '</span>' +
        '</div>' +
        '<div class="detail-section">' +
          '<span class="detail-label">Código</span>' +
          '<span class="detail-value">' + escapeHtml(r.usuario_codigo || '—') + '</span>' +
        '</div>' +
        '<div class="detail-section">' +
          '<span class="detail-label">Correo</span>' +
          '<span class="detail-value">' + escapeHtml(r.usuario_correo || '—') + '</span>' +
        '</div>' +
        '<div class="detail-section">' +
          '<span class="detail-label">Rol</span>' +
          '<span class="detail-value">' + escapeHtml(r.usuario_rol || '—') + '</span>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<div class="detail-section" style="margin-bottom:8px">' +
      '<span class="detail-label">Descripción del problema</span>' +
    '</div>' +
    '<div class="detail-desc">' + escapeHtml(stripTipoLabel(r.descripcion)) + '</div>' +

    (esResuelto && r.respuesta_supervisor ? (
      '<div class="detail-response-box">' +
        '<strong>Solución reportada por el supervisor</strong>' +
        '<p>' + escapeHtml(r.respuesta_supervisor) + '</p>' +
      '</div>'
    ) : '') +

    (esPrioritario && r.razon_prioridad ? (
      '<div class="detail-response-box" style="background:rgba(239,68,68,0.06);border-left-color:#EF4444">' +
        '<strong style="color:#B91C1C">Razón de prioridad</strong>' +
        '<p>' + escapeHtml(r.razon_prioridad) + '</p>' +
      '</div>'
    ) : '') +

    (!esResuelto && !esPrioritario ? renderActions(r) : '');
}

function renderActions(r) {
  return (
    '<div class="detail-actions">' +

      '<div class="action-card">' +
        '<h4>✅ Responder y resolver</h4>' +
        '<p>Indica la solución aplicada y marca el reporte como resuelto.</p>' +
        '<textarea id="respuestaText" rows="3" placeholder="Describe la solución aplicada..."></textarea>' +
        '<div class="action-error" id="respuestaError"></div>' +
        '<button class="btn btn-primary" data-action="responder" data-id="' + r.id + '">Marcar como resuelto</button>' +
      '</div>' +

      '<div class="action-card">' +
        '<h4>🚨 Marcar como prioritario</h4>' +
        '<p>Si no puedes resolver el problema, se notificará al administrador.</p>' +
        '<textarea id="razonText" rows="3" placeholder="Explica por qué requiere atención del administrador..."></textarea>' +
        '<div class="action-error" id="razonError"></div>' +
        '<button class="btn btn-danger" data-action="prioritario" data-id="' + r.id + '">Escalar a administrador</button>' +
      '</div>' +

    '</div>'
  );
}

/* ACCIONES */

async function handleResponder(id) {
  var respuesta = document.getElementById('respuestaText').value.trim();
  var errBox = document.getElementById('respuestaError');

  if (respuesta.length < 5) {
    errBox.textContent = 'La respuesta debe tener al menos 5 caracteres.';
    errBox.style.display = 'block';
    return;
  }
  errBox.style.display = 'none';

  var btn = document.querySelector('.action-card .btn-primary');
  btn.disabled = true;
  btn.textContent = 'Enviando...';

  try {
    await responderReporte(id, respuesta);
    showSuccessToast('Reporte resuelto exitosamente');
    closeModal();
    await loadReportes();
  } catch (e) {
    errBox.textContent = e.message || 'Error al responder el reporte.';
    errBox.style.display = 'block';
    showErrorToast('Error al resolver el reporte');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Marcar como resuelto';
  }
}

async function handlePrioritario(id) {
  var razon = document.getElementById('razonText').value.trim();
  var errBox = document.getElementById('razonError');

  if (razon.length < 5) {
    errBox.textContent = 'Debes indicar una razón (mínimo 5 caracteres).';
    errBox.style.display = 'block';
    return;
  }
  errBox.style.display = 'none';

  var btn = document.querySelector('.action-card .btn-danger');
  btn.disabled = true;
  btn.textContent = 'Enviando...';

  try {
    await marcarReportePrioritario(id, razon);
    showSuccessToast('Reporte marcado como prioritario. Administrador notificado.');
    closeModal();
    await loadReportes();
  } catch (e) {
    errBox.textContent = e.message || 'Error al marcar como prioritario.';
    errBox.style.display = 'block';
    showErrorToast('Error al marcar como prioritario');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Escalar a administrador';
  }
}

/* TOAST */

function showSuccessToast(msg) {
  var toast = document.getElementById('errorToast');
  toast.textContent = msg;
  toast.style.background = '#047857';
  toast.style.display = 'block';
  setTimeout(function() { toast.style.display = 'none'; }, 4000);
}

function showErrorToast(msg) {
  var toast = document.getElementById('errorToast');
  toast.textContent = msg;
  toast.style.background = 'var(--color-primary)';
  toast.style.display = 'block';
  setTimeout(function() { toast.style.display = 'none'; }, 4000);
}

/* UTILIDADES */

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
