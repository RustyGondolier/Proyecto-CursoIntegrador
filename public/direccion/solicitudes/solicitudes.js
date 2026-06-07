const COLORS = ['#B50E30', '#2563EB', '#059669', '#D97706', '#7C3AED', '#DC2626', '#0891B2', '#65A30D'];
const chartInstances = {};
let chartDataCache = null;

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

  document.getElementById('welcomeText').textContent = 'Solicitudes de Estacionamiento';

  document.getElementById('fechaInicio').value = fmtFecha(hace30());
  document.getElementById('fechaFin').value = fmtFecha(hoy());

  document.querySelectorAll('.chart-type-btn').forEach(btn => {
    btn.addEventListener('click', onTipoChange);
  });
  document.querySelectorAll('.filter-input').forEach(el => {
    el.addEventListener('change', () => cargarGrafico());
  });

  await cargarGrafico();
}

function onTipoChange(e) {
  const btn = e.currentTarget;
  document.querySelectorAll('.chart-type-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  if (chartDataCache) {
    renderGrafico(chartDataCache.solicitudes_por_hora, btn.dataset.type);
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
  const fechaInicio = document.getElementById('fechaInicio').value;
  const fechaFin = document.getElementById('fechaFin').value;
  if (!fechaInicio || !fechaFin) return;

  try {
    const data = await obtenerDashboardDireccion({ fecha_inicio: fechaInicio, fecha_fin: fechaFin });
    chartDataCache = data;
    const tipo = getTipoActivo();
    renderGrafico(data.solicitudes_por_hora, tipo);
  } catch {
    mostrarError();
  }
}

function mostrarSinDatos() {
  if (chartInstances['chartSolicitudes']) {
    chartInstances['chartSolicitudes'].destroy();
    delete chartInstances['chartSolicitudes'];
  }
  document.querySelector('.chart-container').classList.add('d-none');
  document.querySelector('.error-msg').classList.add('d-none');
  document.querySelector('.no-data').classList.remove('d-none');
}

function mostrarError() {
  if (chartInstances['chartSolicitudes']) {
    chartInstances['chartSolicitudes'].destroy();
    delete chartInstances['chartSolicitudes'];
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
  if (chartInstances['chartSolicitudes']) {
    chartInstances['chartSolicitudes'].destroy();
    delete chartInstances['chartSolicitudes'];
  }
  mostrarConDatos();
  const ctx = document.getElementById('chartSolicitudes').getContext('2d');
  chartInstances['chartSolicitudes'] = new Chart(ctx, config);
}

function renderGrafico(data, tipo) {
  if (!hayDatos(data)) {
    mostrarSinDatos();
    renderTablaVacia();
    return;
  }

  const mapa = {};
  for (let h = 6; h < 24; h++) mapa[h] = 0;
  data.forEach(d => { if (d.hora >= 6) mapa[d.hora] = Number(d.total); });
  const labels = Array.from({ length: 18 }, (_, i) => `${i + 6}:00`);
  const valores = Array.from({ length: 18 }, (_, i) => mapa[i + 6]);

  crearOActualizarGrafico({
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
      plugins: { legend: { display: false } },
      scales: tipo !== 'radar' ? {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Cantidad' }
        }
      } : {}
    }
  });

  renderTabla(data);
}

function renderTabla(data) {
  const valores = data.map(d => Number(d.total));
  const total = valores.reduce((a, b) => a + b, 0);
  const promedio = (total / valores.length).toFixed(1);
  const pico = Math.max(...valores);
  const horaPicoObj = data.find(d => Number(d.total) === pico);
  const horaPico = horaPicoObj ? `${horaPicoObj.hora}:00` : '-';

  document.getElementById('tablaBody').innerHTML = `
    <table class="resumen-table">
      <tbody>
        <tr>
          <td class="resumen-label">Total solicitudes</td>
          <td class="resumen-value">${total}</td>
        </tr>
        <tr>
          <td class="resumen-label">Hora pico</td>
          <td class="resumen-value">${horaPico}</td>
        </tr>
        <tr>
          <td class="resumen-label">Solicitudes en hora pico</td>
          <td class="resumen-value">${pico}</td>
        </tr>
        <tr>
          <td class="resumen-label">Promedio por hora</td>
          <td class="resumen-value">${promedio}</td>
        </tr>
      </tbody>
    </table>
  `;
}

function renderTablaVacia() {
  document.getElementById('tablaBody').innerHTML = '<p class="empty-message">Sin datos para el período seleccionado.</p>';
}

init();
