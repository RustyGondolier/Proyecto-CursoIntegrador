/* =====================================================
   PERFIL DE USUARIO - Lógica frontend
   - Carga datos desde sesión (getSessionUser)
   - Datos extendidos (teléfono, correo, licencia, vehículos)
     se persisten en sessionStorage en esta preview.
   - Cuando exista /api/usuarios/me, reemplazar loadExtendedUser.
   ===================================================== */

const STORAGE_EXTENDED = 'perfil_extendido';
const STORAGE_VEHICLES = 'perfil_vehiculos';

const ROL_LABELS = {
  estudiante: 'Estudiante',
  docente: 'Docente',
  supervisor: 'Supervisor',
  administrador: 'Administrador',
  direccion: 'Dirección'
};

const TIPO_LABELS = {
  auto: 'Auto',
  moto: 'Moto',
  mototaxi: 'Mototaxi'
};

let activeVehicleId = null;

/* =====================================================
   INIT
   ===================================================== */
async function init() {
  if (!isAuthenticated()) {
    window.location.href = '/auth/login.html';
    return;
  }

  await loadLayout();
  loadSessionHeader();
  loadExtendedUser();
  loadVehicles();
  bindEvents();
}

function loadSessionHeader() {
  const user = getSessionUser();
  if (!user) return;

  document.getElementById('profileName').textContent = user.nombre || 'Usuario';
  document.getElementById('profileRole').textContent =
    ROL_LABELS[user.rol] || user.rol || '—';
  document.getElementById('profileCode').textContent =
    user.codigo_universitario ? `Código: ${user.codigo_universitario}` : '';
  document.getElementById('profileAvatar').textContent = getInitials(user.nombre);
}

function getInitials(nombre = '') {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0] || '')
    .join('')
    .toUpperCase() || '?';
}

/* =====================================================
   DATOS EXTENDIDOS (preview: sessionStorage)
   Reemplazar por GET /api/usuarios/me cuando exista.
   ===================================================== */
function loadExtendedUser() {
  const data = readExtended();
  const user = getSessionUser() || {};

  const telefono = data.telefono
    ? `${data.pais || '+51'} ${data.telefono}`
    : '—';

  setField('infoNombre', user.nombre || '—');
  setField('infoCorreo', data.correo || '—');
  setField('infoTelefono', telefono);
  setField('infoDni', data.dni || '—');

  setField('licenciaNumero', data.nro_licencia || '—');
  setLicenciaVence(data.licencia_fecha_vencimiento);
}

function setField(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = value;
  el.classList.toggle('empty', !value || value === '—');
}

function setLicenciaVence(fecha) {
  const el = document.getElementById('licenciaVence');
  if (!el) return;

  el.innerHTML = '';

  if (!fecha) {
    el.innerHTML = '<span class="empty">—</span>';
    return;
  }

  const d = new Date(fecha + 'T00:00:00');
  const formatted = d.toLocaleDateString('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric'
  });

  const status = getLicenciaStatus(d);

  el.innerHTML = `${formatted}<span class="licencia-status ${status.cls}">${status.label}</span>`;
}

function getLicenciaStatus(date) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((date - hoy) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { cls: 'expired', label: 'Vencida' };
  }
  if (diffDays <= 30) {
    return { cls: 'warn', label: `Por vencer (${diffDays}d)` };
  }
  return { cls: 'ok', label: 'Vigente' };
}

function readExtended() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_EXTENDED)) || {};
  } catch {
    return {};
  }
}

function writeExtended(data) {
  sessionStorage.setItem(STORAGE_EXTENDED, JSON.stringify(data));
}

/* =====================================================
   VEHÍCULOS (preview: sessionStorage)
   ===================================================== */
function loadVehicles() {
  const list = readVehicles();
  activeVehicleId = list.find(v => v.activo)?.id ?? null;

  renderActiveVehicle();
  renderVehiclesGrid();
}

function readVehicles() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_VEHICLES)) || [];
  } catch {
    return [];
  }
}

function writeVehicles(list) {
  sessionStorage.setItem(STORAGE_VEHICLES, JSON.stringify(list));
}

