const pool =
  require('../../db');

async function createVehicle(
  datos
){

  await pool.query(
    `
    INSERT INTO vehiculos(
      usuario_id,
      tipo_vehiculo_id,
      placa,
      modelo
    )
    VALUES(
      $1,$2,$3,$4
    )
    `,
    [
      datos.usuario_id,
      datos.tipo_vehiculo_id,
      datos.placa,
      datos.modelo
    ]
  );

}

async function getActiveVehicle(
  usuarioId
){

  const resultado =
    await pool.query(
      `
      SELECT *
      FROM vehiculos
      WHERE usuario_id = $1
      AND activo = true
      LIMIT 1
      `,
      [usuarioId]
    );

  return resultado.rows[0];

}

async function findByPlaca(
  placa
){

  const result =
    await pool.query(
      `
      SELECT *
      FROM vehiculos
      WHERE placa=$1
      `,
      [placa]
    );

  return result.rows[0];

}

async function existsByPlate(
  placa
){

  const resultado =
    await pool.query(
      `
      SELECT id
      FROM vehiculos
      WHERE placa = $1
      `,
      [placa]
    );

  return resultado.rows.length > 0;

}

module.exports = {
  createVehicle,
  getActiveVehicle,
  findByPlaca,
  existsByPlate
};