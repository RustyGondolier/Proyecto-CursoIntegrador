const express =
  require('express');

const pool =
  require('../db');

const {
  authJWT
} = require(
  '../middleware/authJWT'
);

const router =
  express.Router();

router.get(
  '/',
  authJWT,
  async (
    req,
    res
  ) => {

    try{

      const resultado =
        await pool.query(
          `
          SELECT
            e.id,
            e.nombre,

            COUNT(p.id)
            FILTER(
              WHERE tp.codigo
              LIKE 'auto%'
            ) total_autos,

            COUNT(p.id)
            FILTER(
              WHERE tp.codigo
              LIKE 'moto%'
            ) total_motos,

            COUNT(p.id)
            FILTER(
              WHERE tp.codigo
              LIKE 'auto%'
              AND p.estado='ocupada'
            ) autos_ocupados,

            COUNT(p.id)
            FILTER(
              WHERE tp.codigo
              LIKE 'moto%'
              AND p.estado='ocupada'
            ) motos_ocupadas

          FROM estacionamientos e

          JOIN bloques b
            ON b.estacionamiento_id=e.id

          JOIN plazas p
            ON p.bloque_id=b.id

          JOIN tipos_plaza tp
            ON tp.id=p.tipo_plaza_id

          GROUP BY e.id

          ORDER BY e.id
          `
        );

      return res.json(
        resultado.rows
      );

    }catch(err){

      console.error(err);

      return res.status(500)
      .json({
        error:
          'Error interno'
      });

    }

  }
);

module.exports =
  router;