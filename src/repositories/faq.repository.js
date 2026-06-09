const pool = require('../../db');

async function getCategorias() {
  const result = await pool.query(
    'SELECT id, nombre FROM faq_categorias ORDER BY id'
  );
  return result.rows;
}

async function getByCategoria(categoriaId) {
  const result = await pool.query(
    `SELECT id, pregunta, respuesta FROM faq
     WHERE categoria_id = $1 AND activo = true
     ORDER BY id`,
    [categoriaId]
  );
  return result.rows;
}

module.exports = { getCategorias, getByCategoria };
