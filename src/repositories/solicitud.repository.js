const pool = require('../../db');
const { ESTADO_SOLICITUD } = require('../config/constants');

async function create({ usuario_id, vehiculo_id, estacionamiento_id, tiempo_limite_min }) {
  const result = await pool.query(
    `INSERT INTO solicitudes_estacionamiento
     (usuario_id, vehiculo_id, estacionamiento_id, hora_limite_ingreso)
     VALUES ($1, $2, $3, NOW() + ($4 || ' minutes')::INTERVAL)
     RETURNING *`,
    [usuario_id, vehiculo_id, estacionamiento_id, tiempo_limite_min],
  );
  return result.rows[0];
}

async function findActiveByUser(usuario_id) {
  const result = await pool.query(
    `SELECT s.*, e.nombre AS estacionamiento_nombre,
       p.codigo AS plaza_codigo,
       EXTRACT(EPOCH FROM (s.hora_limite_ingreso - NOW()))::INTEGER AS tiempo_restante_segundos
     FROM solicitudes_estacionamiento s
     JOIN estacionamientos e ON e.id = s.estacionamiento_id
     LEFT JOIN plazas p ON p.id = s.plaza_asignada_id
     WHERE s.usuario_id = $1 AND s.estado IN ($2, $3)
     ORDER BY s.creado_en DESC
     LIMIT 1`,
    [usuario_id, ESTADO_SOLICITUD.PENDIENTE, ESTADO_SOLICITUD.INGRESADO],
  );
  return result.rows[0] || null;
}

async function findById(id) {
  const result = await pool.query(
    `SELECT s.*, e.nombre AS estacionamiento_nombre
     FROM solicitudes_estacionamiento s
     JOIN estacionamientos e ON e.id = s.estacionamiento_id
     WHERE s.id = $1`,
    [id],
  );
  return result.rows[0] || null;
}

async function cancel(id) {
  const result = await pool.query(
    `UPDATE solicitudes_estacionamiento
     SET estado = $2
     WHERE id = $1 AND estado = $3
     RETURNING *`,
    [id, ESTADO_SOLICITUD.CANCELADO, ESTADO_SOLICITUD.PENDIENTE],
  );
  return result.rows[0] || null;
}

async function expireOlderThan(timestamp) {
  const result = await pool.query(
    `UPDATE solicitudes_estacionamiento
     SET estado = $2
     WHERE estado = $3 AND hora_limite_ingreso < $1
     RETURNING *`,
    [timestamp, ESTADO_SOLICITUD.EXPIRADO, ESTADO_SOLICITUD.PENDIENTE],
  );
  return result.rows;
}

async function assignPlaza(id, plazaId) {
  const result = await pool.query(
    `UPDATE solicitudes_estacionamiento SET plaza_asignada_id = $1 WHERE id = $2 RETURNING *`,
    [plazaId, id],
  );
  return result.rows[0] || null;
}

async function findHistorialByUser(usuarioId, filtros = {}) {
  let query = `
    SELECT s.id, s.hora_solicitud, s.hora_ingreso, s.hora_salida,
           s.estado, s.tiempo_permanencia_min, s.plaza_asignada_id,
           e.nombre AS estacionamiento_nombre,
           p.codigo AS plaza_codigo
    FROM solicitudes_estacionamiento s
    JOIN estacionamientos e ON e.id = s.estacionamiento_id
    LEFT JOIN plazas p ON p.id = s.plaza_asignada_id
    WHERE s.usuario_id = $1`;
  const params = [usuarioId];
  let idx = 2;

  if (filtros.fecha_inicio) {
    query += ` AND s.hora_solicitud >= $${idx}`;
    params.push(filtros.fecha_inicio);
    idx++;
  }
  if (filtros.fecha_fin) {
    query += ` AND s.hora_solicitud <= $${idx} + INTERVAL '1 day'`;
    params.push(filtros.fecha_fin);
    idx++;
  }

  query += ` ORDER BY s.hora_solicitud DESC LIMIT 50`;

  const result = await pool.query(query, params);
  return result.rows;
}

module.exports = {
  create,
  findActiveByUser,
  findById,
  cancel,
  expireOlderThan,
  assignPlaza,
  findHistorialByUser,
};
