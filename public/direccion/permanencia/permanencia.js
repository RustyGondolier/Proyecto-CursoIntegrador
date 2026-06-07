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

  document.getElementById('welcomeText').textContent = 'Tiempo de Permanencia';

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
    renderGrafico(chartDataCache.permanencia, btn.dataset.type);
  }
}

function getTipoActivo() {
  const active = document.querySelector('.chart-type-btn.active');
  return active ? active.dataset.type : 'line';
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
    renderGrafico(data.permanencia, tipo);
  } catch {
    mostrarError();
  }
}

function mostrarSinDatos() {
  if (chartInstances['chartPermanencia']) {
    chartInstances['chartPermanencia'].destroy();
    delete chartInstances['chartPermanencia'];
  }
  document.querySelector('.chart-container').classList.add('d-none');
  document.querySelector('.error-msg').classList.add('d-none');
  document.querySelector('.no-data').classList.remove('d-none');
}

function mostrarError() {
  if (chartInstances['chartPermanencia']) {
    chartInstances['chartPermanencia'].destroy();
    delete chartInstances['chartPermanencia'];
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
  if (chartInstances['chartPermanencia']) {
    chartInstances['chartPermanencia'].destroy();
    delete chartInstances['chartPermanencia'];
  }
  mostrarConDatos();
  const ctx = document.getElementById('chartPermanencia').getContext('2d');
  chartInstances['chartPermanencia'] = new Chart(ctx, config);
}

function renderGrafico(data, tipo) {
  if (!hayDatos(data)) {
    mostrarSinDatos();
    renderTablaVacia();
    return;
  }

  const labels = data.map(d => {
    const dt = new Date(d.dia);
    return isNaN(dt.getTime()) ? d.dia : dt.toISOString().split('T')[0];
  });
  const valores = data.map(d => Number(d.promedio_minutos));

  crearOActualizarGrafico({
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
      plugins: { legend: { display: false } },
      scales: tipo !== 'radar' ? {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Minutos' }
        },
        x: {
          ticks: { maxTicksLimit: 15 }
        }
      } : {}
    }
  });

  renderTabla(data);
}

function renderTabla(data) {
  const valores = data.map(d => Number(d.promedio_minutos));
  const total = valores.reduce((a, b) => a + b, 0);
  const promedio = (total / valores.length).toFixed(1);
  const pico = Math.max(...valores).toFixed(1);
  const minimo = Math.min(...valores).toFixed(1);
  const dias = data.length;

  document.getElementById('tablaBody').innerHTML = `
    <table class="resumen-table">
      <tbody>
        <tr>
          <td class="resumen-label">Promedio general</td>
          <td class="resumen-value">${promedio} min</td>
        </tr>
        <tr>
          <td class="resumen-label">Pico máximo</td>
          <td class="resumen-value">${pico} min</td>
        </tr>
        <tr>
          <td class="resumen-label">Mínimo</td>
          <td class="resumen-value">${minimo} min</td>
        </tr>
        <tr>
          <td class="resumen-label">Días con datos</td>
          <td class="resumen-value">${dias}</td>
        </tr>
      </tbody>
    </table>
  `;
}

function renderTablaVacia() {
  document.getElementById('tablaBody').innerHTML = '<p class="empty-message">Sin datos para el período seleccionado.</p>';
}

init();
