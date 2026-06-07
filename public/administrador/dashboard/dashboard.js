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
    renderAcciones(),
    renderPendientes()
  ]);
}

async function renderStats() {
  const container = document.getElementById('statsContainer');
  container.innerHTML = '<p class="empty-message">Cargando estadísticas...</p>';

  try {
    const data = await obtenerDashboardAdmin();

    container.innerHTML = `
      <div class="stat-card stat-pendientes">
        <p class="stat-number">${data.pendientes_count}</p>
        <p class="stat-label">Pendientes de Verificación</p>
      </div>
      <div class="stat-card stat-suspendidas">
        <p class="stat-number">${data.suspendidas_count}</p>
        <p class="stat-label">Cuentas Suspendidas</p>
      </div>
      <div class="stat-card stat-prioritarios">
        <p class="stat-number">${data.prioritarios_count}</p>
        <p class="stat-label">Reportes Prioritarios</p>
      </div>
      <div class="stat-card stat-infracciones">
        <p class="stat-number">${data.infracciones_mes}</p>
        <p class="stat-label">Infracciones del Mes</p>
      </div>
    `;
  } catch {
    container.innerHTML = '<p class="empty-message">No se pudieron cargar las estadísticas.</p>';
  }
}

async function renderAcciones() {
  const container = document.getElementById('accionesList');
  container.innerHTML = '<p class="empty-message">Cargando...</p>';

  try {
    const data = await obtenerDashboardAdmin();
    const acciones = data.acciones_recientes || [];

    if (!acciones.length) {
      container.innerHTML = '<p class="empty-message">No hay acciones registradas.</p>';
      return;
    }

    const badgeClass = {
      verificacion: 'badge-verificacion',
      suspension: 'badge-suspension',
      reactivacion: 'badge-reactivacion'
    };

    const label = {
      verificacion: 'Verificación',
      suspension: 'Suspensión',
      reactivacion: 'Reactivación'
    };

    const rows = acciones.map(a => {
      const fecha = a.creado_en ? new Date(a.creado_en).toLocaleString('es-PE', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
      }) : '—';
      const badge = badgeClass[a.tipo] || '';
      const lbl = label[a.tipo] || a.tipo;

      return `
        <tr>
          <td><span class="badge ${badge}">${lbl}</span></td>
          <td>${a.usuario_nombre || '—'}</td>
          <td>${a.usuario_codigo || '—'}</td>
          <td>${fecha}</td>
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Usuario</th>
            <th>Código</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  } catch {
    container.innerHTML = '<p class="empty-message">Error al cargar acciones.</p>';
  }
}

async function renderPendientes() {
  const container = document.getElementById('pendientesList');
  container.innerHTML = '<p class="empty-message">Cargando...</p>';

  try {
    const pendientes = await listarPendientes();

    if (!pendientes.length) {
      container.innerHTML = '<p class="empty-message">No hay perfiles pendientes de verificación.</p>';
      return;
    }

    const rows = pendientes.slice(0, 5).map(u => {
      const fecha = u.creado_en ? new Date(u.creado_en).toLocaleDateString('es-PE') : '—';
      return `
        <tr>
          <td><strong>${u.nombre}</strong></td>
          <td>${u.codigo_universitario}</td>
          <td>${u.rol}</td>
          <td>${fecha}</td>
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Código</th>
            <th>Rol</th>
            <th>Registro</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  } catch {
    container.innerHTML = '<p class="empty-message">Error al cargar pendientes.</p>';
  }
}

init();