function renderActiveVehicle() {
  const box = document.getElementById('activeVehicleBox');
  if (!box) return;

  const list = readVehicles();
  const active = list.find(v => v.id === activeVehicleId);

  if (!active) {
    box.className = 'active-vehicle empty';
    box.innerHTML = '<p class="empty-state">No tienes un vehículo asignado. Agrega uno y márcalo como asignado.</p>';
    return;
  }

  box.className = 'active-vehicle';
  box.innerHTML = `
    <div class="vehicle-icon">${tipoLetra(active.tipo)}</div>
    <div class="active-vehicle-info">
      <p class="vehicle-plate">${active.placa}</p>
      <p class="vehicle-detail">${TIPO_LABELS[active.tipo] || active.tipo} · ${active.modelo || '—'}</p>
    </div>
    <span class="vehicle-badge">Asignado</span>
  `;
}

function renderVehiclesGrid() {
  const grid = document.getElementById('vehiclesGrid');
  if (!grid) return;

  const list = readVehicles();

  const cards = list.map(v => `
    <article class="vehicle-card ${v.id === activeVehicleId ? 'vehicle-card-active' : ''}" data-id="${v.id}">
      <div class="vehicle-card-head">
        <div class="vehicle-icon">${tipoLetra(v.tipo)}</div>
        <span class="vehicle-badge ${v.id === activeVehicleId ? '' : 'vehicle-badge-muted'}">
          ${v.id === activeVehicleId ? 'Asignado' : 'Inactivo'}
        </span>
      </div>
      <p class="vehicle-plate">${v.placa}</p>
      <p class="vehicle-detail">${TIPO_LABELS[v.tipo] || v.tipo} · ${v.modelo || '—'}</p>
      <div class="vehicle-actions">
        ${v.id !== activeVehicleId
          ? `<button class="btn btn-secondary btn-sm" data-action="assign">Asignar</button>`
          : ''}
        <button class="btn btn-secondary btn-sm" data-action="edit">Editar</button>
        <button class="btn btn-secondary btn-sm" data-action="delete">Eliminar</button>
      </div>
    </article>
  `).join('');

  grid.innerHTML = cards + `
    <button class="vehicle-card-add" id="addVehicleCard">
      <span class="add-icon">+</span>
      <p>Agregar vehículo</p>
    </button>
  `;
}

function tipoLetra(tipo) {
  if (tipo === 'moto' || tipo === 'mototaxi') return 'M';
  return 'A';
}

/* =====================================================
   EVENTOS
   ===================================================== */
function bindEvents() {
  // Editar perfil
  document.getElementById('editProfileBtn').addEventListener('click', openEditProfileModal);
  document.getElementById('editProfileForm').addEventListener('submit', saveProfile);

  // Licencia
  document.getElementById('editLicenciaBtn').addEventListener('click', openEditProfileModal);

  // Vehículos: agregar
  document.getElementById('addVehicleBtn').addEventListener('click', () => openVehicleModal(null));
  document.getElementById('vehicleForm').addEventListener('submit', saveVehicle);

  // Cambiar vehículo asignado
  document.getElementById('changeVehicleBtn').addEventListener('click', openChangeVehicleModal);

  // Grid de vehículos (delegación)
  document.getElementById('vehiclesGrid').addEventListener('click', handleVehicleGridClick);

  // Cerrar modales
  document.querySelectorAll('[data-close-modal]').forEach(el => {
    el.addEventListener('click', closeAllModals);
  });

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', () => {
    if (confirm('¿Cerrar sesión?')) logout();
  });

  // Esc cierra modales
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeAllModals();
  });
}

/* =====================================================
   MODALES
   ===================================================== */
function openModal(id) {
  const m = document.getElementById(id);
  if (m) {
    m.classList.add('open');
    m.setAttribute('aria-hidden', 'false');
  }
}

function closeAllModals() {
  document.querySelectorAll('.modal.open').forEach(m => {
    m.classList.remove('open');
    m.setAttribute('aria-hidden', 'true');
  });
}

/* ----- EDITAR PERFIL ----- */
function openEditProfileModal() {
  const user = getSessionUser() || {};
  const data = readExtended();

  document.getElementById('formNombre').value = user.nombre || '';
  document.getElementById('formCorreo').value = data.correo || '';
  document.getElementById('formPais').value = data.pais || '+51';
  document.getElementById('formTelefono').value = data.telefono || '';
  document.getElementById('formDni').value = data.dni || '';
  document.getElementById('formLicencia').value = data.nro_licencia || '';
  document.getElementById('formLicenciaVence').value = data.licencia_fecha_vencimiento || '';

  openModal('editProfileModal');
}

