let timerIntervals = {};

async function init() {
  if (!isAuthenticated()) {
    window.location.href = '/auth/login.html';
    return;
  }

  await loadLayout();

  const usuario = getSessionUser();
  document.getElementById('welcomeText').textContent = `Bienvenido, ${usuario.nombre}`;

  await Promise.all([
    renderStats(),
    renderPendingRequests(),
    renderRecentMovements(),
    renderParkingGrid()
  ]);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      renderStats();
      renderPendingRequests();
      renderRecentMovements();
    }
  });
}

async function renderStats() {
  const container = document.getElementById('statsContainer');
  container.innerHTML = '<p>Cargando estadísticas...</p>';

  try {
    const response = await apiFetch('/api/supervisor/dashboard');
    if (!response.ok) throw new Error('Error al cargar');

    const data = await response.json();

    container.innerHTML = `
      <div class="stat-card">
        <p class="stat-number">${data.pendientes_count}</p>
        <p class="stat-label">Solicitudes Pendientes</p>
      </div>
      <div class="stat-card">
        <p class="stat-number">${data.ingresos_hoy}</p>
        <p class="stat-label">Ingresos Hoy</p>
      </div>
      <div class="stat-card">
        <p class="stat-number">${data.salidas_hoy}</p>
        <p class="stat-label">Salidas Hoy</p>
      </div>
      <div class="stat-card stat-ocupacion">
        <p class="stat-number">${data.ocupacion_porcentaje ?? '—'}%</p>
        <p class="stat-label">Ocupación Actual</p>
      </div>
      <div class="stat-card">
        <p class="stat-number">${data.incidencias_pendientes}</p>
        <p class="stat-label">Incidencias Pendientes</p>
      </div>
    `;
  } catch {
    container.innerHTML = '<p class="empty-message">No se pudieron cargar las estadísticas.</p>';
  }
}

async function renderPendingRequests() {
  const container = document.getElementById('pendingList');
  container.innerHTML = '<p class="empty-message">Cargando...</p>';

  try {
    const response = await apiFetch('/api/supervisor/dashboard');
    if (!response.ok) throw new Error();

    const data = await response.json();
    const pendientes = data.pendientes || [];

    if (!pendientes.length) {
      container.innerHTML = '<p class="empty-message">No hay solicitudes pendientes.</p>';
      return;
    }

    const now = Date.now();

    const rows = pendientes.map(s => {
      const fin = new Date(s.hora_limite_ingreso).getTime();
      const diff = Math.max(0, Math.floor((fin - now) / 1000));
      const minutos = Math.floor(diff / 60);
      const segundos = diff % 60;
      const vencido = diff <= 0;

      return `
        <tr data-id="${s.id}" data-fin="${fin}">
          <td><strong>${s.placa}</strong></td>
          <td>${s.usuario_nombre}</td>
          <td>${s.estacionamiento_nombre}</td>
          <td><span class="badge ${vencido ? 'badge-vencido' : 'badge-pendiente'}">${vencido ? 'VENCIDO' : `${minutos}:${String(segundos).padStart(2, '0')}`}</span></td>
          <td><button class="btn-link" onclick="atenderSolicitud(${s.id})">Atender</button></td>
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Placa</th>
            <th>Usuario</th>
            <th>Estacionamiento</th>
            <th>Tiempo</th>
            <th></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;

    pendientes.forEach(s => {
      const fin = new Date(s.hora_limite_ingreso).getTime();
      const id = s.id;

      if (timerIntervals[id]) clearInterval(timerIntervals[id]);

      timerIntervals[id] = setInterval(() => {
        const tr = document.querySelector(`#pendingList tr[data-id="${id}"]`);
        if (!tr) { clearInterval(timerIntervals[id]); return; }

        const diff = Math.max(0, Math.floor((fin - Date.now()) / 1000));
        const badge = tr.querySelector('.badge');

        if (diff <= 0) {
          badge.className = 'badge badge-vencido';
          badge.textContent = 'VENCIDO';
          clearInterval(timerIntervals[id]);
        } else {
          const m = Math.floor(diff / 60);
          const s = diff % 60;
          badge.textContent = `${m}:${String(s).padStart(2, '0')}`;
        }
      }, 1000);
    });
  } catch {
    container.innerHTML = '<p class="empty-message">Error al cargar solicitudes.</p>';
  }
}

function atenderSolicitud(id) {
  window.location.href = `/supervisor/ingresos/ingresos.html?solicitud_id=${id}`;
}

async function renderRecentMovements() {
  const container = document.getElementById('movementsList');
  container.innerHTML = '<p class="empty-message">Cargando...</p>';

  try {
    const response = await apiFetch('/api/supervisor/dashboard');
    if (!response.ok) throw new Error();

    const data = await response.json();
    const movimientos = data.movimientos || [];

    if (!movimientos.length) {
      container.innerHTML = '<p class="empty-message">No hay movimientos recientes.</p>';
      return;
    }

    const rows = movimientos.map(m => {
      const fecha = m.estado === 'ingresado' ? m.hora_ingreso : m.hora_salida;
      const hora = fecha ? new Date(fecha).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : '—';
      const badgeClass = m.estado === 'ingresado' ? 'badge-ingresado' : 'badge-finalizado';
      const label = m.estado === 'ingresado' ? 'Ingreso' : 'Salida';

      return `
        <tr>
          <td><span class="badge ${badgeClass}">${label}</span></td>
          <td>${hora}</td>
          <td><strong>${m.placa}</strong></td>
          <td>${m.usuario_nombre}</td>
          <td>${m.plaza_codigo || '—'}</td>
          <td>${m.estacionamiento_nombre}</td>
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Hora</th>
            <th>Placa</th>
            <th>Usuario</th>
            <th>Plaza</th>
            <th>Estacionamiento</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  } catch {
    container.innerHTML = '<p class="empty-message">Error al cargar movimientos.</p>';
  }
}

async function renderParkingGrid() {
  const container = document.getElementById('parkingContainer');
  container.innerHTML = '<p class="empty-message">Cargando estacionamientos...</p>';

  try {
    const response = await apiFetch('/api/estacionamientos/ocupacion');
    if (!response.ok) throw new Error('Error al cargar');

    const data = await response.json();
    container.innerHTML = data.length
      ? data.map(e => {
          const autosPct = e.autos_total ? Math.round((e.autos_ocupados / e.autos_total) * 100) : 0;
          const motosPct = e.motos_total ? Math.round((e.motos_ocupadas / e.motos_total) * 100) : 0;
          return `
            <div class="parking-card" data-id="${e.id}">
              <div class="parking-body">
                <h2>${e.nombre}</h2>
                <p>Autos: ${e.autos_ocupados} / ${e.autos_total}</p>
                <div class="progress">
                  <div class="progress-fill auto" style="width:${autosPct}%"></div>
                </div>
                <p>Motos: ${e.motos_ocupadas} / ${e.motos_total}</p>
                <div class="progress">
                  <div class="progress-fill moto" style="width:${motosPct}%"></div>
                </div>
              </div>
            </div>
          `;
        }).join('')
      : '<p class="empty-message">No hay estacionamientos disponibles.</p>';
  } catch {
    container.innerHTML = '<p class="empty-message">No se pudieron cargar los estacionamientos.</p>';
  }
}

init();
