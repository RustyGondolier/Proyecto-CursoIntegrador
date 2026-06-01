const express = require('express');
const pool = require('../db');
const { authJWT } = require('../middleware/authJWT');

const router = express.Router();

/*
=================================
OCUPACIÓN PARA DASHBOARD USUARIO
=================================
*/
router.get('/ocupacion', authJWT, async (req, res) => {

  try {

    const resultado = await pool.query(`
      SELECT
        e.id,
        e.nombre,

        COUNT(p.id) FILTER (WHERE tp.codigo = 'auto_estandar') AS autos_total,
        COUNT(p.id) FILTER (WHERE tp.codigo = 'moto_estandar') AS motos_total,

        COUNT(p.id) FILTER (
          WHERE tp.codigo = 'auto_estandar'
          AND p.estado = 'ocupada'
        ) AS autos_ocupados,

        COUNT(p.id) FILTER (
          WHERE tp.codigo = 'moto_estandar'
          AND p.estado = 'ocupada'
        ) AS motos_ocupados

      FROM estacionamientos e

      LEFT JOIN bloques b
        ON b.estacionamiento_id = e.id

      LEFT JOIN plazas p
        ON p.bloque_id = b.id

      LEFT JOIN tipos_plaza tp
        ON tp.id = p.tipo_plaza_id

      GROUP BY e.id
      ORDER BY e.id
    `);

    res.json(resultado.rows);

  } catch (err) {
    console.error('ERROR OCUPACION:', err);
    res.status(500).json({ error: 'Error interno' });
  }

});

module.exports = router;