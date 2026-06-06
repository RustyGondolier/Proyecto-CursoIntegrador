let selectedPlazaId = null;
let lastSearchData = null;
let solicitudPendienteId = null;

async function init() {
  if (!isAuthenticated()) {
    window.location.href = '/auth/login.html';
    return;
  }

  await loadLayout();

  const urlParams = new URLSearchParams(window.location.search);
  const solicitudId = urlParams.get('solicitud_id');

  document.getElementById('placaInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') buscar();
  });
  document.getElementById('searchBtn').addEventListener('click', buscar);
  document.getElementById('confirmBtn').addEventListener('click', confirmarIngreso);

  if (solicitudId) {
    document.getElementById('searchError').textContent = 'Cargando solicitud...';
    await buscarPorSolicitudId(solicitudId);
  }
}

function limpiarError() {
  document.getElementById('searchError').textContent = '';
}

function mostrarError(msg) {
  document.getElementById('searchError').textContent = msg;
}

async function buscar() {
  const input = document.getElementById('placaInput');
  const placa = input.value.trim().toUpperCase();

  if (!placa) {
    mostrarError('Ingrese una placa para buscar');
    return;
  }

  limpiarError();
  document.getElementById('resultContainer').classList.add('hidden');
  document.getElementById('emptyResult').classList.remove('hidden');
  selectedPlazaId = null;
  solicitudPendienteId = null;

  try {
    const response = await apiFetch(`/api/supervisor/buscar?placa=${encodeURIComponent(placa)}`);
    if (!response.ok) {
      const err = await response.json();
      mostrarError(err.error || 'Vehículo no encontrado');
      return;
    }

    const data = await response.json();
    lastSearchData = data;
    mostrarResultado(data);
  } catch {
    mostrarError('Error de conexión al buscar');
  }
}

async function buscarPorSolicitudId(solicitudId) {
  try {
    const response = await apiFetch(`/api/supervisor/solicitud/${solicitudId}`);
    if (!response.ok) {
      mostrarError('Solicitud no encontrada o ya no está activa');
      return;
    }

    const data = await response.json();
    lastSearchData = data;
    document.getElementById('placaInput').value = data.placa;
    mostrarResultado(data);
  } catch {
    mostrarError('Error al cargar solicitud');
  }
}

function mostrarResultado(data) {
  document.getElementById('resultContainer').classList.remove('hidden');
  document.getElementById('emptyResult').classList.add('hidden');

  const initial = data.usuario_nombre ? data.usuario_nombre.charAt(0).toUpperCase() : '?';

  let timerHtml = '';
  if (data.solicitud_estado === 'pendiente' && data.tiempo_restante_segundos !== null) {
    solicitudPendienteId = data.solicitud_id;
    const mins = Math.floor(Math.max(0, data.tiempo_restante_segundos) / 60);
    const segs = Math.max(0, data.tiempo_restante_segundos) % 60;
    timerHtml = `
      <div class="detail-item">
        <span class="label">Timer</span>
        <span class="value timer" id="timerDisplay">${mins}:${String(segs).padStart(2, '0')} min</span>
      </div>
    `;
  }

  const estadoLabel = data.solicitud_estado === 'pendiente' ? 'Pendiente' :
    data.solicitud_estado === 'ingresado' ? 'Ingresado' :
    data.solicitud_estado === 'finalizado' ? 'Finalizado' : 'Sin solicitud';

  document.getElementById('userInfoCard').innerHTML = `
    <div class="user-card-header">
      <div class="user-avatar">${initial}</div>
      <div class="user-info">
        <h2>${data.usuario_nombre}</h2>
        <p class="user-placa">${data.placa}</p>
      </div>
    </div>
    <div class="user-details">
      <div class="detail-item">
        <span class="label">Tipo Vehículo</span>
        <span class="value">${data.tipo_vehiculo || '—'}</span>
      </div>
      <div class="detail-item">
        <span class="label">Código</span>
        <span class="value">${data.codigo_universitario || '—'}</span>
      </div>
      <div class="detail-item">
        <span class="label">Solicitud</span>
        <span class="value solicitud-estado">${estadoLabel}</span>
      </div>
      ${data.solicitud_estado === 'pendiente' && data.estacionamiento_nombre ? `
        <div class="detail-item">
          <span class="label">Estacionamiento</span>
          <span class="value">${data.estacionamiento_nombre}</span>
        </div>
      ` : ''}
      ${timerHtml}
    </div>
  `;

  if (data.solicitud_estado === 'pendiente' && data.estacionamiento_id) {
    cargarPlazasDisponibles(data.estacionamiento_id, data.categoria_plaza);

    if (data.tiempo_restante_segundos !== null) {
      iniciarTimer(data.tiempo_restante_segundos);
    }
  } else if (data.solicitud_estado === 'pendiente' && !data.estacionamiento_id) {
    document.getElementById('plazasSection').classList.add('hidden');
  } else {
    document.getElementById('plazasSection').classList.add('hidden');
  }
}

