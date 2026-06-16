const pool = require('../../db');
const { ESTADO_REPORTE_ID } = require('../config/constants');

async function findByUserId(usuario_id) {
  const result = await pool.query(
    `SELECT
       r.id,
       r.descripcion,
       r.es_prioritario,
       r.razon_prioridad,
       r.respuesta_supervisor,
       r.valoracion,
       r.creado_en,
       r.actualizado_en,
       r.estacionamiento_id,
       er.codigo AS estado_codigo,
       er.descripcion AS estado,
       e.nombre AS estacionamiento_nombre,
       u.nombre AS supervisor_nombre
     FROM reportes_incidencias r
     JOIN estados_reporte er ON er.id = r.estado_id
     LEFT JOIN estacionamientos e ON e.id = r.estacionamiento_id
     LEFT JOIN usuarios u ON u.id = r.supervisor_id
     WHERE r.usuario_id = $1
     ORDER BY r.creado_en DESC`,
    [usuario_id],
  );

  return result.rows;
}

async function create({ usuario_id, estacionamiento_id, solicitud_id, plaza_id, descripcion }) {
  const result = await pool.query(
    `INSERT INTO reportes_incidencias
       (usuario_id, estacionamiento_id, solicitud_id, plaza_id, descripcion, estado_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
    [
      usuario_id,
      estacionamiento_id,
      solicitud_id,
      plaza_id,
      descripcion,
      ESTADO_REPORTE_ID.ENVIADO,
    ],
  );

  return result.rows[0];
}

async function findAll(estadoId) {
  let query = `
    SELECT
      r.id,
      r.descripcion,
      r.es_prioritario,
      r.razon_prioridad,
      r.respuesta_supervisor,
      r.valoracion,
      r.creado_en,
      r.actualizado_en,
      r.estacionamiento_id,
      r.plaza_id,
      r.usuario_id,
      r.supervisor_id,
      er.id AS estado_id,
      er.codigo AS estado_codigo,
      er.descripcion AS estado,
      e.nombre AS estacionamiento_nombre,
      u.nombre AS usuario_nombre,
      u.codigo_universitario AS usuario_codigo,
      u.correo_institucional AS usuario_correo,
      u.rol AS usuario_rol,
      p.codigo AS plaza_codigo,
      b.letra_bloque,
      p.numero_plaza,
      sup.nombre AS supervisor_nombre
    FROM reportes_incidencias r
    JOIN estados_reporte er ON er.id = r.estado_id
    LEFT JOIN estacionamientos e ON e.id = r.estacionamiento_id
    LEFT JOIN usuarios u ON u.id = r.usuario_id
    LEFT JOIN plazas p ON p.id = r.plaza_id
    LEFT JOIN bloques b ON b.id = p.bloque_id
    LEFT JOIN usuarios sup ON sup.id = r.supervisor_id
  `;
  const params = [];
  if (estadoId) {
    query += ` WHERE r.estado_id = $1`;
    params.push(estadoId);
  }
  query += ` ORDER BY r.creado_en DESC`;
  const result = await pool.query(query, params);
  return result.rows;
}

async function findById(id) {
  const result = await pool.query(
    `SELECT
       r.id,
       r.descripcion,
       r.es_prioritario,
       r.razon_prioridad,
       r.respuesta_supervisor,
       r.valoracion,
       r.creado_en,
       r.actualizado_en,
       r.estacionamiento_id,
       r.plaza_id,
       r.usuario_id,
       r.supervisor_id,
       er.id AS estado_id,
       er.codigo AS estado_codigo,
       er.descripcion AS estado,
       e.nombre AS estacionamiento_nombre,
       u.nombre AS usuario_nombre,
       u.codigo_universitario AS usuario_codigo,
       u.correo_institucional AS usuario_correo,
       u.rol AS usuario_rol,
       u.telefono AS usuario_telefono,
       p.codigo AS plaza_codigo,
       b.letra_bloque,
       p.numero_plaza,
       sup.nombre AS supervisor_nombre
     FROM reportes_incidencias r
     JOIN estados_reporte er ON er.id = r.estado_id
     LEFT JOIN estacionamientos e ON e.id = r.estacionamiento_id
     LEFT JOIN usuarios u ON u.id = r.usuario_id
     LEFT JOIN plazas p ON p.id = r.plaza_id
     LEFT JOIN bloques b ON b.id = p.bloque_id
     LEFT JOIN usuarios sup ON sup.id = r.supervisor_id
     WHERE r.id = $1`,
    [id],
  );
  return result.rows[0] || null;
}

async function marcarEnRevision({ id, supervisor_id }) {
  const result = await pool.query(
    `UPDATE reportes_incidencias
     SET estado_id = $3,
         supervisor_id = $2,
         actualizado_en = NOW()
     WHERE id = $1 AND estado_id = $4
     RETURNING *`,
    [id, supervisor_id, ESTADO_REPORTE_ID.EN_REVISION, ESTADO_REPORTE_ID.ENVIADO],
  );
  return result.rows[0] || null;
}

async function updateEstado({ id, estado_id, supervisor_id, respuesta_supervisor }) {
  const result = await pool.query(
    `UPDATE reportes_incidencias
     SET estado_id = $2,
         supervisor_id = $3,
         respuesta_supervisor = $4,
         actualizado_en = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, estado_id, supervisor_id, respuesta_supervisor],
  );
  return result.rows[0] || null;
}

async function marcarPrioritario({ id, supervisor_id, razon_prioridad }) {
  const result = await pool.query(
    `UPDATE reportes_incidencias
     SET estado_id = $4,
         es_prioritario = true,
         razon_prioridad = $3,
         supervisor_id = $2,
         actualizado_en = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, supervisor_id, razon_prioridad, ESTADO_REPORTE_ID.PRIORITARIO],
  );
  return result.rows[0] || null;
}

module.exports = {
  findByUserId,
  create,
  findAll,
  findById,
  marcarEnRevision,
  updateEstado,
  marcarPrioritario,
};
