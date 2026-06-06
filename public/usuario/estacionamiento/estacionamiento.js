const COCHERAS = {
  1: {
    svg: 'EstacionamientoSubterraneo',
    layerParking: 'layer11',
    layerRutas: 'layer9',
    matchPlaza: null
  },
  2: {
    svg: 'EstacionamientoExterior',
    layerParking: 'layer5',
    layerRutas: 'layer3',
    matchPlaza: (rect, plazas) => plazas.find(p => p.codigo === rect.id)
  }
};

let estacionamientoId = 1;
let plazasData = [];
let rectsPlaza = [];
let plazaAsignadaId = null;
let rutaVisible = true;
let svgActual = null;
let autoMarcadoActivo = true;

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

    const cfg = COCHERAS[id];
    if (!cfg) throw new Error(`Cochera ${id} no configurada`);

    const svgResp = await fetch(`/assets/svg/${cfg.svg}.svg`);
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
  const cfg = COCHERAS[estacionamientoId];
  const layer = svg.querySelector(`#${cfg.layerParking}`);
  const candidatos = layer ? Array.from(layer.querySelectorAll('rect')) : [];

  const autoPlazas = plazasData.filter(p => p.tipo_vehiculo === 'auto' || p.codigo?.includes('-A-'));
  const motoPlazas = plazasData.filter(p => p.tipo_vehiculo === 'moto' || p.codigo?.includes('-M-'));

  rectsPlaza = [];

  if (cfg.matchPlaza) {
    mapearPorCodigo(candidatos, cfg.matchPlaza);
  } else {
    const autoRects = filtrarPorDimension(candidatos, 'auto');
    const motoRects = filtrarPorDimension(candidatos, 'moto');
    mapearPosicional(autoRects, autoPlazas);
    mapearPosicional(motoRects, motoPlazas);
  }

  enlazarRutas(svg);
}

function filtrarPorDimension(rects, tipo) {
  return rects.filter(r => {
    const w = parseFloat(r.getAttribute('width'));
    const h = parseFloat(r.getAttribute('height'));
    if (tipo === 'auto') return w >= 8 && h >= 15;
    if (tipo === 'moto') return (w >= 5 && w < 8) || (h >= 3 && h < 15);
    return false;
  });
}

function mapearPorCodigo(rects, matcher) {
  rects.forEach(rect => {
    if (!rect.id) return;
    const plaza = matcher(rect, plazasData);
    if (!plaza) return;
    asignarRect(rect, plaza);
  });
}

function mapearPosicional(rects, plazas) {
  rects.forEach((rect, i) => {
    if (i >= plazas.length) return;
    asignarRect(rect, plazas[i]);
  });
}

function asignarRect(rect, plaza) {
  rect.dataset.plazaCodigo = plaza.codigo;
  rect.dataset.plazaEstado = plaza.estado;
  rect.dataset.plazaId = plaza.id;
  rect.dataset.bloqueLetra = plaza.letra_bloque;
  rect.dataset.numeroPlaza = plaza.numero_plaza;
  rect.plazaData = plaza;
  rect.style.cursor = 'pointer';
  rect.addEventListener('click', () => onPlazaClick(rect.plazaData || plaza, rect));
  rectsPlaza.push(rect);
}

function enlazarRutas(svg) {
  const cfg = COCHERAS[estacionamientoId];

  const layerRutas = svg.querySelector(`#${cfg.layerRutas}`);
  if (!layerRutas) return;

  layerRutas.style.display = '';
  layerRutas.querySelectorAll('path').forEach(p => {
    p.style.display = 'inline';
  });
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
  const autoBtn = document.getElementById('autoMarkerBtn');

  if (!plazaAsignadaId) {
    infoEl.innerHTML = '<p>No tienes una plaza asignada. Selecciona una plaza para ver su ruta.</p>';
    plazaInfoEl.style.display = 'none';
    autoBtn.style.display = 'none';
    ocultarRuta();
    return;
  }

  autoBtn.style.display = 'inline-block';
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
  document.getElementById('plazaInfoDetail').textContent =
    `Bloque ${plaza.letra_bloque} - Plaza N° ${plaza.numero_plaza} (${plaza.estado})`;
  toggleBtn.style.display = 'inline-block';
  toggleBtn.textContent = 'Ocultar ruta';
  plazaInfoEl.style.display = 'flex';
  rutaVisible = true;

  mostrarRuta(plaza.codigo);
  colorearPlazas();
}

function mostrarRuta(plazaCodigo) {
  ocultarRuta();

  const ruta = document.getElementById(`ruta-${plazaCodigo}`);
  if (ruta) ruta.style.display = 'inline';
}

function ocultarRuta() {
  document.querySelectorAll('path[id^="ruta"]').forEach(p => {
    p.style.display = 'none';
  });
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
  document.getElementById('plazaInfo').style.display = 'none';
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
    toggleBtn.textContent = rutaVisible ? 'Ocultar ruta' : 'Mostrar ruta';
  } else {
    toggleBtn.style.display = 'none';
  }

  plazaInfoEl.style.display = 'flex';

  if (!plazaAsignadaId || String(plaza.id) === String(plazaAsignadaId)) {
    mostrarRuta(plaza.codigo);
  }
}

function alternarCochera(id) {
  const url = new URL(location.href);
  url.searchParams.set('id', id);
  history.pushState({}, '', url);
  cargarMapa(id);
}

init();
