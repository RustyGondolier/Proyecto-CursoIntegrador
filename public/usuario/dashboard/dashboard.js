let timerInterval = null;

async function init() {
  if (!isAuthenticated()) {
    window.location.href = '/auth/login.html';
    return;
  }

  await loadLayout();

  const usuario = getSessionUser();
  document.getElementById('welcomeText').textContent = `Bienvenido, ${usuario.nombre}`;

  await Promise.all([
    renderActiveRequest(),
    renderLocationStatus(),
    renderParkingGrid()
  ]);
}

async function renderActiveRequest() {
  const container = document.getElementById('activeRequest');
  container.innerHTML = '<p>Cargando solicitud activa...</p>';
  clearInterval(timerInterval);

  try {
    const response = await apiFetch('/api/solicitudes/activa');
    if (!response.ok) {
      container.innerHTML = '<p>No tienes una solicitud activa.</p>';
      return;
    }

    const data = await response.json();
    container.innerHTML = `
      <h3>Solicitud activa</h3>
      <p><strong>Estacionamiento:</strong> ${data.estacionamiento_nombre}</p>
      <p><strong>Estado:</strong> ${data.estado}</p>
      <p><strong>Tiempo restante:</strong> <span id="timeLeft">${data.tiempo_restante || '—'}</span></p>
      <button class="btn btn-secondary" id="cancelRequestBtn">Cancelar solicitud</button>
    `;

    if (data.hora_limite_ingreso) {
      const fin = new Date(data.hora_limite_ingreso).getTime();

      timerInterval = setInterval(() => {
        const diff = Math.max(0, Math.floor((fin - Date.now()) / 1000));
        const el = document.getElementById('timeLeft');

        if (diff <= 0) {
          clearInterval(timerInterval);
          timerInterval = null;
          if (el) el.textContent = 'Expirado';
          updateParkingGrid();
          return;
        }

        if (el) el.textContent = `${Math.floor(diff / 60)} min ${diff % 60} s`;
      }, 1000);
    }

    document.getElementById('cancelRequestBtn')?.addEventListener('click', async () => {
      clearInterval(timerInterval);
      timerInterval = null;
      await apiFetch('/api/solicitudes/cancelar', { method: 'POST' });
      renderActiveRequest();
      updateParkingGrid();
    });
  } catch {
    container.innerHTML = '<p>No tienes una solicitud activa.</p>';
  }
}

async function renderLocationStatus() {
  const container = document.getElementById('locationStatus');
  container.innerHTML = '<p>Obteniendo ubicación...</p>';

  try {
    const position = await getCurrentPosition();
    container.innerHTML = `
      <p>Ubicación detectada automáticamente.</p>
      <p class="coords">Lat: ${position.lat.toFixed(4)}, Lng: ${position.lng.toFixed(4)}</p>
    `;
  } catch (err) {
    container.innerHTML = `
      <p>${err}</p>
      <p>La ubicación se validará al solicitar una plaza.</p>
    `;
  }
}

async function renderParkingGrid() {
  const container = document.getElementById('parkingContainer');
  container.innerHTML = '<p>Cargando estacionamientos...</p>';

  try {
    const response = await apiFetch('/api/estacionamientos/ocupacion');
    if (!response.ok) throw new Error('Error al cargar');

    const estacionamientos = await response.json();
    container.innerHTML = estacionamientos.length
      ? estacionamientos.map(createParkingCard).join('')
      : '<p>No hay estacionamientos disponibles.</p>';
  } catch {
    container.innerHTML = '<p>No se pudieron cargar los estacionamientos. Intenta de nuevo más tarde.</p>';
  }
}

async function updateParkingGrid() {
  try {
    const response = await apiFetch('/api/estacionamientos/ocupacion');
    if (!response.ok) return;

    const estacionamientos = await response.json();
    estacionamientos.forEach(e => {
      const card = document.querySelector(`.parking-card[data-id="${e.id}"]`);
      if (!card) return;

      const autosPct = e.autos_total ? Math.round((e.autos_ocupados / e.autos_total) * 100) : 0;
      const motosPct = e.motos_total ? Math.round((e.motos_ocupadas / e.motos_total) * 100) : 0;

      const parrafos = card.querySelectorAll('.parking-body p');
      if (parrafos[0]) parrafos[0].textContent = `Autos: ${e.autos_ocupados} / ${e.autos_total}`;
      if (parrafos[1]) parrafos[1].textContent = `Motos: ${e.motos_ocupadas} / ${e.motos_total}`;

      const fills = card.querySelectorAll('.progress-fill');
      if (fills[0]) fills[0].style.width = `${autosPct}%`;
      if (fills[1]) fills[1].style.width = `${motosPct}%`;
    });
  } catch {
    /* silencioso */
  }
}

function createParkingCard(e) {
  const autosPct = e.autos_total ? Math.round((e.autos_ocupados / e.autos_total) * 100) : 0;
  const motosPct = e.motos_total ? Math.round((e.motos_ocupadas / e.motos_total) * 100) : 0;

  return `
    <div class="parking-card" data-id="${e.id}">
      <img
        class="parking-image"
        src="/assets/images/campus/estacionamiento-${e.id}.jpg"
        alt="${e.nombre}"
      >
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

        <div class="parking-actions">
          <button class="btn btn-secondary view-btn">Ver estacionamiento</button>
          <button class="btn btn-primary request-btn">Solicitar plaza</button>
        </div>
      </div>
    </div>
  `;
}

document.addEventListener('click', async (e) => {
  const card = e.target.closest('.parking-card');
  if (!card) return;

  const id = card.dataset.id;

  if (e.target.classList.contains('view-btn')) {
    window.location.href = `/usuario/estacionamiento/estacionamiento.html?id=${id}`;
  }

  if (e.target.classList.contains('request-btn')) {
    try {
      const position = await getCurrentPosition();
      const response = await apiFetch('/api/solicitudes/crear', {
        method: 'POST',
        body: JSON.stringify({
          estacionamiento_id: Number(id),
          lat: position.lat,
          lng: position.lng
        })
      });

      if (!response.ok) {
        const err = await response.json();
        alert(err.error || 'Error al solicitar plaza');
        return;
      }

      alert('Solicitud creada con éxito');
      renderActiveRequest();
      updateParkingGrid();
    } catch {
      alert('Error de conexión al solicitar plaza');
    }
  }
});

window.refreshParkingGrid = updateParkingGrid;

init();