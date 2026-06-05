/* =====================================================
   PERFIL DE USUARIO
   API: /api/usuarios/me (perfil) y /api/usuarios/me/vehiculos
   Cache en localStorage con clave 'perfil' para consistencia.
   ===================================================== */

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

const PERFIL_CACHE_KEY = 'perfil';

/* =====================================================
   INIT
   ===================================================== */
async function init() {
  if (!isAuthenticated()) {
    window.location.href = '/auth/login.html';
    return;
  }

  await loadLayout();
  await loadProfile();
  bindEvents();
}

/* =====================================================
   PERFIL — carga con fallback: API → localStorage → sesión
   ===================================================== */
async function loadProfile() {
  try {
    const res = await apiFetch('/api/usuarios/me');
    if (!res.ok) throw new Error('Error al cargar perfil');

    const perfil = await res.json();
    localStorage.setItem(PERFIL_CACHE_KEY, JSON.stringify(perfil));
    renderProfile(perfil);
    return;
  } catch {
    // Fallback 1: cache en localStorage
    const raw = localStorage.getItem(PERFIL_CACHE_KEY);
    if (raw) {
      try {
        renderProfile(JSON.parse(raw));
        return;
      } catch { /* ignorar parse inválido */ }
    }

    // Fallback 2: datos mínimos de sesión
    const user = getSessionUser();
    if (user) renderProfile({ nombre: user.nombre, codigo_universitario: user.codigo_universitario, rol: user.rol });
  }
}

function renderProfile(p) {
  document.getElementById('profileName').textContent = p.nombre || 'Usuario';
  document.getElementById('profileRole').textContent = ROL_LABELS[p.rol] || p.rol || '—';
  document.getElementById('profileCode').textContent = p.codigo_universitario ? `Código: ${p.codigo_universitario}` : '';
  document.getElementById('profileAvatar').textContent = getInitials(p.nombre);

  setField('infoVerificado', null, renderVerificacion(p));
  setField('infoNombre', p.nombre || '—');
  setField('infoCorreo', p.correo_institucional || '—');
  setField('infoTelefono', p.telefono || '—');
  setField('infoDni', p.dni || '—');

  setField('licenciaNumero', p.nro_licencia || '—');
  renderLicenciaVence(p.licencia_fecha_vencimiento);

  renderVehicles(p.vehiculos || []);
}

function renderVerificacion(p) {
  const el = document.createElement('span');

  if (p.verificado) {
    el.className = 'verificacion-badge ok';
    el.textContent = 'Verificado';
  } else {
    el.className = 'verificacion-badge fail';
    el.textContent = p.requiere_reverificacion ? 'Requiere verificación' : 'No verificado';
  }

  return el;
}

function renderLicenciaVence(fecha) {
  const el = document.getElementById('licenciaVence');
  if (!el) return;

  el.innerHTML = '';

  if (!fecha) {
    el.innerHTML = '<span class="empty">—</span>';
    return;
  }

  const dateStr = fecha.includes('T') ? fecha.split('T')[0] : fecha;
  const d = new Date(dateStr + 'T00:00:00');

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

  if (diffDays < 0) return { cls: 'expired', label: 'Vencida' };
  if (diffDays <= 30) return { cls: 'warn', label: `Por vencer (${diffDays}d)` };
  return { cls: 'ok', label: 'Vigente' };
}

function getInitials(nombre) {
  return (nombre || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0] || '')
    .join('')
    .toUpperCase() || '?';
}

function setField(id, value, node) {
  const el = document.getElementById(id);
  if (!el) return;

  if (node) {
    el.innerHTML = '';
    el.appendChild(node);
    return;
  }

  el.textContent = value;
  el.classList.toggle('empty', !value || value === '—');
}

/* =====================================================
   VEHÍCULOS
   ===================================================== */
function renderVehicles(list) {
  if (!list) list = [];

  renderActiveVehicle(list);
  renderVehiclesGrid(list);
}

