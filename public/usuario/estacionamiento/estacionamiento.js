let estacionamientoId = 1;
let plazasData = [];
let rectsPlaza = [];
let plazaAsignadaId = null;
let rutaVisible = true;
let svgActual = null;
let autoMarcadoActivo = true;

const PARKING_LAYER_ID = { 1: 'layer11', 2: 'layer5' };
const SVG_FILENAME = { 1: 'EstacionamientoSubterraneo', 2: 'EstacionamientoExterior' };

async function init() {
  if (!isAuthenticated()) {
    window.location.href = '/auth/login.html';
    return;
  }

  await loadLayout();

  estacionamientoId = new URLSearchParams(location.search).get('id') || '1';

  document.querySelectorAll('.select-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.select-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      alternarCochera(btn.dataset.id);
    });
  });

  document.getElementById('toggleRouteBtn')?.addEventListener('click', toggleRuta);
  document.getElementById('autoMarkerBtn')?.addEventListener('click', toggleAutoMarcado);

  window.onPlazaAsignada = async (data) => {
    console.log('[Mapa] Plaza asignada recibida:', data);
    await cargarMapa(estacionamientoId);
  };

  await cargarMapa(estacionamientoId);
}

async function cargarMapa(id) {
  estacionamientoId = id;
  plazaAsignadaId = null;
  rutaVisible = true;

  const container = document.getElementById('svgContainer');
  container.innerHTML = '<p class="loading-text">Cargando mapa...</p>';

  try {
    const [plazasResp, activaResp] = await Promise.all([
      apiFetch(`/api/estacionamientos/${id}/plazas`),
      apiFetch('/api/solicitudes/activa').catch(() => null)
    ]);

    if (!plazasResp.ok) throw new Error('Error al cargar plazas');
    plazasData = await plazasResp.json();

    if (activaResp && activaResp.ok) {
      const activa = await activaResp.json();
      plazaAsignadaId = activa.plaza_asignada_id || null;
    }

    const filename = SVG_FILENAME[id];
    const svgResp = await fetch(`/assets/svg/${filename}.svg`);
    if (!svgResp.ok) throw new Error('Error al cargar SVG');
    const svgText = await svgResp.text();

    container.innerHTML = svgText;
    svgActual = container.querySelector('svg');
    if (!svgActual) throw new Error('SVG no válido');

    asignarPlazas(svgActual);
    colorearPlazas();
    if (autoMarcadoActivo) marcarPlazaAsignada();

  } catch (err) {
    console.error(err);
    container.innerHTML = `
      <div class="card" style="text-align:center;padding:40px;">
        <p style="color:var(--color-text-light)">No se pudo cargar el mapa.</p>
        <button class="btn btn-primary" onclick="cargarMapa(${id})">Reintentar</button>
      </div>
    `;
  }
}

function asignarPlazas(svg) {
  const layerId = PARKING_LAYER_ID[estacionamientoId];
  let candidatos;

  if (layerId) {
    const layer = svg.querySelector(`#${layerId}`);
    candidatos = layer ? Array.from(layer.querySelectorAll('rect')) : [];
  } else {
    candidatos = Array.from(svg.querySelectorAll('rect'));
  }

  const autoRects = candidatos.filter(r => {
    const w = parseFloat(r.getAttribute('width'));
    const h = parseFloat(r.getAttribute('height'));
    return w >= 8 && h >= 15;
  });

  const motoRects = candidatos.filter(r => {
    const w = parseFloat(r.getAttribute('width'));
    const h = parseFloat(r.getAttribute('height'));
    return (w >= 5 && w < 8) || (h >= 3 && h < 15);
  });

  const autoPlazas = plazasData.filter(p => p.tipo_vehiculo === 'auto' || p.codigo?.includes('-A-'));
  const motoPlazas = plazasData.filter(p => p.tipo_vehiculo === 'moto' || p.codigo?.includes('-M-'));

  rectsPlaza = [];

  function mapearRects(rects, plazas) {
    rects.forEach((rect, i) => {
      if (i >= plazas.length) return;
      const plaza = plazas[i];
      rect.id = plaza.codigo;
      rect.dataset.plazaCodigo = plaza.codigo;
      rect.dataset.plazaEstado = plaza.estado;
      rect.dataset.plazaId = plaza.id;
      rect.dataset.bloqueLetra = plaza.letra_bloque;
      rect.dataset.numeroPlaza = plaza.numero_plaza;
      rect.plazaData = plaza;
      rect.style.cursor = 'pointer';
      rect.addEventListener('click', () => onPlazaClick(rect.plazaData || plaza, rect));
      rectsPlaza.push(rect);
    });
  }

  mapearRects(autoRects, autoPlazas);
  mapearRects(motoRects, motoPlazas);

  // Set dynamic path IDs for direct lookup
  svg.querySelectorAll('path[id^="ruta"]').forEach(path => {
    const match = path.id.match(/ruta([A-Z])(\d+)/i);
    if (!match) return;
    const letra = match[1].toUpperCase();
    const num = parseInt(match[2], 10);
    const plaza = plazasData.find(p => {
      const bloque = p.codigo?.split('-').slice(-2, -1)[0];
      const numero = parseInt(p.codigo?.split('-').pop(), 10);
      return bloque === letra && numero === num;
    });
    if (plaza) path.id = `ruta-${plaza.codigo}`;
  });

  console.log(`[Mapa] ${rectsPlaza.length} rects mapeados (${autoPlazas.length} autos, ${motoPlazas.length} motos)`);
}

