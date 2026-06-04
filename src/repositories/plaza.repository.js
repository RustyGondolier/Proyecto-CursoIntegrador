const pool = require('../../db');

async function findAvailable(estacionamientoId, categoriaPlaza) {
  const result = await pool.query(
    `SELECT p.id, p.codigo
     FROM plazas p
     JOIN bloques b ON b.id = p.bloque_id
     JOIN tipos_plaza tp ON tp.id = p.tipo_plaza_id
     WHERE b.estacionamiento_id = $1
       AND tp.codigo LIKE $2 || '%'
       AND p.estado = 'disponible'
     ORDER BY RANDOM()
     LIMIT 1`,
    [estacionamientoId, categoriaPlaza]
  );
  return result.rows[0] || null;
}

async function updateEstado(id, estado) {
  await pool.query(
    `UPDATE plazas SET estado = $1 WHERE id = $2`,
    [estado, id]
  );
}

module.exports = {
  findAvailable,
  updateEstado
};
