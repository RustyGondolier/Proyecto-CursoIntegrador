let solicitudSalidaId = null;
let lastSearchData = null;
let timerInterval = null;
let modoBusqueda = 'placa';

async function init() {
  if (!isAuthenticated()) {
    window.location.href = '/auth/login.html';
    return;
  }

  await loadLayout();

  document.getElementById('placaInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') buscarPorPlaca();
  });
  document.getElementById('searchPlacaBtn').addEventListener('click', buscarPorPlaca);
  document.getElementById('codigoInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') buscarPorCodigo();
  });
  document.getElementById('searchCodigoBtn').addEventListener('click', buscarPorCodigo);

  document.getElementById('tabPlaca').addEventListener('click', () => cambiarModo('placa'));
  document.getElementById('tabCodigo').addEventListener('click', () => cambiarModo('codigo'));

  await cargarEstacionamientos();
}

function cambiarModo(modo) {
  modoBusqueda = modo;
  document.getElementById('tabPlaca').classList.toggle('active', modo === 'placa');
  document.getElementById('tabCodigo').classList.toggle('active', modo === 'codigo');
  document.getElementById('searchPlaca').classList.toggle('hidden', modo !== 'placa');
  document.getElementById('searchCodigo').classList.toggle('hidden', modo !== 'codigo');
  limpiarError();
}

async function cargarEstacionamientos() {
  try {
    const response = await apiFetch('/api/estacionamientos');
    if (!response.ok) return;
    const data = await response.json();
    const select = document.getElementById('estacionamientoSelect');
    select.innerHTML = data.map(e => `<option value="${e.id}">${e.nombre}</option>`).join('');
  } catch {
    mostrarError('Error al cargar estacionamientos');
  }
}

function limpiarError() {
  document.getElementById('searchError').textContent = '';
}

function mostrarError(msg) {
  document.getElementById('searchError').textContent = msg;
}

function ocultarResultados() {
  document.getElementById('resultContainer').classList.add('hidden');
  document.getElementById('emptyResult').classList.remove('hidden');
  solicitudSalidaId = null;
}

