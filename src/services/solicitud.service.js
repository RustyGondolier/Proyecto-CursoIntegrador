const pool = require('../../db');
const { getIO } = require('../config/socket');
const logger = require('../config/logger');
const { calcularDistancia } = require('../utils/distance');
const solicitudRepository = require('../repositories/solicitud.repository');
const vehiculoRepository = require('../repositories/vehiculo.repository');
const {
  ESTADO_SOLICITUD, ESTADO_CUENTA, ESTADO_PLAZA, TIEMPO_LIMITE_INGRESO_MIN
} = require('../config/constants');

async function crear(usuarioId, estacionamientoId, ubicacion = {}) {
  const usuarioResult = await pool.query(
    `SELECT verificado, estado_cuenta FROM usuarios WHERE id = $1`,
    [usuarioId]
  );
  if (!usuarioResult.rows[0]) {
    const error = new Error('Usuario no encontrado');
    error.status = 404;
    throw error;
  }
  if (usuarioResult.rows[0].estado_cuenta === ESTADO_CUENTA.SUSPENDIDA) {
    const error = new Error('Tu cuenta está suspendida. No puedes solicitar plazas.');
    error.status = 403;
    throw error;
  }
  if (!usuarioResult.rows[0].verificado) {
    const error = new Error('Tu perfil no está verificado');
    error.status = 400;
    throw error;
  }

  const vehiculo = await vehiculoRepository.getActiveVehicle(usuarioId);
  if (!vehiculo) {
    const error = new Error('No tienes un vehículo registrado');
    error.status = 400;
    throw error;
  }

  const activa = await solicitudRepository.findActiveByUser(usuarioId);
  if (activa) {
    if (activa.estado === ESTADO_SOLICITUD.PENDIENTE || activa.estado === ESTADO_SOLICITUD.INGRESADO) {
      const error = new Error('Ya tienes una solicitud activa');
      error.status = 409;
      throw error;
    }
  }

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
  const permitido = distancia <= radio_permitido_metros;
  if (!permitido) {
    const error = new Error(`Debes estar dentro del campus (${radio_permitido_metros}m) para solicitar una plaza`);
    error.status = 400;
    throw error;
  }

  await pool.query(
    `INSERT INTO verificaciones_ubicacion (usuario_id, latitud, longitud, distancia_metros, permitido)
     VALUES ($1, $2, $3, $4, $5)`,
    [usuarioId, lat, lng, Math.round(distancia), permitido]
  );

  const tipoResult = await pool.query(
    `SELECT tv.categoria_plaza FROM tipos_vehiculo tv WHERE tv.id = $1`,
    [vehiculo.tipo_vehiculo_id]
  );
  const categoria = tipoResult.rows[0]?.categoria_plaza;
  if (!categoria) {
    const error = new Error('Tipo de vehículo no válido');
    error.status = 400;
    throw error;
  }

  const dispResult = await pool.query(
    `SELECT (
       SELECT COUNT(*) FROM plazas p
       JOIN bloques b ON b.id = p.bloque_id
       WHERE b.estacionamiento_id = $1 AND b.tipo_vehiculo = $2
     ) - (
       SELECT COUNT(*) FROM plazas p
       JOIN bloques b ON b.id = p.bloque_id
       WHERE b.estacionamiento_id = $1 AND b.tipo_vehiculo = $2 AND p.estado = $3
     ) - (
       SELECT COUNT(*) FROM solicitudes_estacionamiento s
       JOIN vehiculos v ON v.id = s.vehiculo_id
       JOIN tipos_vehiculo tv ON tv.id = v.tipo_vehiculo_id
        WHERE s.estacionamiento_id = $1 AND s.estado = $4 AND tv.categoria_plaza = $2
     ) AS disponibles`,
    [estacionamientoId, categoria, ESTADO_PLAZA.OCUPADA, ESTADO_SOLICITUD.PENDIENTE]
  );
  if (dispResult.rows[0].disponibles <= 0) {
    const error = new Error('No hay plazas disponibles en este estacionamiento');
    error.status = 409;
    throw error;
  }

  const tiempoLimite = TIEMPO_LIMITE_INGRESO_MIN;

  const solicitud = await solicitudRepository.create({
    usuario_id: usuarioId,
    vehiculo_id: vehiculo.id,
    estacionamiento_id: estacionamientoId,
    tiempo_limite_min: tiempoLimite
  });

  try { getIO().emit('ocupacion:updated'); } catch (err) {
    logger.warn('Error al emitir ocupacion:updated tras crear solicitud', { error: err.message });
  }

  return formatearSolicitud(solicitud);
}

async function obtenerActiva(usuarioId) {
  const expiradas = await solicitudRepository.expireOlderThan(new Date());
  if (expiradas.length > 0) {
    try { getIO().emit('ocupacion:updated'); } catch (err) {
      logger.warn('Error al emitir ocupacion:updated al expirar solicitudes', { error: err.message });
    }
  }

  const solicitud = await solicitudRepository.findActiveByUser(usuarioId);
  if (!solicitud) return null;

  return formatearSolicitud(solicitud);
}

async function cancelar(usuarioId) {
  const solicitud = await solicitudRepository.findActiveByUser(usuarioId);
  if (!solicitud) {
    const error = new Error('No tienes una solicitud activa');
    error.status = 404;
    throw error;
  }

  if (solicitud.estado === ESTADO_SOLICITUD.INGRESADO) {
    const error = new Error('El supervisor ya confirmó tu ingreso. No puedes cancelar desde la app, coordina con el supervisor.');
    error.status = 400;
    throw error;
  }

  await solicitudRepository.cancel(solicitud.id);
  try { getIO().emit('ocupacion:updated'); } catch (err) {
    logger.warn('Error al emitir ocupacion:updated al cancelar solicitud', { error: err.message });
  }
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
    plaza_codigo: solicitud.plaza_codigo || null,
    plaza_asignada_id: solicitud.plaza_asignada_id || null,
    hora_solicitud: solicitud.hora_solicitud,
    hora_limite_ingreso: solicitud.hora_limite_ingreso
  };
}

async function obtenerHistorial(usuarioId) {
  const registros = await solicitudRepository.findHistorialByUser(usuarioId);
  return registros.map(r => ({
    id: r.id,
    estacionamiento: r.estacionamiento_nombre,
    plaza_codigo: r.plaza_codigo || '—',
    estado: r.estado,
    hora_solicitud: r.hora_solicitud,
    hora_ingreso: r.hora_ingreso,
    hora_salida: r.hora_salida,
    tiempo_permanencia_min: r.tiempo_permanencia_min
  }));
}

module.exports = {
  crear,
  obtenerActiva,
  cancelar,
  obtenerHistorial
};
