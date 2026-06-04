const solicitudRepository = require('../repositories/solicitud.repository');
const vehiculoRepository = require('../repositories/vehiculo.repository');

async function crear(usuarioId, estacionamientoId) {
  const vehiculo = await vehiculoRepository.getActiveVehicle(usuarioId);
  if (!vehiculo) {
    const error = new Error('No tienes un vehículo registrado');
    error.status = 400;
    throw error;
  }

  const activa = await solicitudRepository.findActiveByUser(usuarioId);
  if (activa) {
    if (activa.estado === 'pendiente' || activa.estado === 'ingresado') {
      const error = new Error('Ya tienes una solicitud activa');
      error.status = 409;
      throw error;
    }
  }

  const tiempoLimite = parseInt(process.env.TIEMPO_LIMITE_INGRESO_MIN, 10) || 30;

  const solicitud = await solicitudRepository.create({
    usuario_id: usuarioId,
    vehiculo_id: vehiculo.id,
    estacionamiento_id: estacionamientoId,
    tiempo_limite_min: tiempoLimite
  });

  return formatearSolicitud(solicitud);
}

async function obtenerActiva(usuarioId) {
  await solicitudRepository.expireOlderThan(new Date());

  const solicitud = await solicitudRepository.findActiveByUser(usuarioId);
  if (!solicitud) return null;

  if (solicitud.hora_limite_ingreso && new Date(solicitud.hora_limite_ingreso) < new Date()) {
    await solicitudRepository.expireOlderThan(new Date());
    return null;
  }

  return formatearSolicitud(solicitud);
}

async function cancelar(usuarioId) {
  const solicitud = await solicitudRepository.findActiveByUser(usuarioId);
  if (!solicitud) {
    const error = new Error('No tienes una solicitud activa');
    error.status = 404;
    throw error;
  }

  await solicitudRepository.cancel(solicitud.id);
  return { mensaje: 'Solicitud cancelada exitosamente' };
}

function formatearSolicitud(solicitud) {
  const tiempoRestanteSegundos = solicitud.tiempo_restante_segundos;

  let tiempo_restante = '—';
  if (tiempoRestanteSegundos != null && tiempoRestanteSegundos > 0) {
    const min = Math.floor(tiempoRestanteSegundos / 60);
    const seg = tiempoRestanteSegundos % 60;
    tiempo_restante = `${min} min ${seg} s`;
  } else if (tiempoRestanteSegundos != null) {
    tiempo_restante = '0 min 0 s';
  }

  return {
    id: solicitud.id,
    estacionamiento_nombre: solicitud.estacionamiento_nombre,
    estado: solicitud.estado,
    tiempo_restante,
    hora_solicitud: solicitud.hora_solicitud,
    hora_limite_ingreso: solicitud.hora_limite_ingreso
  };
}

module.exports = {
  crear,
  obtenerActiva,
  cancelar
};
