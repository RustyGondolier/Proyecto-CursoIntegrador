const logger = require('../config/logger');
const adminRepository = require('../repositories/administrador.repository');
const notificacionService = require('./notificacion.service');
const {
  ESTADO_CUENTA, TIPO_ACCION_ADMIN, TIPO_NOTIFICACION
} = require('../config/constants');

async function getDashboard() {
  const data = await adminRepository.getDashboardData();
  const acciones = await adminRepository.findAcciones(10);
  const pendientes = await adminRepository.findPendientes();
  return {
    pendientes_count: Number(data.pendientes_count),
    suspendidas_count: Number(data.suspendidas_count),
    prioritarios_count: Number(data.prioritarios_count),
    infracciones_mes: Number(data.infracciones_mes),
    acciones_recientes: acciones,
    pendientes_recientes: pendientes.slice(0, 5)
  };
}

async function listarPendientes() {
  return adminRepository.findPendientes();
}

async function listarUsuarios(filtros) {
  return adminRepository.findAllUsuarios(filtros);
}

async function obtenerUsuario(id) {
  const usuario = await adminRepository.findUserDetail(id);
  if (!usuario) {
    const error = new Error('Usuario no encontrado');
    error.status = 404;
    throw error;
  }
  return usuario;
}

async function aprobarPerfil(adminId, userId) {
  const usuario = await adminRepository.findUserDetail(userId);
  if (!usuario) {
    const error = new Error('Usuario no encontrado');
    error.status = 404;
    throw error;
  }
  if (usuario.verificado) {
    const error = new Error('El usuario ya ha sido verificado');
    error.status = 400;
    throw error;
  }
  if (usuario.estado_cuenta !== ESTADO_CUENTA.ACTIVA) {
    const error = new Error('No se puede verificar un usuario con cuenta suspendida');
    error.status = 400;
    throw error;
  }

  const actualizado = await adminRepository.updateVerificacion(userId, adminId);
  if (!actualizado) {
    const error = new Error('Error al actualizar la verificación');
    error.status = 500;
    throw error;
  }

  await adminRepository.registrarAccion({
    administrador_id: adminId,
    usuario_afectado_id: userId,
    tipo: TIPO_ACCION_ADMIN.VERIFICACION,
    descripcion: 'Perfil aprobado'
  });

  try {
    await notificacionService.notificar({
      usuario_id: userId,
      tipo_codigo: TIPO_NOTIFICACION.SISTEMA,
      titulo: 'Perfil verificado',
      mensaje: 'Tu perfil ha sido verificado correctamente. Ya puedes solicitar plazas de estacionamiento.',
      url_destino: '/usuario/dashboard/dashboard.html'
    });
  } catch (err) {
    logger.warn('Error al notificar aprobación de perfil', { error: err.message, usuario_id: userId });
  }

  return { mensaje: 'Perfil aprobado exitosamente', usuario: actualizado };
}

async function suspenderCuenta(adminId, userId, motivo) {
  if (!motivo || motivo.trim().length < 5) {
    const error = new Error('Debe indicar un motivo (mínimo 5 caracteres)');
    error.status = 400;
    throw error;
  }

  const usuario = await adminRepository.findUserDetail(userId);
  if (!usuario) {
    const error = new Error('Usuario no encontrado');
    error.status = 404;
    throw error;
  }
  if (usuario.estado_cuenta === ESTADO_CUENTA.SUSPENDIDA) {
    const error = new Error('La cuenta ya se encuentra suspendida');
    error.status = 400;
    throw error;
  }

  const actualizado = await adminRepository.updateEstadoCuenta(userId, ESTADO_CUENTA.SUSPENDIDA, motivo.trim());
  if (!actualizado) {
    const error = new Error('Error al suspender la cuenta');
    error.status = 500;
    throw error;
  }

  await adminRepository.registrarAccion({
    administrador_id: adminId,
    usuario_afectado_id: userId,
    tipo: TIPO_ACCION_ADMIN.SUSPENSION,
    descripcion: motivo.trim()
  });

  try {
    await notificacionService.notificar({
      usuario_id: userId,
      tipo_codigo: TIPO_NOTIFICACION.SISTEMA,
      titulo: 'Cuenta suspendida',
      mensaje: `Tu cuenta ha sido suspendida. Motivo: ${motivo.trim()}. Revisa tu correo institucional para más información.`,
      url_destino: '/usuario/perfil/perfil.html'
    });
  } catch (err) {
    logger.warn('Error al notificar suspensión de cuenta', { error: err.message, usuario_id: userId });
  }

  return { mensaje: 'Cuenta suspendida exitosamente', usuario: actualizado };
}

