const notificacionRepository = require('../repositories/notificacion.repository');

async function listar(req, res) {
  try {
    const notificaciones = await notificacionRepository.findByUserId(req.usuario.id);
    res.json(notificaciones);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar notificaciones' });
  }
}

async function noLeidas(req, res) {
  try {
    const total = await notificacionRepository.countUnread(req.usuario.id);
    res.json({ total });
  } catch (error) {
    res.status(500).json({ error: 'Error al contar notificaciones' });
  }
}

async function marcarLeida(req, res) {
  try {
    const notificacion = await notificacionRepository.markAsRead(req.params.id, req.usuario.id);
    if (!notificacion) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }
    res.json(notificacion);
  } catch (error) {
    res.status(500).json({ error: 'Error al marcar notificación' });
  }
}

async function marcarTodasLeidas(req, res) {
  try {
    await notificacionRepository.markAllAsRead(req.usuario.id);
    res.json({ mensaje: 'Todas las notificaciones fueron marcadas como leídas' });
  } catch (error) {
    res.status(500).json({ error: 'Error al marcar notificaciones' });
  }
}

module.exports = {
  listar,
  noLeidas,
  marcarLeida,
  marcarTodasLeidas
};