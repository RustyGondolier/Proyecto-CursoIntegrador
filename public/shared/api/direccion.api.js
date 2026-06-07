async function obtenerDashboardDireccion(params) {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  const response = await apiFetch('/api/direccion/dashboard' + qs);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Error al cargar dashboard de dirección');
  }
  return response.json();
}