function renderActiveVehicle(list) {
  const box = document.getElementById('activeVehicleBox');
  if (!box) return;

  const active = list.find(v => v.activo);

  if (!active) {
    box.className = 'active-vehicle empty';
    box.innerHTML = '<p class="empty-state">No tienes un vehículo asignado.</p>';
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

function renderVehiclesGrid(list) {
  const grid = document.getElementById('vehiclesGrid');
  if (!grid) return;

  const activeId = list.find(v => v.activo)?.id;

  const cards = list.map(v => `
    <article class="vehicle-card ${v.id === activeId ? 'vehicle-card-active' : ''}" data-id="${v.id}">
      <div class="vehicle-card-head">
        <div class="vehicle-icon">${tipoLetra(v.tipo)}</div>
        <span class="vehicle-badge ${v.id === activeId ? '' : 'vehicle-badge-muted'}">
          ${v.id === activeId ? 'Asignado' : 'Inactivo'}
        </span>
      </div>
      <p class="vehicle-plate">${v.placa}</p>
      <p class="vehicle-detail">${TIPO_LABELS[v.tipo] || v.tipo} · ${v.modelo || '—'}</p>
      <div class="vehicle-actions">
        ${v.id !== activeId
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
  document.getElementById('editProfileBtn').addEventListener('click', openEditProfileModal);
  document.getElementById('editProfileForm').addEventListener('submit', saveProfile);

  document.getElementById('editLicenciaBtn').addEventListener('click', openEditProfileModal);

  document.getElementById('addVehicleBtn').addEventListener('click', () => openVehicleModal(null));
  document.getElementById('vehicleForm').addEventListener('submit', saveVehicle);

  document.getElementById('changeVehicleBtn').addEventListener('click', openChangeVehicleModal);

  document.getElementById('vehiclesGrid').addEventListener('click', handleVehicleGridClick);

  document.querySelectorAll('[data-close-modal]').forEach(el => {
    el.addEventListener('click', closeAllModals);
  });

  document.getElementById('passwordBtn').addEventListener('click', openPasswordModal);
  document.getElementById('passwordForm').addEventListener('submit', savePassword);

  document.getElementById('logoutBtn').addEventListener('click', () => {
    if (confirm('¿Cerrar sesión?')) logout();
  });

  // Toggle visibilidad de contraseñas
  document.querySelectorAll('.toggle-pw').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      if (!input) return;
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      btn.textContent = isPassword ? '🙈' : '👁';
    });
  });

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
async function openEditProfileModal() {
  let p = {};

  try {
    const res = await apiFetch('/api/usuarios/me');
    if (res.ok) p = await res.json();
  } catch {
    // fallback a cache local
    const raw = localStorage.getItem(PERFIL_CACHE_KEY);
    if (raw) try { p = JSON.parse(raw); } catch { /* ignorar */ }
  }

  document.getElementById('formNombre').value = p.nombre || '';
  document.getElementById('formCorreo').value = p.correo_institucional || '';
  document.getElementById('formTelefono').value = p.telefono || '';
  document.getElementById('formDni').value = p.dni || '';
  document.getElementById('formLicencia').value = p.nro_licencia || '';
  document.getElementById('formLicenciaVence').value = p.licencia_fecha_vencimiento || '';

  openModal('editProfileModal');
}

async function saveProfile(e) {
  e.preventDefault();

  const body = {
    nombre: document.getElementById('formNombre').value.trim() || undefined,
    correo_institucional: document.getElementById('formCorreo').value.trim() || undefined,
    telefono: document.getElementById('formTelefono').value.trim() || undefined,
    dni: document.getElementById('formDni').value.trim() || undefined,
    nro_licencia: document.getElementById('formLicencia').value.trim() || undefined,
    licencia_fecha_vencimiento: document.getElementById('formLicenciaVence').value || undefined
  };

  try {
    const res = await apiFetch('/api/usuarios/me', {
      method: 'PUT',
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.error || 'Error al guardar');
      return;
    }

    // Actualizar nombre en sesión para que sidebar lo refleje
    if (body.nombre) {
      const user = getSessionUser();
      if (user) {
        user.nombre = body.nombre;
        localStorage.setItem('usuario', JSON.stringify(user));
      }
    }

    closeAllModals();
    loadProfile();
  } catch {
    alert('Error de conexión al guardar el perfil');
  }
}

/* ----- VEHÍCULOS ----- */
function openVehicleModal(id) {
  const form = document.getElementById('vehicleForm');
  form.reset();
  document.getElementById('vehicleId').value = '';

  if (id) {
    const v = document.querySelector(`.vehicle-card[data-id="${id}"]`);
    const plate = v?.querySelector('.vehicle-plate')?.textContent || '';
    const detail = v?.querySelector('.vehicle-detail')?.textContent || '';

    document.getElementById('vehicleModalTitle').textContent = 'Editar vehículo';
    document.getElementById('vehicleId').value = id;
    document.getElementById('formPlaca').value = plate;

    // Inferir tipo desde el texto del detalle
    const tipo = Object.entries(TIPO_LABELS).find(([, label]) => detail.startsWith(label))?.[0] || 'auto';
    document.getElementById('formTipo').value = tipo;

    const modelo = detail.replace(/^(Auto|Moto|Mototaxi) · /, '');
    document.getElementById('formModelo').value = modelo;
  } else {
    document.getElementById('vehicleModalTitle').textContent = 'Agregar vehículo';
  }

  openModal('vehicleModal');
}

async function saveVehicle(e) {
  e.preventDefault();

  const id = document.getElementById('vehicleId').value;
  const body = {
    placa: document.getElementById('formPlaca').value.trim().toUpperCase(),
    tipo_vehiculo_id: document.getElementById('formTipo').value,
    modelo: document.getElementById('formModelo').value.trim()
  };

  try {
    const url = '/api/usuarios/me/vehiculos' + (id ? `/${id}` : '');
    const method = id ? 'PUT' : 'POST';

    const res = await apiFetch(url, {
      method,
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.error || 'Error al guardar vehículo');
      return;
    }

    closeAllModals();
    loadProfile();
  } catch {
    alert('Error de conexión');
  }
}

async function handleVehicleGridClick(e) {
  const card = e.target.closest('.vehicle-card');
  const addCard = e.target.closest('#addVehicleCard');
  if (addCard) { openVehicleModal(null); return; }
  if (!card) return;

  const id = card.dataset.id;
  const action = e.target.dataset.action;

  if (action === 'edit') openVehicleModal(id);
  if (action === 'delete') {
    if (!confirm('¿Eliminar este vehículo?')) return;

    try {
      const res = await apiFetch(`/api/usuarios/me/vehiculos/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Error al eliminar');
        return;
      }
      loadProfile();
    } catch {
      alert('Error de conexión');
    }
  }
  if (action === 'assign') {
    try {
      const res = await apiFetch(`/api/usuarios/me/vehiculos/${id}/activar`, { method: 'PATCH' });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Error al asignar');
        return;
      }
      loadProfile();
    } catch {
      alert('Error de conexión');
    }
  }
}