let timerInterval = null;

function expirarSolicitud() {
  const grid = document.getElementById('plazasGrid');
  const confirmBtn = document.getElementById('confirmBtn');
  const selectedInfo = document.getElementById('selectedPlazaInfo');
  const plazasCount = document.getElementById('plazasCount');

  if (grid) grid.innerHTML = '';
  if (plazasCount) plazasCount.textContent = '0 disponibles';
  if (selectedInfo) selectedInfo.textContent = 'Solicitud expirada';
  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Solicitud Expirada';
  }
  selectedPlazaId = null;
  solicitudPendienteId = null;
}

function iniciarTimer(segundosRestantes) {
  if (timerInterval) clearInterval(timerInterval);

  let segs = segundosRestantes;

  timerInterval = setInterval(() => {
    const el = document.getElementById('timerDisplay');
    if (!el) { clearInterval(timerInterval); return; }

    segs--;
    if (segs <= 0) {
      el.textContent = 'VENCIDO';
      el.style.color = '#DC2626';
      clearInterval(timerInterval);
      expirarSolicitud();
    } else {
      const mins = Math.floor(segs / 60);
      const s = segs % 60;
      el.textContent = `${mins}:${String(s).padStart(2, '0')} min`;
    }
  }, 1000);
}

async function cargarPlazasDisponibles(estacionamientoId, categoriaPlaza) {
  const section = document.getElementById('plazasSection');
  const grid = document.getElementById('plazasGrid');
  const count = document.getElementById('plazasCount');
  const confirmBtn = document.getElementById('confirmBtn');
  const selectedInfo = document.getElementById('selectedPlazaInfo');

  section.classList.remove('hidden');
  grid.innerHTML = '<p class="loading-plazas">Cargando plazas disponibles...</p>';
  confirmBtn.disabled = true;
  selectedInfo.textContent = 'Seleccione una plaza disponible';
  selectedPlazaId = null;

  try {
    const response = await apiFetch(
      `/api/supervisor/plazas-disponibles?estacionamiento_id=${estacionamientoId}&categoria_plaza=${categoriaPlaza}`
    );

    if (!response.ok) throw new Error();

    const plazas = await response.json();

    if (!plazas.length) {
      grid.innerHTML = '<p class="loading-plazas">No hay plazas disponibles en este momento.</p>';
      count.textContent = '0 disponibles';
      return;
    }

    count.textContent = `${plazas.length} disponibles`;

    grid.innerHTML = plazas.map(p => `
      <div class="plaza-item" data-id="${p.id}" data-codigo="${p.codigo}">
        ${p.codigo}
        <div class="plaza-tipo">${p.tipo_plaza_descripcion || p.tipo_vehiculo}</div>
      </div>
    `).join('');

    grid.querySelectorAll('.plaza-item').forEach(el => {
      el.addEventListener('click', () => {
        grid.querySelectorAll('.plaza-item').forEach(x => x.classList.remove('selected'));
        el.classList.add('selected');
        selectedPlazaId = el.dataset.id;
        document.getElementById('selectedPlazaInfo').textContent =
          `Plaza seleccionada: ${el.dataset.codigo}`;
        document.getElementById('confirmBtn').disabled = false;
      });
    });
  } catch {
    grid.innerHTML = '<p class="loading-plazas">Error al cargar plazas disponibles.</p>';
  }
}

async function confirmarIngreso() {
  if (!selectedPlazaId || !solicitudPendienteId) return;

  const confirmBtn = document.getElementById('confirmBtn');
  confirmBtn.disabled = true;
  confirmBtn.textContent = 'Confirmando...';

  try {
    const response = await apiFetch('/api/supervisor/confirmar-ingreso', {
      method: 'POST',
      body: JSON.stringify({
        solicitud_id: solicitudPendienteId,
        plaza_id: parseInt(selectedPlazaId)
      })
    });

    if (!response.ok) {
      const err = await response.json();
      alert(err.error || 'Error al confirmar ingreso');
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Confirmar Ingreso';
      return;
    }

    const data = await response.json();
    const plazaCodigo = document.querySelector('.plaza-item.selected')?.dataset?.codigo || '';

    document.getElementById('plazasSection').classList.add('hidden');

    const userCard = document.getElementById('userInfoCard');
    userCard.innerHTML = `
      <div class="confirm-success">
        <h3>✅ Ingreso Confirmado</h3>
        <p>Vehículo ${lastSearchData?.placa} ingresó a plaza ${plazaCodigo}</p>
      </div>
    `;

    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    confirmBtn.textContent = 'Confirmar Ingreso';
    selectedPlazaId = null;
    solicitudPendienteId = null;
  } catch {
    alert('Error de conexión al confirmar ingreso');
    confirmBtn.disabled = false;
    confirmBtn.textContent = 'Confirmar Ingreso';
  }
}

init();