function colorearPlazas() {
  rectsPlaza.forEach(rect => {
    const estado = rect.dataset.plazaEstado;
    if (!estado) return;

    rect.classList.remove(
      'plaza-disponible', 'plaza-ocupada', 'plaza-bloqueada',
      'plaza-mantenimiento', 'plaza-mi-plaza'
    );

    if (plazaAsignadaId && String(rect.dataset.plazaId) === String(plazaAsignadaId)) {
      rect.classList.add('plaza-mi-plaza');
    } else {
      rect.classList.add('plaza-' + estado);
    }
  });
}

async function marcarPlazaAsignada() {
  const infoEl = document.getElementById('activeRequestInfo');
  const plazaInfoEl = document.getElementById('plazaInfo');
  const toggleBtn = document.getElementById('toggleRouteBtn');

  if (!plazaAsignadaId) {
    infoEl.innerHTML = '<p>No tienes una plaza asignada.</p>';
    plazaInfoEl.style.display = 'none';
    ocultarRuta();
    return;
  }

  const plaza = plazasData.find(p => String(p.id) === String(plazaAsignadaId));
  if (!plaza) {
    infoEl.innerHTML = '<p>Plaza asignada no encontrada en el mapa.</p>';
    return;
  }

  infoEl.innerHTML = `
    <p><strong>Plaza asignada:</strong> ${plaza.codigo} (Bloque ${plaza.letra_bloque}, N° ${plaza.numero_plaza})</p>
    <p><strong>Estado:</strong> ${plaza.estado}</p>
  `;

  if (!autoMarcadoActivo) return;

  document.getElementById('plazaInfoTitle').textContent = `Plaza: ${plaza.codigo}`;
  document.getElementById('plazaInfoDetail').textContent = `Bloque ${plaza.letra_bloque} - Plaza N° ${plaza.numero_plaza} (${plaza.estado})`;
  toggleBtn.style.display = 'inline-block';
  toggleBtn.textContent = 'Ocultar ruta';
  plazaInfoEl.style.display = 'flex';
  rutaVisible = true;

  mostrarRuta(plaza.codigo);
  colorearPlazas();
}

function mostrarRuta(plazaCodigo) {
  if (!svgActual) return;

  ocultarRuta();

  const ruta = svgActual.getElementById(`ruta-${plazaCodigo}`);
  if (ruta) {
    ruta.classList.add('ruta-visible');
    return;
  }

  const bloque = plazaCodigo.split('-').slice(-2, -1)[0];
  const numero = plazaCodigo.split('-').pop();
  let encontrada = false;

  svgActual.querySelectorAll('path[id^="ruta"]').forEach(path => {
    const match = path.id.match(/ruta([A-Z])(\d+)/i);
    if (!match) return;

    if (match[1].toUpperCase() === bloque && parseInt(match[2], 10) === parseInt(numero, 10)) {
      path.classList.add('ruta-visible');
      encontrada = true;
    }
  });

  if (!encontrada) {
    console.warn('[Mapa] No se encontró ruta exacta para', plazaCodigo, ', mostrando todas como fallback');
    svgActual.querySelectorAll('path[id^="ruta"]').forEach(path => path.classList.add('ruta-visible'));
  }
}

function ocultarRuta() {
  if (!svgActual) return;
  svgActual.querySelectorAll('path[id^="ruta"]').forEach(path => path.classList.remove('ruta-visible'));
}

function toggleAutoMarcado() {
  autoMarcadoActivo = !autoMarcadoActivo;
  const btn = document.getElementById('autoMarkerBtn');
  if (autoMarcadoActivo) {
    btn.classList.add('active');
    btn.textContent = 'Auto: ON';
    if (plazaAsignadaId) marcarPlazaAsignada();
  } else {
    btn.classList.remove('active');
    btn.textContent = 'Auto: OFF';
    ocultarAutoMarcado();
  }
}

function ocultarAutoMarcado() {
  const plazaInfoEl = document.getElementById('plazaInfo');
  plazaInfoEl.style.display = 'none';
  ocultarRuta();
}

function toggleRuta() {
  if (!plazaAsignadaId) return;
  const plaza = plazasData.find(p => String(p.id) === String(plazaAsignadaId));
  if (!plaza) return;

  rutaVisible = !rutaVisible;
  const btn = document.getElementById('toggleRouteBtn');
  if (rutaVisible) {
    mostrarRuta(plaza.codigo);
    btn.textContent = 'Ocultar ruta';
  } else {
    ocultarRuta();
    btn.textContent = 'Mostrar ruta';
  }
}

function onPlazaClick(plaza, rect) {
  const title = document.getElementById('plazaInfoTitle');
  const detail = document.getElementById('plazaInfoDetail');
  const toggleBtn = document.getElementById('toggleRouteBtn');
  const plazaInfoEl = document.getElementById('plazaInfo');

  title.textContent = `Plaza: ${plaza.codigo}`;
  detail.textContent = `Bloque ${plaza.letra_bloque} - Plaza N° ${plaza.numero_plaza} (${plaza.estado})`;

  if (plazaAsignadaId && String(plaza.id) === String(plazaAsignadaId)) {
    toggleBtn.style.display = 'inline-block';
    if (rutaVisible) {
      toggleBtn.textContent = 'Ocultar ruta';
    } else {
      toggleBtn.textContent = 'Mostrar ruta';
    }
  } else if (plaza.estado === 'ocupada' || plaza.estado === 'disponible') {
    toggleBtn.style.display = 'none';
  } else {
    toggleBtn.style.display = 'none';
  }

  plazaInfoEl.style.display = 'flex';
}

function alternarCochera(id) {
  const url = new URL(location.href);
  url.searchParams.set('id', id);
  history.pushState({}, '', url);
  cargarMapa(id);
}

init();