async function buscarPorPlaca() {
  const input = document.getElementById('placaInput');
  const placa = input.value.trim().toUpperCase();

  if (!placa) {
    mostrarError('Ingrese una placa para buscar');
    return;
  }

  const formatoValido = /^[A-Z]{2,3}-\d{3,4}$/.test(placa);
  if (!formatoValido) {
    mostrarError('Formato inválido. Use formato: ABC-123 o AB-1234');
    return;
  }

  limpiarError();
  ocultarResultados();

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

async function buscarPorCodigo() {
  const estacionamientoId = document.getElementById('estacionamientoSelect').value;
  const tipoVehiculo = document.getElementById('tipoVehiculoSelect').value;
  const codigo = document.getElementById('codigoInput').value.trim().toUpperCase();

  if (!codigo) {
    mostrarError('Ingrese el código (Bloque-Plaza)');
    return;
  }

  if (!/^[A-Z]-\d+$/.test(codigo) && !/^[A-Z]\d+$/.test(codigo)) {
    mostrarError('Formato inválido. Use: A-12');
    return;
  }

  limpiarError();
  ocultarResultados();

  try {
    const response = await apiFetch(
      `/api/supervisor/buscar-identificador?estacionamiento_id=${estacionamientoId}&tipo_vehiculo=${tipoVehiculo}&codigo=${encodeURIComponent(codigo)}`
    );
    if (!response.ok) {
      const err = await response.json();
      mostrarError(err.error || 'No se encontraron resultados');
      return;
    }
    const data = await response.json();
    lastSearchData = data;
    mostrarResultado(data);
  } catch {
    mostrarError('Error de conexión al buscar');
  }
}

function calcularPermanencia(horaIngreso) {
  if (!horaIngreso) return '—';
  const ingreso = new Date(horaIngreso).getTime();
  const ahora = Date.now();
  const diffMs = Math.max(0, ahora - ingreso);
  const totalMin = Math.floor(diffMs / 60000);
  const horas = Math.floor(totalMin / 60);
  const minutos = totalMin % 60;
  if (horas > 0) return `${horas}h ${minutos}min`;
  return `${minutos}min`;
}

function mostrarResultado(data) {
  const container = document.getElementById('resultContainer');
  const content = document.getElementById('userInfoContent');

  container.classList.remove('hidden');
  document.getElementById('emptyResult').classList.add('hidden');

  const initial = data.usuario_nombre ? data.usuario_nombre.charAt(0).toUpperCase() : '?';

  if (data.solicitud_estado === 'ingresado') {
    solicitudSalidaId = data.solicitud_id;
    const permanencia = calcularPermanencia(data.hora_ingreso);
    const horaIngreso = data.hora_ingreso
      ? new Date(data.hora_ingreso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
      : '—';

    content.innerHTML = `
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
          <span class="label">Estacionamiento</span>
          <span class="value">${data.estacionamiento_nombre || '—'}</span>
        </div>
        <div class="detail-item">
          <span class="label">Plaza Asignada</span>
          <span class="value">${data.plaza_codigo || '—'}</span>
        </div>
        <div class="detail-item">
          <span class="label">Hora Ingreso</span>
          <span class="value">${horaIngreso}</span>
        </div>
        <div class="detail-item">
          <span class="label">Permanencia</span>
          <span class="value tiempo-permanencia">${permanencia}</span>
        </div>
        <div class="detail-item">
          <span class="label">Estado</span>
          <span class="value estado-ingresado">✅ Ingresado</span>
        </div>
      </div>
      <div class="salida-actions">
        <button id="confirmSalidaBtn" class="btn btn-primary">Confirmar Salida</button>
      </div>
    `;

    document.getElementById('confirmSalidaBtn').addEventListener('click', confirmarSalida);

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      const el = document.querySelector('.tiempo-permanencia');
      if (el) el.textContent = calcularPermanencia(data.hora_ingreso);
    }, 30000);

  } else if (data.solicitud_estado === 'pendiente') {
    content.innerHTML = `
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
          <span class="label">Estado</span>
          <span class="value">⏳ Pendiente de ingreso</span>
        </div>
      </div>
      <p class="no-ingreso-msg">El vehículo aún no ha ingresado. No se puede registrar salida.</p>
    `;
  } else {
    content.innerHTML = `
      <div class="user-card-header">
        <div class="user-avatar">${initial}</div>
        <div class="user-info">
          <h2>${data.usuario_nombre}</h2>
          <p class="user-placa">${data.placa || '—'}</p>
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
          <span class="value">Sin solicitud activa</span>
        </div>
      </div>
      <p class="no-ingreso-msg">No hay una solicitud de ingreso activa para este vehículo.</p>
    `;
  }
}

async function confirmarSalida() {
  if (!solicitudSalidaId) return;

  const btn = document.getElementById('confirmSalidaBtn');
  btn.disabled = true;
  btn.textContent = 'Registrando...';

  try {
    const response = await apiFetch('/api/supervisor/registrar-salida', {
      method: 'POST',
      body: JSON.stringify({ solicitud_id: solicitudSalidaId })
    });

    if (!response.ok) {
      const err = await response.json();
      mostrarError(err.error || 'Error al registrar salida');
      btn.disabled = false;
      btn.textContent = 'Confirmar Salida';
      return;
    }

    const data = await response.json();
    const permanencia = data.solicitud?.tiempo_permanencia_min;
    const permanenciaStr = permanencia
      ? `${Math.floor(permanencia / 60)}h ${Math.round(permanencia % 60)}min`
      : '—';

    document.getElementById('userInfoContent').innerHTML = `
      <div class="success-message">
        <h3>✅ Salida Registrada</h3>
        <p>Vehículo ${lastSearchData?.placa} salió exitosamente</p>
        <p>Plaza ${lastSearchData?.plaza_codigo || '—'} liberada</p>
        <p>Permanencia: ${permanenciaStr}</p>
      </div>
    `;

    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    solicitudSalidaId = null;
  } catch {
    mostrarError('Error de conexión al registrar salida');
    btn.disabled = false;
    btn.textContent = 'Confirmar Salida';
  }
}

init();
