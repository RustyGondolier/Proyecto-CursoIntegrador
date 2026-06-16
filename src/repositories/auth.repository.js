const pool = require('../../db');

async function findUserByCode(codigo) {
  const result = await pool.query(
    `
      SELECT *
      FROM usuarios
      WHERE codigo_universitario=$1
      `,
    [codigo],
  );

  return result.rows[0];
}

async function getProfile(userId) {
  const result = await pool.query(
    `
      SELECT
        u.*,
        v.placa,
        v.modelo
      FROM usuarios u

      LEFT JOIN vehiculos v
        ON v.usuario_id=u.id

      WHERE u.id=$1
      `,
    [userId],
  );

  return result.rows[0];
}

module.exports = {
  findUserByCode,
  getProfile,
};
