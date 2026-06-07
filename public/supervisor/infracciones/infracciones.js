var tiposInfraccion = [];
var ultimaBusqueda = null;

async function init() {
  if (!isAuthenticated()) {
    window.location.href = '/auth/login.html';
    return;
  }

  await loadLayout();
  bindSearch();
  bindForm();
  bindCancel();
  await cargarTipos();
  await cargarMisInfracciones();
}

/* CARGAR TIPOS */

async function cargarTipos() {
  try {
    tiposInfraccion = await obtenerTiposInfraccion();
    var select = document.getElementById('tipoSelect');
    select.innerHTML = '<option value="">Selecciona el tipo</option>' +
      tiposInfraccion.map(function(t) {
        return '<option value="' + t.id + '">' + escapeHtml(t.descripcion) + '</option>';
      }).join('');
  } catch {
    showError('No se pudieron cargar los tipos de infracción.');
  }
}

/* BUSCAR */

function bindSearch() {
  document.getElementById('buscarBtn').addEventListener('click', buscarVehiculo);
  document.getElementById('placaInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') buscarVehiculo();
  });
}

async function buscarVehiculo() {
  var placa = document.getElementById('placaInput').value.trim();
  var errorBox = document.getElementById('searchError');
  errorBox.style.display = 'none';

  if (!placa) {
    errorBox.textContent = 'Ingresa una placa para buscar.';
    errorBox.style.display = 'block';
    return;
  }

  var btn = document.getElementById('buscarBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="inf-loading"></span> Buscando...';

  try {
    var response = await apiFetch('/api/supervisor/buscar?placa=' + encodeURIComponent(placa));

    if (response.status === 404) {
      errorBox.textContent = 'Vehículo no encontrado. La placa no está registrada en el sistema.';
      errorBox.style.display = 'block';
      document.getElementById('resultCard').style.display = 'none';
      ultimaBusqueda = null;
      return;
    }

    if (!response.ok) {
      var err = await response.json();
      throw new Error(err.error || 'Error al buscar');
    }

    var data = await response.json();
    ultimaBusqueda = data;

    document.getElementById('resultNombre').textContent = data.usuario_nombre || '—';
    document.getElementById('resultCodigo').textContent = data.codigo_universitario || '—';
    document.getElementById('resultPlaca').textContent = data.placa || '—';
    document.getElementById('resultModelo').textContent = data.tipo_vehiculo || '—';
    document.getElementById('resultRol').textContent = data.rol || '—';
    document.getElementById('resultCard').style.display = 'block';
    document.getElementById('formError').style.display = 'none';
    document.getElementById('tipoSelect').value = '';
    document.getElementById('descripcionInput').value = '';

    document.getElementById('resultCard').scrollIntoView({ behavior: 'smooth', block: 'start' });

  } catch (e) {
    errorBox.textContent = e.message || 'Error al buscar el vehículo.';
    errorBox.style.display = 'block';
    document.getElementById('resultCard').style.display = 'none';
    ultimaBusqueda = null;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Buscar';
  }
}

/* FORMULARIO */

function bindForm() {
  document.getElementById('registrarBtn').addEventListener('click', handleRegistrar);
}

function bindCancel() {
  document.getElementById('cancelarBtn').addEventListener('click', function() {
    document.getElementById('resultCard').style.display = 'none';
    document.getElementById('placaInput').value = '';
    document.getElementById('placaInput').focus();
    ultimaBusqueda = null;
  });
}

async function handleRegistrar() {
  var tipoId = document.getElementById('tipoSelect').value;
  var errorBox = document.getElementById('formError');
  errorBox.style.display = 'none';

  if (!ultimaBusqueda) {
    errorBox.textContent = 'Debes buscar un vehículo primero.';
    errorBox.style.display = 'block';
    return;
  }

  if (!tipoId) {
    errorBox.textContent = 'Selecciona el tipo de infracción.';
    errorBox.style.display = 'block';
    return;
  }

  var descripcion = document.getElementById('descripcionInput').value.trim();

  var btn = document.getElementById('registrarBtn');
  btn.disabled = true;
  btn.textContent = 'Registrando...';

  try {
    await registrarInfraccion({
      placa: ultimaBusqueda.placa,
      tipo_infraccion_id: Number(tipoId),
      descripcion: descripcion || null
    });

    showToast('Infracción registrada exitosamente');
    await cargarMisInfracciones();

    document.getElementById('resultCard').style.display = 'none';
    document.getElementById('placaInput').value = '';
    document.getElementById('placaInput').focus();
    ultimaBusqueda = null;

  } catch (e) {
    errorBox.textContent = e.message || 'Error al registrar la infracción.';
    errorBox.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Registrar infracción';
  }
}

/* MIS INFRACCIONES */

async function cargarMisInfracciones() {
  var list = document.getElementById('infList');
  var count = document.getElementById('infCount');

  try {
    var data = await listarMisInfracciones();
    count.textContent = data.length;

    if (data.length === 0) {
      list.innerHTML = '<p class="empty-state">Aún no has registrado ninguna infracción.</p>';
      return;
    }

    list.innerHTML =
      '<div class="inf-list-items">' +
        '<div class="inf-row inf-header-row">' +
          '<span class="inf-col col-code">Código</span>' +
          '<span class="inf-col col-placa">Placa</span>' +
          '<span class="inf-col col-user">Usuario</span>' +
          '<span class="inf-col col-tipo">Tipo</span>' +
          '<span class="inf-col col-desc">Descripción</span>' +
          '<span class="inf-col col-fecha">Fecha</span>' +
        '</div>' +
        data.map(function(i) {
          var fecha = formatDateInf(i.creado_en);
          return (
            '<div class="inf-row" data-id="' + i.id + '">' +
              '<span class="inf-col col-code"><span class="inf-code">#INF-' + String(i.id).padStart(5, '0') + '</span></span>' +
              '<span class="inf-col col-placa"><strong>' + escapeHtml(i.placa || '—') + '</strong></span>' +
              '<span class="inf-col col-user">' + escapeHtml(i.usuario_nombre || '—') + '</span>' +
              '<span class="inf-col col-tipo"><span class="inf-tipo-badge">' + escapeHtml(i.tipo_descripcion) + '</span></span>' +
              '<span class="inf-col col-desc">' + escapeHtml((i.descripcion || '').substring(0, 60)) + '</span>' +
              '<span class="inf-col col-fecha">' + fecha + '</span>' +
            '</div>'
          );
        }).join('') +
      '</div>';
  } catch {
    list.innerHTML = '<p class="empty-state">Error al cargar infracciones.</p>';
  }
}

function formatDateInf(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/* TOAST */

function showToast(msg) {
  var toast = document.getElementById('successToast');
  toast.textContent = msg;
  toast.style.display = 'block';
  setTimeout(function() { toast.style.display = 'none'; }, 4000);
}

function showError(msg) {
  var toast = document.getElementById('errorToast');
  toast.textContent = msg;
  toast.style.display = 'block';
  setTimeout(function() { toast.style.display = 'none'; }, 4000);
}

/* UTILIDADES */

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* MODAL DETALLE */

function bindDetalle() {
  document.addEventListener('click', function(e) {
    var row = e.target.closest('.inf-row:not(.inf-header-row)');
    if (!row) return;
    var id = Number(row.dataset.id);
    if (id) abrirDetalle(id);
  });

  document.querySelectorAll('[data-close-modal]').forEach(function(el) {
    el.addEventListener('click', function() {
      document.getElementById('detailModal').classList.remove('open');
    });
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      document.getElementById('detailModal').classList.remove('open');
    }
  });
}

async function abrirDetalle(id) {
  var body = document.getElementById('detailBody');
  body.innerHTML = '<p class="empty-state">Cargando detalle...</p>';
  document.getElementById('detailModal').classList.add('open');

  try {
    var r = await obtenerInfraccionPorId(id);
    renderDetalle(r);
  } catch {
    body.innerHTML = '<p class="empty-state" style="color:var(--color-primary)">Error al cargar el detalle.</p>';
  }
}

function renderDetalle(r) {
  var body = document.getElementById('detailBody');
  var fecha = r.creado_en
    ? new Date(r.creado_en).toLocaleString('es-PE', {
        year: 'numeric', month: 'long', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      })
    : '—';

  body.innerHTML =
    '<div class="detail-head">' +
      '<span class="detail-code">#INF-' + String(r.id).padStart(5, '0') + '</span>' +
      '<span class="inf-tipo-badge">' + escapeHtml(r.tipo_descripcion) + '</span>' +
    '</div>' +

    '<div class="detail-card">' +
      '<h3>Información de la infracción</h3>' +
      '<div class="detail-grid-2col">' +
        '<div class="detail-section">' +
          '<span class="detail-label">Placa</span>' +
          '<span class="detail-value"><strong>' + escapeHtml(r.placa || '—') + '</strong></span>' +
        '</div>' +
        '<div class="detail-section">' +
          '<span class="detail-label">Modelo</span>' +
          '<span class="detail-value">' + escapeHtml(r.modelo || '—') + '</span>' +
        '</div>' +
        '<div class="detail-section">' +
          '<span class="detail-label">Propietario</span>' +
          '<span class="detail-value">' + escapeHtml(r.usuario_nombre || '—') + '</span>' +
        '</div>' +
        '<div class="detail-section">' +
          '<span class="detail-label">Código</span>' +
          '<span class="detail-value">' + escapeHtml(r.usuario_codigo || '—') + '</span>' +
        '</div>' +
        '<div class="detail-section">' +
          '<span class="detail-label">Supervisor</span>' +
          '<span class="detail-value">' + escapeHtml(r.supervisor_nombre || '—') + '</span>' +
        '</div>' +
        '<div class="detail-section">' +
          '<span class="detail-label">Fecha</span>' +
          '<span class="detail-value">' + fecha + '</span>' +
        '</div>' +
        (r.plaza_codigo ? (
          '<div class="detail-section">' +
            '<span class="detail-label">Plaza asociada</span>' +
            '<span class="detail-value">' + escapeHtml(r.plaza_codigo) + '</span>' +
          '</div>'
        ) : '') +
      '</div>' +
    '</div>' +

    (r.descripcion ? (
      '<div class="detail-section" style="margin-bottom:6px">' +
        '<span class="detail-label">Descripción</span>' +
      '</div>' +
      '<div class="detail-desc">' + escapeHtml(r.descripcion) + '</div>'
    ) : '');
}

bindDetalle();
init();
