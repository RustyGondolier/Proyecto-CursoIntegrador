const COLORS = ['#B50E30', '#2563EB', '#059669', '#D97706', '#7C3AED', '#DC2626', '#0891B2', '#65A30D'];
const chartInstances = {};
let chartDataCache = null;
let currentMode = 'hora';

function fmtFecha(d) {
  return d.toISOString().split('T')[0];
}

function hoy() {
  return new Date();
}

function hace30() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d;
}

async function init() {
  if (!isAuthenticated()) {
    window.location.href = '/auth/login.html';
    return;
  }

  await loadLayout();

  document.getElementById('welcomeText').textContent = 'Ocupación de Estacionamiento';

  document.getElementById('fechaHora').value = fmtFecha(hoy());
  document.getElementById('fechaDiaInicio').value = fmtFecha(hace30());
  document.getElementById('fechaDiaFin').value = fmtFecha(hoy());
  document.getElementById('fechaSemanaInicio').value = fmtFecha(hace30());
  document.getElementById('fechaSemanaFin').value = fmtFecha(hoy());

  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', onModeChange);
  });
  document.querySelectorAll('.chart-type-btn').forEach(btn => {
    btn.addEventListener('click', onTipoChange);
  });
  document.querySelectorAll('.filter-input').forEach(el => {
    el.addEventListener('change', () => cargarGrafico());
  });

  await cargarGrafico();
}

function onModeChange(e) {
  const btn = e.currentTarget;
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentMode = btn.dataset.mode;

  document.querySelectorAll('.filter-group').forEach(g => {
    g.classList.toggle('d-none', g.dataset.mode !== currentMode);
  });

  cargarGrafico();
}

function onTipoChange(e) {
  const btn = e.currentTarget;
  document.querySelectorAll('.chart-type-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  if (chartDataCache) {
    renderGrafico(chartDataCache.ocupacion, btn.dataset.type);
  }
}

function obtenerFechas() {
  switch (currentMode) {
    case 'hora':
      return {
        fecha_inicio: document.getElementById('fechaHora').value,
        fecha_fin: document.getElementById('fechaHora').value
      };
    case 'dia':
      return {
        fecha_inicio: document.getElementById('fechaDiaInicio').value,
        fecha_fin: document.getElementById('fechaDiaFin').value
      };
    case 'semana':
      return {
        fecha_inicio: document.getElementById('fechaSemanaInicio').value,
        fecha_fin: document.getElementById('fechaSemanaFin').value
      };
  }
}

function getTipoActivo() {
  const active = document.querySelector('.chart-type-btn.active');
  return active ? active.dataset.type : 'bar';
}

function hayDatos(data) {
  return Array.isArray(data) && data.length > 0;
}

async function cargarGrafico() {
  const fechas = obtenerFechas();
  if (!fechas.fecha_inicio || !fechas.fecha_fin) return;

  try {
    const data = await obtenerDashboardDireccion(fechas);
    chartDataCache = data;
    const tipo = getTipoActivo();
    renderGrafico(data.ocupacion, tipo);
  } catch {
    mostrarError();
  }
}

function mostrarSinDatos() {
  if (chartInstances['chartOcupacion']) {
    chartInstances['chartOcupacion'].destroy();
    delete chartInstances['chartOcupacion'];
  }
  document.querySelector('.chart-container').classList.add('d-none');
  document.querySelector('.error-msg').classList.add('d-none');
  document.querySelector('.no-data').classList.remove('d-none');
}

function mostrarError() {
  if (chartInstances['chartOcupacion']) {
    chartInstances['chartOcupacion'].destroy();
    delete chartInstances['chartOcupacion'];
  }
  document.querySelector('.chart-container').classList.add('d-none');
  document.querySelector('.no-data').classList.add('d-none');
  document.querySelector('.error-msg').classList.remove('d-none');
}

function mostrarConDatos() {
  document.querySelector('.chart-container').classList.remove('d-none');
  document.querySelector('.no-data').classList.add('d-none');
  document.querySelector('.error-msg').classList.add('d-none');
}

function crearOActualizarGrafico(config) {
  if (chartInstances['chartOcupacion']) {
    chartInstances['chartOcupacion'].destroy();
    delete chartInstances['chartOcupacion'];
  }
  mostrarConDatos();
  const ctx = document.getElementById('chartOcupacion').getContext('2d');
  chartInstances['chartOcupacion'] = new Chart(ctx, config);
}

function renderGrafico(ocupacion, tipo) {
  switch (currentMode) {
    case 'hora':
      renderPorHora(ocupacion.por_hora, tipo);
      break;
    case 'dia':
      renderPorDia(ocupacion.por_dia, tipo);
      break;
    case 'semana':
      renderPorSemana(ocupacion.por_semana, tipo);
      break;
  }
}

