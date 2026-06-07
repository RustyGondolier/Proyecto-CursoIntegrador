async function obtenerDashboardAdmin() {
  const response = await apiFetch('/api/administrador/dashboard');
  if (!response.ok) throw new Error('Error al cargar dashboard');
  return response.json();
}

async function listarPendientes() {
  const response = await apiFetch('/api/administrador/usuarios/pendientes');
  if (!response.ok) throw new Error('Error al cargar pendientes');
  return response.json();
}

async function listarUsuarios(params) {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  const response = await apiFetch('/api/administrador/usuarios' + qs);
  if (!response.ok) throw new Error('Error al cargar usuarios');
  return response.json();
}

async function obtenerUsuario(id) {
  const response = await apiFetch('/api/administrador/usuarios/' + id);
  if (!response.ok) throw new Error('Error al obtener usuario');
  return response.json();
}

async function aprobarUsuario(id) {
  const response = await apiFetch('/api/administrador/usuarios/' + id + '/aprobar', {
    method: 'PUT'
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Error al aprobar usuario');
  }
  return response.json();
}

async function suspenderUsuario(id, motivo) {
  const response = await apiFetch('/api/administrador/usuarios/' + id + '/suspender', {
    method: 'PUT',
    body: JSON.stringify({ motivo })
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Error al suspender usuario');
  }
  return response.json();
}

async function reactivarUsuario(id) {
  const response = await apiFetch('/api/administrador/usuarios/' + id + '/reactivar', {
    method: 'PUT'
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Error al reactivar usuario');
  }
  return response.json();
}

async function listarInfraccionesAdmin(params) {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  const response = await apiFetch('/api/administrador/infracciones' + qs);
  if (!response.ok) throw new Error('Error al cargar infracciones');
  return response.json();
}

async function obtenerInfraccionAdmin(id) {
  const response = await apiFetch('/api/administrador/infracciones/' + id);
  if (!response.ok) throw new Error('Error al obtener infracción');
  return response.json();
}

async function listarReportesPrioritarios() {
  const response = await apiFetch('/api/administrador/reportes/prioritarios');
  if (!response.ok) throw new Error('Error al cargar reportes prioritarios');
  return response.json();
}

async function resolverReporteAdmin(id) {
  const response = await apiFetch('/api/administrador/reportes/' + id + '/resolver', {
    method: 'PUT'
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Error al resolver reporte');
  }
  return response.json();
}

async function listarAcciones() {
  const response = await apiFetch('/api/administrador/acciones');
  if (!response.ok) throw new Error('Error al cargar acciones');
  return response.json();
}
