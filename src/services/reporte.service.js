const { getIO } = require('../config/socket');
const logger = require('../config/logger');
const reporteRepository = require('../repositories/reporte.repository');
const solicitudRepository = require('../repositories/solicitud.repository');
const notificacionService = require('./notificacion.service');
const { ESTADO_REPORTE_ID, TIPO_NOTIFICACION } = require('../config/constants');

async function listar(usuario_id) {
  return reporteRepository.findByUserId(usuario_id);
}

async function listarTodos(estado_id) {
  return reporteRepository.findAll(estado_id || null);
}

async function marcarEnRevision({ id, supervisor_id }) {
  const reporte = await reporteRepository.findById(id);
  if (!reporte) {
    const error = new Error('Reporte no encontrado');
    error.status = 404;
    throw error;
  }
  if (reporte.estado_id !== ESTADO_REPORTE_ID.ENVIADO) {
    return reporte;
  }

  const actualizado = await reporteRepository.marcarEnRevision({ id, supervisor_id });

  try {
    getIO().to(`user:${reporte.usuario_id}`).emit('reporte:actualizado', {
      reporte_id: id,
      estado_id: ESTADO_REPORTE_ID.EN_REVISION,
    });
  } catch (err) {
    logger.warn('Error al emitir reporte:actualizado (en revisión)', {
      error: err.message,
      reporte_id: id,
    });
  }

  return actualizado;
}

async function obtenerDetalle(id) {
  const reporte = await reporteRepository.findById(id);
  if (!reporte) {
    const error = new Error('Reporte no encontrado');
    error.status = 404;
    throw error;
  }
  return reporte;
}

async function crear({ usuario_id, descripcion }) {
  if (!descripcion || descripcion.trim().length < 10) {
    const error = new Error('La descripción debe tener al menos 10 caracteres');
    error.status = 400;
    throw error;
  }

  const activa = await solicitudRepository.findActiveByUser(usuario_id);
  if (!activa) {
    const error = new Error('No tienes una solicitud activa');
    error.status = 400;
    throw error;
  }

  const reporte = await reporteRepository.create({
    usuario_id,
    estacionamiento_id: activa.estacionamiento_id,
    solicitud_id: activa.id,
    plaza_id: activa.plaza_asignada_id,
    descripcion: descripcion.trim(),
  });

  try {
    await notificacionService.notificarSupervisores({
      tipo_codigo: TIPO_NOTIFICACION.REPORTE,
      titulo: 'Nuevo reporte de incidencia',
      mensaje: `Un usuario ha reportado una incidencia. Revisa los reportes pendientes.`,
      url_destino: `/supervisor/incidencias/incidencias.html`,
    });
  } catch (err) {
    logger.warn('Error al notificar supervisores sobre nuevo reporte', { error: err.message });
  }

  return reporte;
}

async function responder({ id, supervisor_id, respuesta }) {
  if (!respuesta || respuesta.trim().length < 5) {
    const error = new Error('La respuesta debe tener al menos 5 caracteres');
    error.status = 400;
    throw error;
  }

  const reporte = await reporteRepository.findById(id);
  if (!reporte) {
    const error = new Error('Reporte no encontrado');
    error.status = 404;
    throw error;
  }

  const actualizado = await reporteRepository.updateEstado({
    id,
    estado_id: ESTADO_REPORTE_ID.RESUELTO,
    supervisor_id,
    respuesta_supervisor: respuesta.trim(),
  });

  if (!actualizado) {
    const error = new Error('Error al actualizar el reporte');
    error.status = 500;
    throw error;
  }

  try {
    await notificacionService.notificar({
      usuario_id: reporte.usuario_id,
      tipo_codigo: TIPO_NOTIFICACION.REPORTE,
      titulo: 'Reporte resuelto',
      mensaje: `Tu reporte #REP-${String(id).padStart(5, '0')} ha sido resuelto por un supervisor.`,
      url_destino: `/usuario/reportes/reportes.html`,
    });
  } catch (err) {
    logger.warn('Error al notificar respuesta de reporte', { error: err.message, reporte_id: id });
  }

  try {
    getIO().to(`user:${reporte.usuario_id}`).emit('reporte:actualizado', {
      reporte_id: id,
      estado_id: ESTADO_REPORTE_ID.RESUELTO,
    });
  } catch (err) {
    logger.warn('Error al emitir reporte:actualizado (resuelto)', {
      error: err.message,
      reporte_id: id,
    });
  }

  return actualizado;
}

async function marcarPrioritario({ id, supervisor_id, razon }) {
  if (!razon || razon.trim().length < 5) {
    const error = new Error('Debe indicar una razón para marcar como prioritario');
    error.status = 400;
    throw error;
  }

  const reporte = await reporteRepository.findById(id);
  if (!reporte) {
    const error = new Error('Reporte no encontrado');
    error.status = 404;
    throw error;
  }

  const actualizado = await reporteRepository.marcarPrioritario({
    id,
    supervisor_id,
    razon_prioridad: razon.trim(),
  });

  if (!actualizado) {
    const error = new Error('Error al marcar como prioritario');
    error.status = 500;
    throw error;
  }

  try {
    await notificacionService.notificarAdministradores({
      tipo_codigo: TIPO_NOTIFICACION.REPORTE,
      titulo: 'Reporte prioritario',
      mensaje: `El reporte #REP-${String(id).padStart(5, '0')} ha sido marcado como prioritario por un supervisor. Razón: ${razon.trim()}`,
      url_destino: `/administrador/incidencias/incidencias.html`,
    });
  } catch (err) {
    logger.warn('Error al notificar administradores sobre reporte prioritario', {
      error: err.message,
      reporte_id: id,
    });
  }

  try {
    getIO().to(`user:${reporte.usuario_id}`).emit('reporte:actualizado', {
      reporte_id: id,
      estado_id: ESTADO_REPORTE_ID.PRIORITARIO,
    });
  } catch (err) {
    logger.warn('Error al emitir reporte:actualizado (prioritario)', {
      error: err.message,
      reporte_id: id,
    });
  }

  return actualizado;
}

module.exports = {
  listar,
  listarTodos,
  marcarEnRevision,
  obtenerDetalle,
  crear,
  responder,
  marcarPrioritario,
};
