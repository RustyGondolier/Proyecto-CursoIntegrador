const COCHERAS = {
  1: {
    svg: 'EstacionamientoSubterraneo',
    layerParking: 'layer11',
    layerRutas: 'layer9',
    matchPlaza: (rect, plazas) => plazas.find(p => p.codigo === rect.id)
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
    marcarPlazaAsignada();

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

  if (!plazaAsignadaId) {
    infoEl.innerHTML = `
      <div class="asignacion-empty">
        <p>No tienes una plaza asignada.</p>
        <p class="asignacion-sub">Selecciona una plaza en el mapa para ver su ruta.</p>
      </div>
    `;
    ocultarRuta();
    return;
  }

  const plaza = plazasData.find(p => String(p.id) === String(plazaAsignadaId));
  if (!plaza) {
    infoEl.innerHTML = '<p class="asignacion-empty">Plaza asignada no encontrada en este estacionamiento.</p>';
    ocultarRuta();
    return;
  }

  infoEl.innerHTML = `
    <div class="asignacion-info">
      <div class="asignacion-head">
        <span class="asignacion-label">Mi plaza</span>
        <span class="estado-badge estado-${plaza.estado}">${plaza.estado}</span>
      </div>
      <div class="asignacion-plaza-codigo">${plaza.codigo}</div>
      <div class="asignacion-details">
        <span>Bloque ${plaza.letra_bloque}</span>
        <span class="asignacion-sep">·</span>
        <span>Plaza N° ${plaza.numero_plaza}</span>
      </div>
    </div>
  `;

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

function onPlazaClick(plaza, rect) {
  ocultarRuta();
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