function saveProfile(e) {
  e.preventDefault();

  const user = getSessionUser() || {};
  const newName = document.getElementById('formNombre').value.trim();

  const data = {
    correo: document.getElementById('formCorreo').value.trim() || null,
    pais: document.getElementById('formPais').value,
    telefono: document.getElementById('formTelefono').value.trim() || null,
    dni: document.getElementById('formDni').value.trim() || null,
    nro_licencia: document.getElementById('formLicencia').value.trim() || null,
    licencia_fecha_vencimiento: document.getElementById('formLicenciaVence').value || null
  };

  writeExtended(data);

  // Actualizar nombre en sesión si cambió
  if (newName && newName !== user.nombre) {
    user.nombre = newName;
    localStorage.setItem('usuario', JSON.stringify(user));
  }

  loadSessionHeader();
  loadExtendedUser();
  closeAllModals();
}

/* ----- VEHÍCULOS ----- */
function openVehicleModal(id) {
  const form = document.getElementById('vehicleForm');
  form.reset();
  document.getElementById('vehicleId').value = '';

  if (id) {
    const v = readVehicles().find(x => x.id === id);
    if (!v) return;
    document.getElementById('vehicleModalTitle').textContent = 'Editar vehículo';
    document.getElementById('vehicleId').value = v.id;
    document.getElementById('formPlaca').value = v.placa;
    document.getElementById('formTipo').value = v.tipo;
    document.getElementById('formModelo').value = v.modelo || '';
  } else {
    document.getElementById('vehicleModalTitle').textContent = 'Agregar vehículo';
  }

  openModal('vehicleModal');
}

function saveVehicle(e) {
  e.preventDefault();

  const id = document.getElementById('vehicleId').value;
  const data = {
    placa: document.getElementById('formPlaca').value.trim().toUpperCase(),
    tipo: document.getElementById('formTipo').value,
    modelo: document.getElementById('formModelo').value.trim()
  };

  const list = readVehicles();

  if (id) {
    const idx = list.findIndex(v => v.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...data };
    }
  } else {
    list.push({
      id: crypto.randomUUID(),
      ...data,
      activo: false
    });
  }

  writeVehicles(list);
  loadVehicles();
  closeAllModals();
}

function handleVehicleGridClick(e) {
  const card = e.target.closest('.vehicle-card');
  const addCard = e.target.closest('#addVehicleCard');
  if (addCard) {
    openVehicleModal(null);
    return;
  }
  if (!card) return;

  const id = card.dataset.id;
  const action = e.target.dataset.action;

  if (action === 'edit') openVehicleModal(id);
  if (action === 'delete') {
    if (!confirm('¿Eliminar este vehículo?')) return;
    const list = readVehicles().filter(v => v.id !== id);
    if (id === activeVehicleId) activeVehicleId = null;
    writeVehicles(list);
    loadVehicles();
  }
  if (action === 'assign') {
    setActiveVehicle(id);
  }
}

function setActiveVehicle(id) {
  const list = readVehicles();
  list.forEach(v => v.activo = v.id === id);
  activeVehicleId = id;
  writeVehicles(list);
  loadVehicles();
}

/* ----- CAMBIAR VEHÍCULO ASIGNADO ----- */
function openChangeVehicleModal() {
  const list = readVehicles();
  const container = document.getElementById('changeVehicleList');

  if (list.length === 0) {
    container.innerHTML = '<p class="empty-state">Aún no tienes vehículos. Agrega uno primero.</p>';
  } else {
    container.innerHTML = list.map(v => `
      <label class="change-vehicle-item ${v.id === activeVehicleId ? 'selected' : ''}">
        <input type="radio" name="activeVehicle" value="${v.id}" ${v.id === activeVehicleId ? 'checked' : ''}>
        <div class="vehicle-icon">${tipoLetra(v.tipo)}</div>
        <div class="vehicle-info">
          <p class="vehicle-plate">${v.placa}</p>
          <p class="vehicle-detail">${TIPO_LABELS[v.tipo] || v.tipo} · ${v.modelo || '—'}</p>
        </div>
      </label>
    `).join('');
  }

  openModal('changeVehicleModal');

  container.querySelectorAll('input[name="activeVehicle"]').forEach(radio => {
    radio.addEventListener('change', e => {
      setActiveVehicle(e.target.value);
      setTimeout(closeAllModals, 200);
    });
  });
}

init();