/* ----- CAMBIAR VEHÍCULO ASIGNADO ----- */
async function openChangeVehicleModal() {
  let list = [];

  try {
    const res = await apiFetch('/api/usuarios/me/vehiculos');
    if (res.ok) list = await res.json();
  } catch {
    // fallback a cache local
    const raw = localStorage.getItem(PERFIL_CACHE_KEY);
    if (raw) try { list = JSON.parse(raw).vehiculos || []; } catch { /* ignorar */ }
  }

  const container = document.getElementById('changeVehicleList');
  const activeId = list.find(v => v.activo)?.id;

  if (list.length === 0) {
    container.innerHTML = '<p class="empty-state">Aún no tienes vehículos. Agrega uno primero.</p>';
  } else {
    container.innerHTML = list.map(v => `
      <label class="change-vehicle-item ${v.id === activeId ? 'selected' : ''}">
        <input type="radio" name="activeVehicle" value="${v.id}" ${v.id === activeId ? 'checked' : ''}>
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
    radio.addEventListener('change', async e => {
      try {
        const res = await apiFetch(`/api/usuarios/me/vehiculos/${e.target.value}/activar`, { method: 'PATCH' });
        if (!res.ok) return;
        setTimeout(closeAllModals, 200);
        loadProfile();
      } catch { /* ignore */ }
    });
  });
}

/* ----- CONTRASEÑA ----- */
function openPasswordModal() {
  document.getElementById('passwordForm').reset();
  document.getElementById('passwordError').style.display = 'none';
  openModal('passwordModal');
}

async function savePassword(e) {
  e.preventDefault();

  const errorEl = document.getElementById('passwordError');
  errorEl.style.display = 'none';

  const actual = document.getElementById('formActual').value;
  const nueva = document.getElementById('formNueva').value;
  const confirmar = document.getElementById('formConfirmar').value;

  if (nueva !== confirmar) {
    errorEl.textContent = 'La nueva contraseña y la confirmación no coinciden';
    errorEl.style.display = 'block';
    return;
  }

  if (nueva.length < 6) {
    errorEl.textContent = 'La contraseña debe tener al menos 6 caracteres';
    errorEl.style.display = 'block';
    return;
  }

  try {
    const res = await apiFetch('/api/usuarios/me/password', {
      method: 'PUT',
      body: JSON.stringify({ actual, nueva, confirmar })
    });

    if (!res.ok) {
      const err = await res.json();
      errorEl.textContent = err.error || 'Error al cambiar contraseña';
      errorEl.style.display = 'block';
      return;
    }

    closeAllModals();
    alert('Contraseña actualizada correctamente');
  } catch {
    errorEl.textContent = 'Error de conexión';
    errorEl.style.display = 'block';
  }
}

init();
