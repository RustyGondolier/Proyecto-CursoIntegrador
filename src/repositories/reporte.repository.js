const pool = require('../../db');

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
    [usuario_id]
  );

  return result.rows;
}

async function create({ usuario_id, estacionamiento_id, descripcion }) {
  const result = await pool.query(
    `INSERT INTO reportes_incidencias
       (usuario_id, estacionamiento_id, descripcion, estado_id)
     VALUES ($1, $2, $3, 1)
     RETURNING *`,
    [usuario_id, estacionamiento_id, descripcion]
  );

  return result.rows[0];
}

module.exports = {
  findByUserId,
  create
};
