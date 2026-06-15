const pool =
  require('../../db');
const { ESTADO_PLAZA, ESTADO_SOLICITUD, TIPO_VEHICULO } = require('../config/constants');

async function getOcupacion(){

  const resultado =
    await pool.query(
      `
      SELECT

        e.id,
        e.nombre,

        COUNT(
          CASE
            WHEN b.tipo_vehiculo = $1
            THEN p.id
          END
        ) AS autos_total,

        COUNT(
          CASE
            WHEN b.tipo_vehiculo = $1
            AND p.estado = $2
            THEN p.id
          END
        ) + COALESCE((
          SELECT COUNT(*)
          FROM solicitudes_estacionamiento s
          JOIN vehiculos v ON v.id = s.vehiculo_id
          JOIN tipos_vehiculo tv ON tv.id = v.tipo_vehiculo_id
          WHERE s.estacionamiento_id = e.id
            AND s.estado = $3
            AND tv.categoria_plaza = $1
        ), 0) AS autos_ocupados,

        COUNT(
          CASE
            WHEN b.tipo_vehiculo = $4
            THEN p.id
          END
        ) AS motos_total,

        COUNT(
          CASE
            WHEN b.tipo_vehiculo = $4
            AND p.estado = $2
            THEN p.id
          END
        ) + COALESCE((
          SELECT COUNT(*)
          FROM solicitudes_estacionamiento s
          JOIN vehiculos v ON v.id = s.vehiculo_id
          JOIN tipos_vehiculo tv ON tv.id = v.tipo_vehiculo_id
          WHERE s.estacionamiento_id = e.id
            AND s.estado = $3
            AND tv.categoria_plaza = $4
        ), 0) AS motos_ocupadas

      FROM estacionamientos e

      LEFT JOIN bloques b
        ON b.estacionamiento_id = e.id

      LEFT JOIN plazas p
        ON p.bloque_id = b.id

      GROUP BY
        e.id,
        e.nombre

      ORDER BY e.id
      `,
    [
      TIPO_VEHICULO.AUTO,
      ESTADO_PLAZA.OCUPADA,
      ESTADO_SOLICITUD.PENDIENTE,
      TIPO_VEHICULO.MOTO
    ]
  );

  return resultado.rows;

}

async function getAll() {
  const result = await pool.query(
    'SELECT id, nombre, ubicacion FROM estacionamientos WHERE activo = true ORDER BY id'
  );
  return result.rows;
}

async function getPlazasByEstacionamiento(estacionamientoId) {
  const result = await pool.query(
    `SELECT p.id, p.codigo, p.numero_plaza, p.estado,
            b.letra_bloque, b.tipo_vehiculo, b.codigo AS bloque_codigo
     FROM plazas p
     JOIN bloques b ON b.id = p.bloque_id
     WHERE b.estacionamiento_id = $1
     ORDER BY b.id, p.numero_plaza`,
    [estacionamientoId]
  );
  return result.rows;
}

module.exports = {
  getOcupacion,
  getAll,
  getPlazasByEstacionamiento
};