const pool =
  require('../../db');

async function getOcupacion(){

  const resultado =
    await pool.query(
      `
      SELECT

        e.id,
        e.nombre,

        COUNT(
          CASE
            WHEN b.tipo_vehiculo = 'auto'
            THEN p.id
          END
        ) AS autos_total,

        COUNT(
          CASE
            WHEN b.tipo_vehiculo = 'auto'
            AND p.estado = 'ocupada'
            THEN p.id
          END
        ) AS autos_ocupados,

        COUNT(
          CASE
            WHEN b.tipo_vehiculo = 'moto'
            THEN p.id
          END
        ) AS motos_total,

        COUNT(
          CASE
            WHEN b.tipo_vehiculo = 'moto'
            AND p.estado = 'ocupada'
            THEN p.id
          END
        ) AS motos_ocupadas

      FROM estacionamientos e

      LEFT JOIN bloques b
        ON b.estacionamiento_id = e.id

      LEFT JOIN plazas p
        ON p.bloque_id = b.id

      GROUP BY
        e.id,
        e.nombre

      ORDER BY e.id
      `
    );

  return resultado.rows;

}

module.exports = {
  getOcupacion
};