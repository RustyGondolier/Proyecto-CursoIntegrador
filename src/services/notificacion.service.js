const notificacionRepository = require('../repositories/notificacion.repository');
const { getIO } = require('../config/socket');

async function notificar({ usuario_id, tipo_codigo, titulo, mensaje, url_destino }) {
  const tipo = await notificacionRepository.findTipoByCodigo(tipo_codigo);
  if (!tipo) return null;

  const notificacion = await notificacionRepository.create({
    usuario_id,
    tipo_id: tipo.id,
    titulo,
    mensaje,
    url_destino
  });

  try {
    getIO().to(`user:${usuario_id}`).emit('notificacion:nueva', notificacion);
  } catch (_) {}

  return notificacion;
}

async function notificarAdministradores({ tipo_codigo, titulo, mensaje, url_destino }) {
  const admins = await notificacionRepository.findAdmins();
  const tipo = await notificacionRepository.findTipoByCodigo(tipo_codigo);
  if (!tipo) return [];

  const results = [];
  for (const admin of admins) {
    const notificacion = await notificacionRepository.create({
      usuario_id: admin.id,
      tipo_id: tipo.id,
      titulo,
      mensaje,
      url_destino
    });
    try {
      getIO().to(`user:${admin.id}`).emit('notificacion:nueva', notificacion);
    } catch (_) {}
    results.push(notificacion);
  }
  return results;
}

module.exports = {
  notificar,
  notificarAdministradores
};
