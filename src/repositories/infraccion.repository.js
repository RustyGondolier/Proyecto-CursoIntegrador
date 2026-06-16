const pool = require('../../db');

async function findTipos() {
  const result = await pool.query(
    'SELECT id, codigo, descripcion FROM tipos_infraccion ORDER BY id',
  );
  return result.rows;
}

async function create({
  usuario_id,
  vehiculo_id,
  plaza_id,
  solicitud_id,
  supervisor_id,
  tipo_infraccion_id,
  descripcion,
}) {
  const result = await pool.query(
    `INSERT INTO infracciones
       (usuario_id, vehiculo_id, plaza_id, solicitud_id, supervisor_id, tipo_infraccion_id, descripcion)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      usuario_id,
      vehiculo_id,
      plaza_id,
      solicitud_id,
      supervisor_id,
      tipo_infraccion_id,
      descripcion,
    ],
  );
  return result.rows[0];
}

async function findAll(supervisorId) {
  let query = `
    SELECT
      i.id,
      i.descripcion,
      i.creado_en,
      i.tipo_infraccion_id,
      ti.codigo AS tipo_codigo,
      ti.descripcion AS tipo_descripcion,
      u.id AS usuario_id,
      u.nombre AS usuario_nombre,
      u.codigo_universitario AS usuario_codigo,
      v.placa,
      v.modelo,
      s.nombre AS supervisor_nombre
    FROM infracciones i
    JOIN tipos_infraccion ti ON ti.id = i.tipo_infraccion_id
    JOIN usuarios u ON u.id = i.usuario_id
    LEFT JOIN vehiculos v ON v.id = i.vehiculo_id
    JOIN usuarios s ON s.id = i.supervisor_id
  `;
  const params = [];
  if (supervisorId) {
    query += ` WHERE i.supervisor_id = $1`;
    params.push(supervisorId);
  }
  query += ` ORDER BY i.creado_en DESC`;
  const result = await pool.query(query, params);
  return result.rows;
}

async function findById(id) {
  const result = await pool.query(
    `SELECT
       i.id,
       i.descripcion,
       i.creado_en,
       i.tipo_infraccion_id,
       i.usuario_id,
       i.vehiculo_id,
       i.plaza_id,
       i.solicitud_id,
       i.supervisor_id,
       ti.codigo AS tipo_codigo,
       ti.descripcion AS tipo_descripcion,
       u.nombre AS usuario_nombre,
       u.codigo_universitario AS usuario_codigo,
       v.placa,
       v.modelo,
       s.nombre AS supervisor_nombre,
       p.codigo AS plaza_codigo
     FROM infracciones i
     JOIN tipos_infraccion ti ON ti.id = i.tipo_infraccion_id
     JOIN usuarios u ON u.id = i.usuario_id
     LEFT JOIN vehiculos v ON v.id = i.vehiculo_id
     JOIN usuarios s ON s.id = i.supervisor_id
     LEFT JOIN plazas p ON p.id = i.plaza_id
     WHERE i.id = $1`,
    [id],
  );
  return result.rows[0] || null;
}

module.exports = {
  findTipos,
  create,
  findAll,
  findById,
};
