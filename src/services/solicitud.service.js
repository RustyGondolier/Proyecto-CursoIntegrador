const pool = require('../../db');
const { getIO } = require('../config/socket');
const solicitudRepository = require('../repositories/solicitud.repository');
const vehiculoRepository = require('../repositories/vehiculo.repository');

async function crear(usuarioId, estacionamientoId, ubicacion = {}) {
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

  /*
  ============================================================
  VALIDACIÓN DE GEOLOCALIZACIÓN
  Descomentar cuando se quiera activar el control de distancia
  ============================================================
  const { lat, lng } = ubicacion;
  if (!lat || !lng) {
    const error = new Error('No se pudo obtener tu ubicación');
    error.status = 400;
    throw error;
  }
  const sedeResult = await pool.query(
    `SELECT s.latitud, s.longitud, s.radio_permitido_metros
     FROM estacionamientos e
     JOIN sedes s ON s.id = e.sede_id
     WHERE e.id = $1`,
    [estacionamientoId]
  );
  if (!sedeResult.rows[0]) {
    const error = new Error('Estacionamiento no encontrado');
    error.status = 404;
    throw error;
  }
  const { latitud, longitud, radio_permitido_metros } = sedeResult.rows[0];
  const distancia = calcularDistancia(latitud, longitud, lat, lng);
  if (distancia > radio_permitido_metros) {
    const error = new Error(`Debes estar dentro del campus (${radio_permitido_metros}m) para solicitar una plaza`);
    error.status = 403;
    throw error;
  }
  */

  const tiempoLimite = parseInt(process.env.TIEMPO_LIMITE_INGRESO_MIN, 10) || 30;

  const solicitud = await solicitudRepository.create({
    usuario_id: usuarioId,
    vehiculo_id: vehiculo.id,
    estacionamiento_id: estacionamientoId,
    tiempo_limite_min: tiempoLimite
  });

  try { getIO().emit('ocupacion:updated'); } catch (_) {}

  return formatearSolicitud(solicitud);
}

async function obtenerActiva(usuarioId) {
  const expiradas = await solicitudRepository.expireOlderThan(new Date());
  if (expiradas.length > 0) {
    try { getIO().emit('ocupacion:updated'); } catch (_) {}
  }

  const solicitud = await solicitudRepository.findActiveByUser(usuarioId);
  if (!solicitud) return null;

  if (solicitud.hora_limite_ingreso && new Date(solicitud.hora_limite_ingreso) < new Date()) {
    const expiradas = await solicitudRepository.expireOlderThan(new Date());
    if (expiradas.length > 0) {
      try { getIO().emit('ocupacion:updated'); } catch (_) {}
    }
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
  try { getIO().emit('ocupacion:updated'); } catch (_) {}
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

/*
============================================================
FUNCIÓN AUXILIAR: CÁLCULO DE DISTANCIA HAVERSINE
Descomentar junto con la validación de geolocalización
============================================================
function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
*/

module.exports = {
  crear,
  obtenerActiva,
  cancelar
};
