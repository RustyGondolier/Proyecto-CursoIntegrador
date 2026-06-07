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

  document.getElementById('welcomeText').textContent = 'Reportes de Incidencias';

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
    renderGrafico(chartDataCache.reportes, btn.dataset.type);
  }
}

function getTipoActivo() {
  const active = document.querySelector('.chart-type-btn.active');
  return active ? active.dataset.type : 'doughnut';
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
    renderGrafico(data.reportes, tipo);
  } catch {
    mostrarError();
  }
}

function mostrarSinDatos() {
  if (chartInstances['chartReportes']) {
    chartInstances['chartReportes'].destroy();
    delete chartInstances['chartReportes'];
  }
  document.querySelector('.chart-container').classList.add('d-none');
  document.querySelector('.error-msg').classList.add('d-none');
  document.querySelector('.no-data').classList.remove('d-none');
}

function mostrarError() {
  if (chartInstances['chartReportes']) {
    chartInstances['chartReportes'].destroy();
    delete chartInstances['chartReportes'];
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
  if (chartInstances['chartReportes']) {
    chartInstances['chartReportes'].destroy();
    delete chartInstances['chartReportes'];
  }
  mostrarConDatos();
  const ctx = document.getElementById('chartReportes').getContext('2d');
  chartInstances['chartReportes'] = new Chart(ctx, config);
}

function renderGrafico(data, tipo) {
  if (!hayDatos(data.por_estado)) {
    mostrarSinDatos();
    renderTablaVacia();
    return;
  }

  const labels = data.por_estado.map(d => d.estado);
  const valores = data.por_estado.map(d => Number(d.total));
  const colores = COLORS.slice(0, labels.length);

  const chartType = tipo === 'doughnut' ? 'doughnut' : tipo === 'polarArea' ? 'polarArea' : tipo;

  crearOActualizarGrafico({
    type: chartType,
    data: {
      labels,
      datasets: [{
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

  renderTabla(data);
}

function renderTabla(data) {
  const totalEstado = data.por_estado.reduce((a, d) => a + Number(d.total), 0);
  const totalTipo = (data.por_tipo || []).reduce((a, d) => a + Number(d.total), 0);

  document.getElementById('tablaBody').innerHTML = `
    <div class="table-section">
      <h3 class="table-title">Reportes por estado</h3>
      <table class="resumen-table">
        <thead>
          <tr>
            <th>Estado</th>
            <th>Cantidad</th>
          </tr>
        </thead>
        <tbody>
          ${data.por_estado.map(d => `
            <tr>
              <td>${d.estado}</td>
              <td class="td-num">${d.total}</td>
            </tr>
          `).join('')}
          <tr class="resumen-total">
            <td><strong>Total</strong></td>
            <td class="td-num"><strong>${totalEstado}</strong></td>
          </tr>
        </tbody>
      </table>
    </div>

    ${(data.por_tipo || []).length > 0 ? `
    <div class="table-section">
      <h3 class="table-title">Infracciones por tipo</h3>
      <table class="resumen-table">
        <thead>
          <tr>
            <th>Tipo de infracción</th>
            <th>Cantidad</th>
          </tr>
        </thead>
        <tbody>
          ${data.por_tipo.map(d => `
            <tr>
              <td>${d.tipo}</td>
              <td class="td-num">${d.total}</td>
            </tr>
          `).join('')}
          <tr class="resumen-total">
            <td><strong>Total</strong></td>
            <td class="td-num"><strong>${totalTipo}</strong></td>
          </tr>
        </tbody>
      </table>
    </div>
    ` : ''}
  `;
}

function renderTablaVacia() {
  document.getElementById('tablaBody').innerHTML = '<p class="empty-message">Sin datos para el período seleccionado.</p>';
}

init();
