const pool = require('../../db');

async function createVehicle(datos) {
  const resultado = await pool.query(
    `
      INSERT INTO vehiculos(
        usuario_id,
        tipo_vehiculo_id,
        placa,
        modelo
      )
      VALUES(
        $1,
        (SELECT id FROM tipos_vehiculo WHERE codigo = $2),
        $3,
        $4
      )
      RETURNING *
      `,
    [datos.usuario_id, datos.tipo_vehiculo_id, datos.placa, datos.modelo],
  );

  return resultado.rows[0];
}

async function getActiveVehicle(usuarioId) {
  const resultado = await pool.query(
    `
      SELECT *
      FROM vehiculos
      WHERE usuario_id = $1
      AND activo = true
      LIMIT 1
      `,
    [usuarioId],
  );

  return resultado.rows[0];
}

async function findByPlaca(placa) {
  const result = await pool.query(
    `
      SELECT *
      FROM vehiculos
      WHERE placa=$1
      `,
    [placa],
  );

  return result.rows[0];
}

async function existsByPlate(placa) {
  const resultado = await pool.query(
    `
      SELECT id
      FROM vehiculos
      WHERE placa = $1
      `,
    [placa],
  );

  return resultado.rows.length > 0;
}

async function getUserVehicles(usuarioId) {
  const resultado = await pool.query(
    `
      SELECT
        v.id,
        v.usuario_id,
        tv.codigo AS tipo,
        v.placa,
        v.modelo,
        v.activo,
        v.creado_en
      FROM vehiculos v
      JOIN tipos_vehiculo tv ON tv.id = v.tipo_vehiculo_id
      WHERE v.usuario_id = $1
      ORDER BY v.activo DESC, v.id
      `,
    [usuarioId],
  );

  return resultado.rows;
}

async function updateVehicle(id, datos) {
  const resultado = await pool.query(
    `
      UPDATE vehiculos
      SET
        placa = $1,
        modelo = $2,
        tipo_vehiculo_id = (
          SELECT id FROM tipos_vehiculo WHERE codigo = $3
        )
      WHERE id = $4
      RETURNING *
      `,
    [datos.placa, datos.modelo, datos.tipo_vehiculo_id, id],
  );

  return resultado.rows[0];
}

async function deleteVehicle(id) {
  await pool.query(
    `
    DELETE FROM vehiculos
    WHERE id = $1
    `,
    [id],
  );
}

async function deactivateAll(usuarioId) {
  await pool.query(
    `
    UPDATE vehiculos
    SET activo = false
    WHERE usuario_id = $1
    `,
    [usuarioId],
  );
}

async function setActive(id) {
  await pool.query(
    `
    UPDATE vehiculos
    SET activo = true
    WHERE id = $1
    `,
    [id],
  );
}

module.exports = {
  createVehicle,
  getActiveVehicle,
  findByPlaca,
  existsByPlate,
  getUserVehicles,
  updateVehicle,
  deleteVehicle,
  deactivateAll,
  setActive,
};
