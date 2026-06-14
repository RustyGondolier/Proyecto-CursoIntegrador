let allReportes = [];

const TIPOS = {
  lugar_ocupado:    { icon: '🚗', label: 'Otra persona ocupa mi lugar' },
  obstruccion:      { icon: '🚧', label: 'Obstrucción en el camino' },
  mal_estacionado:  { icon: '⚠️', label: 'Vehículo mal estacionado' },
  otro:             { icon: '💬', label: 'Otro problema' }
};

const ESTADOS = {
  enviado:      { label: 'Enviado' },
  en_revision:  { label: 'En revisión' },
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
  bindTipoSelector();
  bindNewReportForm();
  bindModals();
  bindTabs();
  bindScrollToForm();

  await Promise.all([
    loadReportes(),
    cargarPlazaAsignada()
  ]);
}

/* CARGA DE DATOS */

async function cargarPlazaAsignada() {
  const plazaInfo = document.getElementById('plazaInfo');
  const plazaInfoText = document.getElementById('plazaInfoText');
  try {
    const response = await apiFetch('/api/solicitudes/activa');
    if (response.ok) {
      const data = await response.json();
      if (data && data.plaza_codigo) {
        plazaInfoText.textContent = data.plaza_codigo + (data.estacionamiento_nombre ? ' — ' + data.estacionamiento_nombre : '');
        plazaInfo.style.display = '';
        return;
      }
    }
  } catch (err) { console.warn('Error al cargar info de plaza:', err); }
  plazaInfo.style.display = 'none';
}

async function loadReportes() {
  const list = document.getElementById('reportesList');
  list.innerHTML = '<p class="empty-state">Cargando reportes...</p>';

  try {
    const response = await apiFetch('/api/reportes');
    if (!response.ok) throw new Error();
    allReportes = await response.json();
  } catch {
    allReportes = [];
    list.innerHTML = '<p class="empty-state">No se pudieron cargar tus reportes.</p>';
    return;
  }

  renderReportes();
}

/* SELECTOR DE TIPO */

function bindTipoSelector() {
  const grid = document.getElementById('tiposGrid');
  const hidden = document.getElementById('formTipo');

  grid.addEventListener('click', e => {
    const card = e.target.closest('.tipo-card');
    if (!card) return;

    grid.querySelectorAll('.tipo-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    hidden.value = card.dataset.tipo;
    document.getElementById('newReportError').style.display = 'none';
  });
}

/* FORM: NUEVO REPORTE */

function bindNewReportForm() {
  const form = document.getElementById('newReportForm');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const errBox = document.getElementById('newReportError');
    errBox.style.display = 'none';

    const tipo = document.getElementById('formTipo').value;
    const descripcion = document.getElementById('formDescripcion').value.trim();

    const plazaInfo = document.getElementById('plazaInfo');
    if (!plazaInfo || plazaInfo.style.display === 'none') {
      errBox.textContent = 'Debes tener una plaza asignada para reportar una incidencia. Solicita una plaza primero.';
      errBox.style.display = 'block';
      return;
    }

    if (!tipo) {
      errBox.textContent = 'Selecciona el tipo de incidencia que quieres reportar.';
      errBox.style.display = 'block';
      return;
    }
    if (descripcion.length < 10) {
      errBox.textContent = 'La descripción debe tener al menos 10 caracteres.';
      errBox.style.display = 'block';
      return;
    }

    const tipoLabel = (TIPOS[tipo] || {}).label || tipo;
    const descripcionCompleta = `[${tipoLabel}] ${descripcion}`;

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';

    try {
      const response = await apiFetch('/api/reportes', {
        method: 'POST',
        body: JSON.stringify({
          descripcion: descripcionCompleta
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Error al enviar el reporte');
      }

      resetForm();
      await loadReportes();

      const successBox = document.getElementById('formSuccess');
      successBox.textContent = '✅ Reporte enviado con éxito.';
      successBox.style.display = 'block';
      setTimeout(() => { successBox.style.display = 'none'; }, 4000);

      if (window.innerWidth <= 960) {
        document.querySelectorAll('.reportes-tab').forEach(t => {
          t.classList.toggle('active', t.dataset.tab === 'list');
        });
        document.getElementById('reportesColForm').style.display = 'none';
        document.getElementById('reportesColList').style.display = 'block';
      }
    } catch (e) {
      errBox.textContent = e.message || 'No se pudo enviar el reporte.';
      errBox.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Enviar reporte';
    }
  });
}

function resetForm() {
  const form = document.getElementById('newReportForm');
  form.reset();
  document.querySelectorAll('.tipo-card.selected').forEach(c => c.classList.remove('selected'));
  document.getElementById('formTipo').value = '';
  document.getElementById('newReportError').style.display = 'none';
}

/* RENDER: LISTA DE REPORTES */

function renderReportes() {
  const list = document.getElementById('reportesList');
  const count = document.getElementById('reportesCount');

  count.textContent = allReportes.length;

  if (allReportes.length === 0) {
    list.innerHTML = `
      <div class="empty-state empty-state-large">
        <div class="empty-icon">📋</div>
        <p>Aún no has enviado ningún reporte.</p>
        <p class="hint">Completa el formulario para registrar una incidencia.</p>
      </div>
    `;
    return;
  }

  list.innerHTML = allReportes.map(createReporteItem).join('');
}

function createReporteItem(r) {
  const estado = r.estado_codigo || r.estado || 'enviado';
  const estadoLabel = (ESTADOS[estado] || {}).label || estado;
  const fecha = new Date(r.creado_en).toLocaleString('es-PE', {
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });

  const { tipoCode, descripcionLimpia } = parseTipoFromDescripcion(r.descripcion);
  const tipoInfo = TIPOS[tipoCode] || { icon: '📄', label: 'Reporte' };

  const ubicacion = r.estacionamiento_nombre
    ? `📍 ${escapeHtml(r.estacionamiento_nombre)}`
    : '📍 Sin ubicación';

  const responseHtml = r.respuesta_supervisor
    ? `
      <div class="reporte-response">
        <strong>Respuesta del supervisor</strong>
        ${escapeHtml(r.respuesta_supervisor)}
      </div>
    `
    : '';

  const itemClass = `reporte-item${r.respuesta_supervisor ? ' has-response' : ''}`;

  return `
    <div class="${itemClass}" data-id="${r.id}">
      <div class="reporte-head">
        <span class="reporte-tipo">${tipoInfo.icon} ${escapeHtml(tipoInfo.label)}</span>
        <span class="badge badge-${estado}">${estadoLabel}</span>
      </div>
      <p class="reporte-desc">${escapeHtml(descripcionLimpia)}</p>
      <div class="reporte-meta">
        <span>#REP-${String(r.id).padStart(5, '0')}</span>
        <span>${ubicacion}</span>
        <span>🕒 ${fecha}</span>
      </div>
      ${responseHtml}
    </div>
  `;
}

function parseTipoFromDescripcion(desc) {
  const match = /^\[([^\]]+)\]\s*(.*)$/s.exec(desc || '');
  if (!match) return { tipoCode: null, descripcionLimpia: desc || '' };

  const label = match[1].trim();
  const descripcionLimpia = match[2].trim();
  const entry = Object.entries(TIPOS).find(([, v]) => v.label === label);
  return {
    tipoCode: entry ? entry[0] : null,
    descripcionLimpia
  };
}

/* MODAL DETALLE */

function bindModals() {
  document.querySelectorAll('[data-close-modal]').forEach(el => {
    el.addEventListener('click', () => {
      el.closest('.modal').classList.remove('open');
    });
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal.open').forEach(m => m.classList.remove('open'));
    }
  });

  document.addEventListener('click', e => {
    const item = e.target.closest('.reporte-item');
    if (!item) return;
    const id = Number(item.dataset.id);
    const reporte = allReportes.find(r => r.id === id);
    if (reporte) openDetailModal(reporte);
  });
}

