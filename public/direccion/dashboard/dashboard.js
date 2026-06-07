const COLORS = ['#B50E30', '#2563EB', '#059669', '#D97706', '#7C3AED', '#DC2626', '#0891B2', '#65A30D'];

const chartInstances = {};
const chartDataCache = {};

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

/* ── Init ── */

async function init() {
  if (!isAuthenticated()) {
    window.location.href = '/auth/login.html';
    return;
  }

  await loadLayout();

  const usuario = getSessionUser();
  document.getElementById('welcomeText').textContent = `Panel de Métricas, ${usuario.nombre}`;

  document.getElementById('statsFechaInicio').value = fmtFecha(hace30());
  document.getElementById('statsFechaFin').value = fmtFecha(hoy());
  document.getElementById('statsFechaInicio').addEventListener('change', cargarStats);
  document.getElementById('statsFechaFin').addEventListener('change', cargarStats);

  document.getElementById('ocupacionDia').value = fmtFecha(hoy());
  const semana = fmtFecha(hoy());
  const hoyDt = new Date();
  const dayOfWeek = hoyDt.getDay() || 7;
  const monday = new Date(hoyDt);
  monday.setDate(hoyDt.getDate() - dayOfWeek + 1);
  const weekStr = monday.getFullYear() + '-W' + String(Math.ceil((((monday - new Date(monday.getFullYear(), 0, 1)) / 86400000) + monday.getDay() + 1) / 7)).padStart(2, '0');
  document.getElementById('ocupacionSemana').value = weekStr;
  document.querySelector('.ocupacion-range-inicio').value = fmtFecha(hace30());
  document.querySelector('.ocupacion-range-fin').value = fmtFecha(hoy());

  document.querySelectorAll('.chart-date-inicio').forEach(el => {
    el.value = fmtFecha(hace30());
    el.addEventListener('change', () => cargarGrafico(el.dataset.target));
  });
  document.querySelectorAll('.chart-date-fin').forEach(el => {
    el.value = fmtFecha(hoy());
    el.addEventListener('change', () => cargarGrafico(el.dataset.target));
  });

  document.querySelectorAll('.chart-type-btn').forEach(btn => {
    btn.addEventListener('click', onChangeChartType);
  });
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', onToggleOcupacionMode);
  });
  document.querySelectorAll('.ocupacion-date, .ocupacion-week, .ocupacion-range-inicio, .ocupacion-range-fin').forEach(el => {
    el.addEventListener('change', () => cargarGrafico('chartOcupacion'));
  });

  await Promise.all([
    cargarStats(),
    cargarGrafico('chartPermanencia'),
    cargarGrafico('chartSolicitudes'),
    cargarGrafico('chartOcupacion'),
    cargarGrafico('chartReportes')
  ]);
}

/* ── Stats ── */

async function cargarStats() {
  const container = document.getElementById('statsContainer');
  container.innerHTML = '<p class="empty-message">Cargando estadísticas...</p>';

  try {
    const data = await obtenerDashboardDireccion({
      fecha_inicio: document.getElementById('statsFechaInicio').value,
      fecha_fin: document.getElementById('statsFechaFin').value
    });
    renderStats(data.resumen);
  } catch {
    container.innerHTML = '<p class="empty-message">Error al cargar las estadísticas.</p>';
  }
}

function renderStats(resumen) {
  document.getElementById('statsContainer').innerHTML = `
    <div class="stat-card stat-solicitudes">
      <p class="stat-number">${resumen.total_solicitudes}</p>
      <p class="stat-label">Solicitudes</p>
    </div>
    <div class="stat-card stat-ingresos">
      <p class="stat-number">${resumen.total_ingresos}</p>
      <p class="stat-label">Ingresos</p>
    </div>
    <div class="stat-card stat-infracciones">
      <p class="stat-number">${resumen.total_infracciones}</p>
      <p class="stat-label">Infracciones</p>
    </div>
    <div class="stat-card stat-reportes">
      <p class="stat-number">${resumen.total_reportes}</p>
      <p class="stat-label">Reportes</p>
    </div>
  `;
}

/* ── Per-chart fetch ── */

