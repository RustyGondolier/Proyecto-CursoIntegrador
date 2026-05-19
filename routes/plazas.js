const express = require('express');
const pool    = require('../db/index');
const { authJWT } = require('../middleware/authJWT');
const router  = express.Router();

// GET /api/plazas
// Devuelve todas las plazas con filtros opcionales
// Query params: estacionamiento_id, tipo_vehiculo, estado

router.get('/', authJWT, async (req, res) => {
  const { estacionamiento_id, tipo_vehiculo, estado } = req.query;

  try {
    let query = `
      SELECT
        p.id,
        p.codigo,
        p.estado,
        p.numero_plaza,
        tp.codigo  AS tipo_plaza,
        tp.label   AS tipo_plaza_label,
        b.codigo   AS bloque_codigo,
        b.letra_bloque,
        b.tipo_vehiculo,
        e.id       AS estacionamiento_id,
        e.nombre   AS estacionamiento_nombre
      FROM plazas p
      JOIN tipos_plaza    tp ON tp.id = p.tipo_plaza_id
      JOIN bloques        b  ON b.id  = p.bloque_id
      JOIN estacionamientos e ON e.id = b.estacionamiento_id
      WHERE 1=1
    `;

    const params = [];
    let   i      = 1;

    if (estacionamiento_id) {
      query += ` AND e.id = $${i++}`;
      params.push(estacionamiento_id);
    }
    if (tipo_vehiculo) {
      query += ` AND b.tipo_vehiculo = $${i++}`;
      params.push(tipo_vehiculo);
    }
    if (estado) {
      query += ` AND p.estado = $${i++}`;
      params.push(estado);
    }

    query += ' ORDER BY b.codigo, p.numero_plaza';

    const resultado = await pool.query(query, params);
    res.json(resultado.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/plazas/:id
// Devuelve el detalle de una plaza específica
router.get('/:id', authJWT, async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT
        p.*,
        tp.codigo  AS tipo_plaza,
        tp.label   AS tipo_plaza_label,
        b.codigo   AS bloque_codigo,
        b.letra_bloque,
        b.tipo_vehiculo,
        b.esp32_id,
        e.id       AS estacionamiento_id,
        e.nombre   AS estacionamiento_nombre
       FROM plazas p
       JOIN tipos_plaza     tp ON tp.id = p.tipo_plaza_id
       JOIN bloques         b  ON b.id  = p.bloque_id
       JOIN estacionamientos e ON e.id  = b.estacionamiento_id
       WHERE p.id = $1`,
      [req.params.id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Plaza no encontrada' });
    }

    res.json(resultado.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;