function openDetailModal(r) {
  const estado = r.estado_codigo || r.estado || 'enviado';
  const estadoLabel = (ESTADOS[estado] || {}).label || estado;
  const fecha = new Date(r.creado_en).toLocaleString('es-PE', {
    year: 'numeric', month: 'long', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });

  const { tipoCode, descripcionLimpia } = parseTipoFromDescripcion(r.descripcion);
  const tipoInfo = TIPOS[tipoCode] || { icon: '📄', label: 'Reporte' };

  const body = document.getElementById('detailBody');
  body.innerHTML = `
    <div class="detail-head">
      <span class="detail-code">#REP-${String(r.id).padStart(5, '0')}</span>
      <span class="badge badge-${estado}">${estadoLabel}</span>
    </div>

    <div class="detail-section">
      <span class="detail-label">Tipo de incidencia</span>
      <span class="detail-value">${tipoInfo.icon} ${escapeHtml(tipoInfo.label)}</span>
    </div>

    <div class="detail-grid">
      <div class="detail-section">
        <span class="detail-label">Estacionamiento</span>
        <span class="detail-value">${r.estacionamiento_nombre ? escapeHtml(r.estacionamiento_nombre) : '<span class="empty">No especificado</span>'}</span>
      </div>
      <div class="detail-section">
        <span class="detail-label">Fecha de creación</span>
        <span class="detail-value">${fecha}</span>
      </div>
    </div>

    <div class="detail-section">
      <span class="detail-label">Descripción</span>
      <p class="detail-value">${escapeHtml(descripcionLimpia || 'Sin descripción')}</p>
    </div>

    ${r.respuesta_supervisor ? `
      <div class="detail-response">
        <div class="detail-section">
          <span class="detail-label">Respuesta del supervisor</span>
          <p class="detail-value">${escapeHtml(r.respuesta_supervisor)}</p>
        </div>
      </div>
    ` : `
      <div class="detail-section">
        <span class="detail-label">Respuesta del supervisor</span>
        <p class="detail-value empty">Aún no hay respuesta. Te avisaremos cuando sea atendido.</p>
      </div>
    `}
  `;

  document.getElementById('detailModal').classList.add('open');
}

/* TABS MOBILE */

function bindTabs() {
  const tabs = document.querySelectorAll('.reportes-tab');
  if (tabs.length === 0) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const target = tab.dataset.tab;
      document.getElementById('reportesColForm').style.display =
        target === 'form' ? 'block' : 'none';
      document.getElementById('reportesColList').style.display =
        target === 'list' ? 'block' : 'none';
    });
  });
}

/* SCROLL TO FORM */

function bindScrollToForm() {
  const btn = document.getElementById('scrollToFormBtn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    if (window.innerWidth <= 960) {
      document.querySelectorAll('.reportes-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === 'form');
      });
      document.getElementById('reportesColForm').style.display = 'block';
      document.getElementById('reportesColList').style.display = 'none';
    }

    const form = document.getElementById('reportFormCard');
    if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
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

window.onReporteActualizado = function () {
  loadReportes();
};

init();
