let allRegistros = [];

async function init() {
  if (!isAuthenticated()) {
    window.location.href = '/auth/login.html';
    return;
  }

  await loadLayout();
  bindModals();
  await cargarHistorial();
}

async function cargarHistorial() {
  const content = document.getElementById('historialContent');
  const count = document.getElementById('historialCount');
  const error = document.getElementById('historialError');

  error.style.display = 'none';
  content.innerHTML = '<p class="historial-empty">Cargando historial...</p>';

  try {
    const resp = await apiFetch('/api/solicitudes/historial');
    if (!resp.ok) throw new Error('Error al cargar');

    const data = await resp.json();

    if (!data || data.length === 0) {
      content.innerHTML = '<p class="historial-empty">No tienes accesos registrados aún.</p>';
      count.textContent = '0 registros';
      return;
    }

    allRegistros = data;
    count.textContent = `${data.length} registro${data.length !== 1 ? 's' : ''}`;

    const table = document.createElement('table');
    table.className = 'historial-table';

    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr>
        <th>Fecha</th>
        <th>Cochera</th>
        <th>Plaza</th>
        <th>Estado</th>
        <th>Solicitud</th>
        <th>Ingreso</th>
        <th>Salida</th>
        <th>Permanencia</th>
      </tr>
    `;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    data.forEach(r => {
      const fecha = r.hora_solicitud
        ? new Date(r.hora_solicitud).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
        : '—';

      const horaSolicitud = r.hora_solicitud
        ? new Date(r.hora_solicitud).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
        : '—';

      const horaIngreso = r.hora_ingreso
        ? new Date(r.hora_ingreso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
        : '—';

      const horaSalida = r.hora_salida
        ? new Date(r.hora_salida).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
        : '—';

      const permanencia = r.tiempo_permanencia_min != null
        ? `${r.tiempo_permanencia_min} min`
        : '—';

      const estadoLabels = {
        pendiente: 'Pendiente',
        ingresado: 'Ingresado',
        finalizado: 'Finalizado',
        cancelado: 'Cancelado',
        expirado: 'Expirado'
      };

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${fecha}</td>
        <td>${r.estacionamiento || '—'}</td>
        <td>${r.plaza_codigo || '—'}</td>
        <td><span class="estado-badge estado-${r.estado}">${estadoLabels[r.estado] || r.estado}</span></td>
        <td>${horaSolicitud}</td>
        <td>${horaIngreso}</td>
        <td>${horaSalida}</td>
        <td>${permanencia}</td>
      `;
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    content.innerHTML = '';
    content.appendChild(table);

  } catch (err) {
    console.error(err);
    error.style.display = 'block';
    document.getElementById('historialErrorText').textContent = 'No se pudo cargar el historial. Verifica tu conexión e intenta de nuevo.';
    content.innerHTML = '';
  }
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
    const content = document.getElementById('historialContent');
    if (!content.contains(e.target)) return;
    const tr = e.target.closest('tr');
    if (!tr) return;
    const idx = Array.from(tr.parentNode.children).indexOf(tr);
    const registro = allRegistros[idx];
    if (registro) openDetailModal(registro);
  });
}

function openDetailModal(r) {
  const fecha = r.hora_solicitud
    ? new Date(r.hora_solicitud).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—';

  const horaSolicitud = r.hora_solicitud
    ? new Date(r.hora_solicitud).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
    : '—';

  const horaIngreso = r.hora_ingreso
    ? new Date(r.hora_ingreso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
    : '—';

  const horaSalida = r.hora_salida
    ? new Date(r.hora_salida).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
    : '—';

  const permanencia = r.tiempo_permanencia_min != null
    ? `${r.tiempo_permanencia_min} min`
    : '—';

  const estadoLabels = {
    pendiente: 'Pendiente',
    ingresado: 'Ingresado',
    finalizado: 'Finalizado',
    cancelado: 'Cancelado',
    expirado: 'Expirado'
  };

  const body = document.getElementById('detailBody');
  body.innerHTML = `
    <div class="detail-head">
      <span class="detail-code">#${r.id}</span>
      <span class="estado-badge estado-${r.estado}">${estadoLabels[r.estado] || r.estado}</span>
    </div>

    <div class="detail-section">
      <span class="detail-label">Fecha</span>
      <span class="detail-value">${escapeHtml(fecha)}</span>
    </div>

    <div class="detail-grid">
      <div class="detail-section">
        <span class="detail-label">Cochera</span>
        <span class="detail-value">${escapeHtml(r.estacionamiento || '—')}</span>
      </div>
      <div class="detail-section">
        <span class="detail-label">Plaza</span>
        <span class="detail-value">${escapeHtml(r.plaza_codigo || '—')}</span>
      </div>
    </div>

    <div class="detail-grid">
      <div class="detail-section">
        <span class="detail-label">Hora de solicitud</span>
        <span class="detail-value">${horaSolicitud}</span>
      </div>
      <div class="detail-section">
        <span class="detail-label">Hora de ingreso</span>
        <span class="detail-value">${horaIngreso}</span>
      </div>
      <div class="detail-section">
        <span class="detail-label">Hora de salida</span>
        <span class="detail-value">${horaSalida}</span>
      </div>
      <div class="detail-section">
        <span class="detail-label">Permanencia</span>
        <span class="detail-value">${permanencia}</span>
      </div>
    </div>
  `;

  document.getElementById('detailModal').classList.add('open');
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