function obtenerFechasOcupacion() {
  const mode = document.querySelector('.mode-btn.active');
  if (!mode) return { fecha_inicio: fmtFecha(hace30()), fecha_fin: fmtFecha(hoy()) };

  switch (mode.dataset.mode) {
    case 'dia': {
      const val = document.getElementById('ocupacionDia').value;
      return { fecha_inicio: val, fecha_fin: val };
    }
    case 'semana': {
      const val = document.getElementById('ocupacionSemana').value;
      return semanaARango(val);
    }
    default: {
      const card = document.getElementById('cardOcupacion');
      const inicio = card.querySelector('.ocupacion-range-inicio').value;
      const fin = card.querySelector('.ocupacion-range-fin').value;
      return { fecha_inicio: inicio, fecha_fin: fin };
    }
  }
}

function semanaARango(weekStr) {
  if (!weekStr) return { fecha_inicio: fmtFecha(hace30()), fecha_fin: fmtFecha(hoy()) };
  const [year, week] = weekStr.split('-W').map(Number);
  const jan1 = new Date(year, 0, 1);
  const daysOffset = (week - 1) * 7 - (jan1.getDay() || 7) + 1;
  const monday = new Date(year, 0, 1 + daysOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { fecha_inicio: fmtFecha(monday), fecha_fin: fmtFecha(sunday) };
}

async function cargarGrafico(canvasId) {
  const card = document.getElementById('card' + canvasId.replace('chart', ''));
  if (!card) return;
  const tipo = getTipoActivo(canvasId);

  let fechaInicio, fechaFin;

  if (canvasId === 'chartOcupacion') {
    const fe = obtenerFechasOcupacion();
    fechaInicio = fe.fecha_inicio;
    fechaFin = fe.fecha_fin;
  } else {
    fechaInicio = card.querySelector('.chart-date-inicio').value;
    fechaFin = card.querySelector('.chart-date-fin').value;
  }

  try {
    const data = await obtenerDashboardDireccion({ fecha_inicio: fechaInicio, fecha_fin: fechaFin });
    chartDataCache[canvasId] = data;

    switch (canvasId) {
      case 'chartPermanencia':
        renderGraficoPermanencia(data.permanencia, tipo);
        break;
      case 'chartSolicitudes':
        renderGraficoSolicitudes(data.solicitudes_por_hora, tipo);
        break;
      case 'chartOcupacion':
        renderGraficoOcupacion(data.ocupacion, tipo);
        break;
      case 'chartReportes':
        renderGraficoReportes(data.reportes, tipo);
        break;
    }
  } catch {
    mostrarErrorGrafico(canvasId);
  }
}

/* ── Chart helpers ── */

function getTipoActivo(canvasId) {
  const selector = document.querySelector(`.chart-type-selector[data-target="${canvasId}"]`);
  if (!selector) return 'bar';
  const active = selector.querySelector('.chart-type-btn.active');
  return active ? active.dataset.type : 'bar';
}

function getDiasSemana(weekStr) {
  const r = semanaARango(weekStr);
  if (!r) return [];
  const inicio = new Date(r.fecha_inicio);
  const dias = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(inicio);
    d.setDate(inicio.getDate() + i);
    dias.push(d.toISOString().split('T')[0]);
  }
  return dias;
}

function hayDatos(data) {
  return Array.isArray(data) && data.length > 0;
}

function mostrarSinDatos(canvasId) {
  const card = document.getElementById('card' + canvasId.replace('chart', ''));
  if (!card) return;
  if (chartInstances[canvasId]) {
    chartInstances[canvasId].destroy();
    delete chartInstances[canvasId];
  }
  card.querySelector('.chart-container').classList.add('d-none');
  card.querySelector('.error-msg').classList.add('d-none');
  card.querySelector('.no-data').classList.remove('d-none');
}

function mostrarConDatos(canvasId) {
  const card = document.getElementById('card' + canvasId.replace('chart', ''));
  if (!card) return;
  card.querySelector('.chart-container').classList.remove('d-none');
  card.querySelector('.no-data').classList.add('d-none');
  card.querySelector('.error-msg').classList.add('d-none');
}

