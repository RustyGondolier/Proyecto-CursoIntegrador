async function obtenerTiposInfraccion() {
  const response = await apiFetch('/api/infracciones/tipos');
  if (!response.ok) throw new Error('Error al cargar tipos de infracción');
  return response.json();
}

async function registrarInfraccion({ placa, tipo_infraccion_id, descripcion }) {
  const response = await apiFetch('/api/infracciones', {
    method: 'POST',
    body: JSON.stringify({ placa, tipo_infraccion_id, descripcion })
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Error al registrar infracción');
  }
  return response.json();
}

async function listarInfracciones() {
  const response = await apiFetch('/api/infracciones');
  if (!response.ok) throw new Error('Error al cargar infracciones');
  return response.json();
}

async function listarMisInfracciones() {
  const response = await apiFetch('/api/infracciones?mias=true');
  if (!response.ok) throw new Error('Error al cargar infracciones');
  return response.json();
}

async function obtenerInfraccionPorId(id) {
  const response = await apiFetch(`/api/infracciones/${id}`);
  if (!response.ok) throw new Error('Error al cargar infracción');
  return response.json();
}
