const pool = require('../../db');

async function create({ usuario_id, tipo_id, titulo, mensaje, url_destino }) {
  const result = await pool.query(
    `INSERT INTO notificaciones (usuario_id, tipo_id, titulo, mensaje, url_destino)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [usuario_id, tipo_id, titulo, mensaje, url_destino]
  );
  return result.rows[0];
}

async function findTipoByCodigo(codigo) {
  const result = await pool.query(
    `SELECT id FROM tipos_notificacion WHERE codigo = $1`,
    [codigo]
  );
  return result.rows[0] || null;
}

async function findAdmins() {
  const result = await pool.query(
    `SELECT id FROM usuarios WHERE rol = 'administrador' AND estado_cuenta = 'activa'`
  );
  return result.rows;
}

module.exports = {
  create,
  findTipoByCodigo,
  findAdmins
};