function mostrarErrorGrafico(canvasId) {
  const card = document.getElementById('card' + canvasId.replace('chart', ''));
  if (!card) return;
  if (chartInstances[canvasId]) {
    chartInstances[canvasId].destroy();
    delete chartInstances[canvasId];
  }
  card.querySelector('.chart-container').classList.add('d-none');
  card.querySelector('.no-data').classList.add('d-none');
  card.querySelector('.error-msg').classList.remove('d-none');
}

function crearOActualizarGrafico(canvasId, config) {
  if (chartInstances[canvasId]) {
    chartInstances[canvasId].destroy();
    delete chartInstances[canvasId];
  }
  mostrarConDatos(canvasId);
  const ctx = document.getElementById(canvasId).getContext('2d');
  chartInstances[canvasId] = new Chart(ctx, config);
}

/* ── 1. Permanencia ── */

function renderGraficoPermanencia(data, tipo) {
  if (!hayDatos(data)) {
    mostrarSinDatos('chartPermanencia');
    return;
  }

  const labels = data.map(d => {
    const dt = new Date(d.dia);
    return isNaN(dt.getTime()) ? d.dia : dt.toISOString().split('T')[0];
  });
  const valores = data.map(d => Number(d.promedio_minutos));

  crearOActualizarGrafico('chartPermanencia', {
    type: tipo === 'radar' ? 'radar' : tipo,
    data: {
      labels,
      datasets: [{
        label: 'Minutos promedio',
        data: valores,
        borderColor: COLORS[0],
        backgroundColor: tipo === 'line'
          ? COLORS[0] + '20'
          : tipo === 'radar'
            ? COLORS[0] + '60'
            : COLORS[0],
        borderWidth: 2,
        fill: tipo === 'line' || tipo === 'radar',
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: tipo !== 'radar' ? {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Minutos' }
        }
      } : {}
    }
  });
}

/* ── 2. Solicitudes por hora ── */

function renderGraficoSolicitudes(data, tipo) {
  if (!hayDatos(data)) {
    mostrarSinDatos('chartSolicitudes');
    return;
  }

  const mapa = {};
  for (let h = 6; h < 24; h++) mapa[h] = 0;
  data.forEach(d => { if (d.hora >= 6) mapa[d.hora] = Number(d.total); });
  const labels = Array.from({ length: 18 }, (_, i) => `${i + 6}:00`);
  const valores = Array.from({ length: 18 }, (_, i) => mapa[i + 6]);

  crearOActualizarGrafico('chartSolicitudes', {
    type: tipo === 'radar' ? 'radar' : tipo,
    data: {
      labels,
      datasets: [{
        label: 'Solicitudes',
        data: valores,
        borderColor: COLORS[1],
        backgroundColor: tipo === 'line'
          ? COLORS[1] + '20'
          : tipo === 'radar'
            ? COLORS[1] + '60'
            : COLORS[1],
        borderWidth: 2,
        fill: tipo === 'line' || tipo === 'radar',
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: tipo !== 'radar' ? {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Cantidad' }
        }
      } : {}
    }
  });
}

/* ── 3. Ocupación ── */

function getOcupacionMode() {
  const active = document.querySelector('.mode-btn.active');
  return active ? active.dataset.mode : 'dia';
}

function renderGraficoOcupacion(data, tipo) {
  const mode = getOcupacionMode();

  if (mode === 'dia') {
    const raw = data.por_hora || [];
    if (!hayDatos(raw)) {
      mostrarSinDatos('chartOcupacion');
      return;
    }
    const mapa = {};
    for (let h = 0; h < 24; h++) mapa[h] = 0;
    raw.forEach(d => { mapa[d.hora] = Number(d.ocupadas); });
    const labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const valores = Array.from({ length: 24 }, (_, i) => mapa[i]);

    crearOActualizarGrafico('chartOcupacion', {
      type: tipo === 'radar' ? 'radar' : tipo,
      data: {
        labels,
        datasets: [{
          label: 'Plazas ocupadas',
          data: valores,
          borderColor: COLORS[0],
          backgroundColor: tipo === 'line'
            ? COLORS[0] + '20'
            : tipo === 'radar'
              ? COLORS[0] + '60'
              : COLORS[0],
          borderWidth: 2,
          fill: tipo === 'line' || tipo === 'radar',
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: tipo !== 'radar' ? {
          y: { beginAtZero: true, title: { display: true, text: 'Plazas ocupadas' } }
        } : {}
      }
    });
    return;
  }

  const raw = data.por_dia || [];
  if (!hayDatos(raw)) {
    mostrarSinDatos('chartOcupacion');
    return;
  }

  const labels = mode === 'semana'
    ? getDiasSemana(document.getElementById('ocupacionSemana').value)
    : [...new Set(raw.map(d => {
        const dt = new Date(d.dia);
        return isNaN(dt.getTime()) ? d.dia : dt.toISOString().split('T')[0];
      }))].sort();

  const estacionamientos = [...new Set(raw.map(d => d.estacionamiento))];
  const datasets = estacionamientos.map((est, i) => ({
    label: est,
    data: labels.map(f => {
      const item = raw.find(d => {
        const dia = d.dia ? new Date(d.dia).toISOString().split('T')[0] : '';
        return dia === f && d.estacionamiento === est;
      });
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

  crearOActualizarGrafico('chartOcupacion', {
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
}

/* ── 4. Reportes ── */

function renderGraficoReportes(data, tipo) {
  if (!hayDatos(data.por_estado)) {
    mostrarSinDatos('chartReportes');
    return;
  }

  const labels = data.por_estado.map(d => d.estado);
  const valores = data.por_estado.map(d => Number(d.total));
  const colores = COLORS.slice(0, labels.length);

  const chartType = tipo === 'doughnut' ? 'doughnut' : tipo === 'polarArea' ? 'polarArea' : tipo;

  crearOActualizarGrafico('chartReportes', {
    type: chartType,
    data: {
      labels,
      datasets: [{
        label: 'Cantidad',
        data: valores,
        backgroundColor: colores,
        borderColor: colores,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: chartType !== 'bar',
          position: chartType === 'doughnut' || chartType === 'polarArea' ? 'right' : 'top'
        }
      },
      scales: chartType === 'bar' ? {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Cantidad' }
        }
      } : {}
    }
  });

  renderReportesTabla(data);
}

function renderReportesTabla(data) {
  const container = document.getElementById('reportesTabla');

  const rows = data.por_estado.map(d => `
    <tr>
      <td>${d.estado}</td>
      <td><strong>${d.total}</strong></td>
    </tr>
  `).join('');

  const tipos = (data.por_tipo || []).map(d => `
    <tr>
      <td>${d.tipo}</td>
      <td><strong>${d.total}</strong></td>
    </tr>
  `).join('');

  container.innerHTML = `
    <table>
      <thead>
        <tr><th>Estado</th><th>Cant</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    ${tipos ? `
    <table style="margin-top:8px">
      <thead>
        <tr><th>Tipo infracción</th><th>Cant</th></tr>
      </thead>
      <tbody>${tipos}</tbody>
    </table>` : ''}
  `;
}

/* ── Event handlers ── */

function onChangeChartType(e) {
  const btn = e.currentTarget;
  const selector = btn.closest('.chart-type-selector');
  if (!selector) return;

  selector.querySelectorAll('.chart-type-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const targetId = selector.dataset.target;
  const cache = chartDataCache[targetId];
  if (!cache) return;

  const tipo = btn.dataset.type;

  switch (targetId) {
    case 'chartPermanencia':
      renderGraficoPermanencia(cache.permanencia, tipo);
      break;
    case 'chartSolicitudes':
      renderGraficoSolicitudes(cache.solicitudes_por_hora, tipo);
      break;
    case 'chartOcupacion':
      renderGraficoOcupacion(cache.ocupacion, tipo);
      break;
    case 'chartReportes':
      renderGraficoReportes(cache.reportes, tipo);
      break;
  }
}

function onToggleOcupacionMode(e) {
  const btn = e.currentTarget;
  const parent = btn.closest('.chart-header');
  if (!parent) return;

  parent.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const mode = btn.dataset.mode;
  document.querySelectorAll('.ocupacion-input-group').forEach(g => {
    g.classList.toggle('d-none', g.dataset.mode !== mode);
  });

  cargarGrafico('chartOcupacion');
}

init();
