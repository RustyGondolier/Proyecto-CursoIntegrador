async function listarReportes(estadoId) {
  const params = estadoId ? `?estado_id=${estadoId}` : '';
  const response = await apiFetch(`/api/reportes/todos${params}`);
  if (!response.ok) throw new Error('Error al cargar reportes');
  return response.json();
}

async function obtenerReporte(id) {
  const response = await apiFetch(`/api/reportes/${id}`);
  if (!response.ok) throw new Error('Error al obtener reporte');
  return response.json();
}

async function responderReporte(id, respuesta) {
  const response = await apiFetch(`/api/reportes/${id}/responder`, {
    method: 'PUT',
    body: JSON.stringify({ respuesta })
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Error al responder reporte');
  }
  return response.json();
}

async function marcarEnRevisionApi(id) {
  const response = await apiFetch(`/api/reportes/${id}/en-revision`, {
    method: 'PUT'
  });
  if (!response.ok) throw new Error('Error al marcar en revisión');
  return response.json();
}

async function marcarReportePrioritario(id, razon) {
  const response = await apiFetch(`/api/reportes/${id}/prioritario`, {
    method: 'PUT',
    body: JSON.stringify({ razon })
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Error al marcar como prioritario');
  }
  return response.json();
}
