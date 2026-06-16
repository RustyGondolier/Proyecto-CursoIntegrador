const pool = require('../../db');
const { ROLES, ESTADO_CUENTA } = require('../config/constants');

async function create({ usuario_id, tipo_id, titulo, mensaje, url_destino }) {
  const result = await pool.query(
    `INSERT INTO notificaciones (usuario_id, tipo_id, titulo, mensaje, url_destino)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [usuario_id, tipo_id, titulo, mensaje, url_destino],
  );
  return result.rows[0];
}

async function findTipoByCodigo(codigo) {
  const result = await pool.query(`SELECT id FROM tipos_notificacion WHERE codigo = $1`, [codigo]);
  return result.rows[0] || null;
}

async function findAdmins() {
  const result = await pool.query(`SELECT id FROM usuarios WHERE rol = $1 AND estado_cuenta = $2`, [
    ROLES.ADMINISTRADOR,
    ESTADO_CUENTA.ACTIVA,
  ]);
  return result.rows;
}

async function findSupervisores() {
  const result = await pool.query(`SELECT id FROM usuarios WHERE rol = $1 AND estado_cuenta = $2`, [
    ROLES.SUPERVISOR,
    ESTADO_CUENTA.ACTIVA,
  ]);
  return result.rows;
}

async function findByUserId(usuario_id, limite = 50) {
  const result = await pool.query(
    `SELECT n.*, tn.descripcion AS tipo_descripcion
     FROM notificaciones n
     JOIN tipos_notificacion tn ON tn.id = n.tipo_id
     WHERE n.usuario_id = $1
     ORDER BY n.creado_en DESC
     LIMIT $2`,
    [usuario_id, limite],
  );
  return result.rows;
}

async function countUnread(usuario_id) {
  const result = await pool.query(
    `SELECT COUNT(*)::int AS total FROM notificaciones WHERE usuario_id = $1 AND leida = false`,
    [usuario_id],
  );
  return result.rows[0].total;
}

async function markAsRead(id, usuario_id) {
  const result = await pool.query(
    `UPDATE notificaciones SET leida = true WHERE id = $1 AND usuario_id = $2 RETURNING *`,
    [id, usuario_id],
  );
  return result.rows[0] || null;
}

async function markAllAsRead(usuario_id) {
  await pool.query(
    `UPDATE notificaciones SET leida = true WHERE usuario_id = $1 AND leida = false`,
    [usuario_id],
  );
}

module.exports = {
  create,
  findTipoByCodigo,
  findAdmins,
  findSupervisores,
  findByUserId,
  countUnread,
  markAsRead,
  markAllAsRead,
};
