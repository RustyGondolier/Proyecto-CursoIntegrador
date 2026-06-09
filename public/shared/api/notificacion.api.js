async function listarNotificaciones() {
  const res = await apiFetch('/api/notificaciones');
  if (!res.ok) throw new Error('Error al cargar notificaciones');
  return res.json();
}

async function contarNoLeidas() {
  const res = await apiFetch('/api/notificaciones/no-leidas');
  if (!res.ok) return { total: 0 };
  return res.json();
}

async function marcarLeida(id) {
  const res = await apiFetch(`/api/notificaciones/${id}/leer`, { method: 'PATCH' });
  if (!res.ok) throw new Error('Error al marcar notificación');
  return res.json();
}

async function marcarTodasLeidas() {
  const res = await apiFetch('/api/notificaciones/leer-todas', { method: 'PATCH' });
  if (!res.ok) throw new Error('Error al marcar notificaciones');
  return res.json();
}