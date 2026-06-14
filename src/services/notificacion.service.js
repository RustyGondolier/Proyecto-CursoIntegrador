const logger = require('../config/logger');
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
  } catch (err) {
    logger.warn('Error al emitir notificacion:nueva', { error: err.message, usuario_id });
  }

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
    } catch (err) {
      logger.warn('Error al emitir notificacion:nueva a administrador', { error: err.message, admin_id: admin.id });
    }
    results.push(notificacion);
  }
  return results;
}

async function notificarSupervisores({ tipo_codigo, titulo, mensaje, url_destino }) {
  const supervisores = await notificacionRepository.findSupervisores();
  const tipo = await notificacionRepository.findTipoByCodigo(tipo_codigo);
  if (!tipo) return [];

  const results = [];
  for (const sup of supervisores) {
    const notificacion = await notificacionRepository.create({
      usuario_id: sup.id,
      tipo_id: tipo.id,
      titulo,
      mensaje,
      url_destino
    });
    try {
      getIO().to(`user:${sup.id}`).emit('notificacion:nueva', notificacion);
    } catch (err) {
      logger.warn('Error al emitir notificacion:nueva a supervisor', { error: err.message, supervisor_id: sup.id });
    }
    results.push(notificacion);
  }
  return results;
}

module.exports = {
  notificar,
  notificarAdministradores,
  notificarSupervisores
};