async function reactivarCuenta(adminId, userId) {
  const usuario = await adminRepository.findUserDetail(userId);
  if (!usuario) {
    const error = new Error('Usuario no encontrado');
    error.status = 404;
    throw error;
  }
  if (usuario.estado_cuenta !== ESTADO_CUENTA.SUSPENDIDA) {
    const error = new Error('La cuenta no está suspendida');
    error.status = 400;
    throw error;
  }

  const actualizado = await adminRepository.updateEstadoCuenta(userId, ESTADO_CUENTA.ACTIVA);
  if (!actualizado) {
    const error = new Error('Error al reactivar la cuenta');
    error.status = 500;
    throw error;
  }

  await adminRepository.registrarAccion({
    administrador_id: adminId,
    usuario_afectado_id: userId,
    tipo: TIPO_ACCION_ADMIN.REACTIVACION,
    descripcion: 'Cuenta reactivada'
  });

  try {
    await notificacionService.notificar({
      usuario_id: userId,
      tipo_codigo: TIPO_NOTIFICACION.SISTEMA,
      titulo: 'Cuenta reactivada',
      mensaje: 'Tu cuenta ha sido reactivada. Ya puedes solicitar plazas de estacionamiento nuevamente.',
      url_destino: '/usuario/dashboard/dashboard.html'
    });
  } catch (err) {
    logger.warn('Error al notificar reactivación de cuenta', { error: err.message, usuario_id: userId });
  }

  return { mensaje: 'Cuenta reactivada exitosamente', usuario: actualizado };
}

async function listarInfracciones(filtros) {
  return adminRepository.findAllInfracciones(filtros);
}

async function obtenerInfraccion(id) {
  const infraccion = await adminRepository.findInfraccionDetail(id);
  if (!infraccion) {
    const error = new Error('Infracción no encontrada');
    error.status = 404;
    throw error;
  }
  return infraccion;
}

async function listarReportesPrioritarios() {
  return adminRepository.findReportesPrioritarios();
}

async function resolverReporte(adminId, reporteId) {
  const reporte = await adminRepository.resolverReporte(reporteId);
  if (!reporte) {
    const error = new Error('Reporte no encontrado o ya fue resuelto');
    error.status = 404;
    throw error;
  }

  try {
    await notificacionService.notificar({
      usuario_id: reporte.usuario_id,
      tipo_codigo: TIPO_NOTIFICACION.REPORTE,
      titulo: 'Reporte prioritario resuelto',
      mensaje: `Tu reporte prioritario #REP-${String(reporteId).padStart(5, '0')} ha sido resuelto por el administrador.`,
      url_destino: `/usuario/reportes/reportes.html`
    });
  } catch (err) {
    logger.warn('Error al notificar resolución de reporte', { error: err.message, reporte_id: reporteId });
  }

  return { mensaje: 'Reporte resuelto exitosamente', reporte };
}

async function listarAcciones() {
  return adminRepository.findAcciones(50);
}

module.exports = {
  getDashboard,
  listarPendientes,
  listarUsuarios,
  obtenerUsuario,
  aprobarPerfil,
  suspenderCuenta,
  reactivarCuenta,
  listarInfracciones,
  obtenerInfraccion,
  listarReportesPrioritarios,
  resolverReporte,
  listarAcciones
};