function renderPorHora(raw, tipo) {
  if (!hayDatos(raw)) {
    mostrarSinDatos();
    renderTablaVacia();
    return;
  }

  const labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
  const estacionamientos = [...new Set(raw.map(d => d.estacionamiento))];
  const datasets = estacionamientos.map((est, i) => {
    const mapa = {};
    for (let h = 0; h < 24; h++) mapa[h] = 0;
    raw.filter(d => d.estacionamiento === est).forEach(d => { mapa[d.hora] = Number(d.ocupadas); });
    return {
      label: est,
      data: Array.from({ length: 24 }, (_, i) => mapa[i]),
      borderColor: COLORS[i % COLORS.length],
      backgroundColor: tipo === 'line'
        ? COLORS[i % COLORS.length] + '20'
        : tipo === 'radar'
          ? COLORS[i % COLORS.length] + '60'
          : COLORS[i % COLORS.length],
      borderWidth: 2,
      fill: tipo === 'line' || tipo === 'radar',
      tension: 0.3
    };
  });

  crearOActualizarGrafico({
    type: tipo === 'radar' ? 'radar' : tipo,
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'top' } },
      scales: tipo !== 'radar' ? {
        y: { beginAtZero: true, title: { display: true, text: 'Plazas ocupadas' } }
      } : {}
    }
  });

  renderTabla(raw);
}

function renderPorDia(raw, tipo) {
  if (!hayDatos(raw)) {
    mostrarSinDatos();
    renderTablaVacia();
    return;
  }

  const labels = [...new Set(raw.map(d => {
    const dt = new Date(d.dia);
    return isNaN(dt.getTime()) ? d.dia : dt.toISOString().split('T')[0];
  }))].sort();

  const estacionamientos = [...new Set(raw.map(d => d.estacionamiento))];
  const datasets = estacionamientos.map((est, i) => ({
    label: est,
    data: labels.map(f => {
      const item = raw.find(d => d.estacionamiento === est && new Date(d.dia).toISOString().split('T')[0] === f);
      return item ? Number(item.ocupadas) : 0;
    }),
    borderColor: COLORS[i % COLORS.length],
    backgroundColor: tipo === 'line'
      ? COLORS[i % COLORS.length] + '20'
      : tipo === 'radar'
        ? COLORS[i % COLORS.length] + '60'
        : COLORS[i % COLORS.length],
    borderWidth: 2,
    fill: tipo === 'line' || tipo === 'radar',
    tension: 0.3
  }));

  crearOActualizarGrafico({
    type: tipo === 'radar' ? 'radar' : tipo,
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'top' } },
      scales: tipo !== 'radar' ? {
        y: { beginAtZero: true, title: { display: true, text: 'Plazas ocupadas' } }
      } : {}
    }
  });

  renderTabla(raw);
}

function renderPorSemana(raw, tipo) {
  if (!hayDatos(raw)) {
    mostrarSinDatos();
    renderTablaVacia();
    return;
  }

  const labels = [...new Set(raw.map(d => d.semana))].sort();
  const estacionamientos = [...new Set(raw.map(d => d.estacionamiento))];
  const datasets = estacionamientos.map((est, i) => ({
    label: est,
    data: labels.map(s => {
      const item = raw.find(d => d.estacionamiento === est && d.semana === s);
      return item ? Number(item.ocupadas) : 0;
    }),
    borderColor: COLORS[i % COLORS.length],
    backgroundColor: tipo === 'line'
      ? COLORS[i % COLORS.length] + '20'
      : tipo === 'radar'
        ? COLORS[i % COLORS.length] + '60'
        : COLORS[i % COLORS.length],
    borderWidth: 2,
    fill: tipo === 'line' || tipo === 'radar',
    tension: 0.3
  }));

  crearOActualizarGrafico({
    type: tipo === 'radar' ? 'radar' : tipo,
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'top' } },
      scales: tipo !== 'radar' ? {
        y: { beginAtZero: true, title: { display: true, text: 'Plazas ocupadas' } }
      } : {}
    }
  });

  renderTabla(raw);
}

function renderTabla(raw) {
  const estacionamientos = [...new Set(raw.map(d => d.estacionamiento))].sort();
  const rows = estacionamientos.map(est => {
    const values = raw.filter(d => d.estacionamiento === est).map(d => Number(d.ocupadas));
    const total = values.reduce((a, b) => a + b, 0);
    const pico = Math.max(...values);
    const promedio = (total / values.length).toFixed(1);
    return { estacionamiento: est, total, pico, promedio };
  });

  const totalGeneral = rows.reduce((a, r) => a + r.total, 0);

  document.getElementById('tablaBody').innerHTML = `
    <table class="resumen-table">
      <thead>
        <tr>
          <th>Estacionamiento</th>
          <th>Total ocupaciones</th>
          <th>Pico</th>
          <th>Promedio</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(r => `
          <tr>
            <td>${r.estacionamiento}</td>
            <td>${r.total}</td>
            <td>${r.pico}</td>
            <td>${r.promedio}</td>
          </tr>
        `).join('')}
        <tr class="resumen-total">
          <td><strong>Total</strong></td>
          <td><strong>${totalGeneral}</strong></td>
          <td></td>
          <td></td>
        </tr>
      </tbody>
    </table>
  `;
}

function renderTablaVacia() {
  document.getElementById('tablaBody').innerHTML = '<p class="empty-message">Sin datos para el período seleccionado.</p>';
}

init();
