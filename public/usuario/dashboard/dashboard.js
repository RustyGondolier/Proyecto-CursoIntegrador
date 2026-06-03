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
      <p><strong>Tiempo restante:</strong> ${data.tiempo_restante || '—'}</p>
      <button class="btn btn-secondary" id="cancelRequestBtn">Cancelar solicitud</button>
    `;

    document.getElementById('cancelRequestBtn')?.addEventListener('click', async () => {
      await apiFetch('/api/solicitudes/cancelar', { method: 'POST' });
      renderActiveRequest();
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
      const response = await apiFetch('/api/solicitudes/crear', {
        method: 'POST',
        body: JSON.stringify({ estacionamiento_id: Number(id) })
      });

      if (!response.ok) {
        const err = await response.json();
        alert(err.error || 'Error al solicitar plaza');
        return;
      }

      alert('Solicitud creada con éxito');
      renderActiveRequest();
    } catch {
      alert('Error de conexión al solicitar plaza');
    }
  }
});

init();
