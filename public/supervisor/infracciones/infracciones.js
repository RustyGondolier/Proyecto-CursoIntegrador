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
      '<table class="inf-table"><thead><tr>' +
        '<th>Código</th>' +
        '<th>Placa</th>' +
        '<th>Usuario</th>' +
        '<th>Tipo</th>' +
        '<th>Descripción</th>' +
        '<th>Fecha</th>' +
      '</tr></thead><tbody>' +
      data.map(function(i) {
        var fecha = formatDateInf(i.creado_en);
        return (
          '<tr>' +
            '<td><span class="inc-code">#INF-' + String(i.id).padStart(5, '0') + '</span></td>' +
            '<td><strong>' + escapeHtml(i.placa || '—') + '</strong></td>' +
            '<td>' + escapeHtml(i.usuario_nombre || '—') + '</td>' +
            '<td><span class="inf-tipo-badge">' + escapeHtml(i.tipo_descripcion) + '</span></td>' +
            '<td>' + escapeHtml((i.descripcion || '').substring(0, 60)) + '</td>' +
            '<td><span class="inf-fecha">' + fecha + '</span></td>' +
          '</tr>'
        );
      }).join('') +
      '</tbody></table>';
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

init();
