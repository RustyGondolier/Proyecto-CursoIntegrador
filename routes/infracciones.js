const express = require('express');
const pool    = require('../db/index');
const { authJWT, soloSupervisor } = require('../middleware/authJWT');
const router  = express.Router();

// POST /api/infracciones
// Registra una infracción manualmente (solo supervisor)
router.post('/', authJWT, soloSupervisor, async (req, res) => {
  const { usuario_id, plaza_id, tipo_infraccion_id, descripcion } = req.body;
  const supervisor_id = req.usuario.id;

  if (!usuario_id || !plaza_id || !tipo_infraccion_id) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    // Verificar que el usuario existe
    const usuario = await pool.query(
      `SELECT id, puntos_infraccion FROM usuarios WHERE id = $1 AND rol = 'user'`,
      [usuario_id]
    );
    if (usuario.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Buscar vehículo del usuario
    const vehiculo = await pool.query(
      `SELECT id FROM vehiculos WHERE usuario_id = $1 AND activo = true LIMIT 1`,
      [usuario_id]
    );

    // Registrar infracción
    const infraccion = await pool.query(
      `INSERT INTO infracciones
        (usuario_id, plaza_id, vehiculo_id, supervisor_id,
         tipo_infraccion_id, hora_infraccion, descripcion)
       VALUES ($1, $2, $3, $4, $5, NOW(), $6)
       RETURNING *`,
      [
        usuario_id,
        plaza_id,
        vehiculo.rows[0]?.id || null,
        supervisor_id,
        tipo_infraccion_id,
        descripcion || null
      ]
    );

    // Sumar punto de infracción al usuario
    await pool.query(
      `UPDATE usuarios
       SET puntos_infraccion = puntos_infraccion + 1
       WHERE id = $1`,
      [usuario_id]
    );

    // Crear notificación para el usuario
    await pool.query(
      `INSERT INTO notificaciones
        (usuario_id, tipo_id, titulo, mensaje)
       VALUES ($1,
         (SELECT id FROM tipos_notificacion WHERE codigo = 'infraccion'),
         'Nueva infracción registrada',
         $2)`,
      [usuario_id, `Se registró una infracción en la plaza ${plaza_id}. ${descripcion || ''}`]
    );

    res.status(201).json({
      mensaje:    'Infracción registrada correctamente',
      infraccion: infraccion.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/infracciones
// Lista todas las infracciones (solo supervisor)
router.get('/', authJWT, soloSupervisor, async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT
        i.id,
        i.hora_infraccion,
        i.descripcion,
        i.creado_en,
        ti.codigo AS tipo_codigo,
        ti.descripcion AS tipo_descripcion,
        u.nombre       AS usuario_nombre,
        u.codigo_universitario,
        v.placa,
        p.codigo       AS plaza_codigo,
        e.nombre       AS estacionamiento
       FROM infracciones i
       JOIN tipos_infraccion  ti ON ti.id = i.tipo_infraccion_id
       JOIN usuarios          u  ON u.id  = i.usuario_id
       LEFT JOIN vehiculos    v  ON v.id  = i.vehiculo_id
       JOIN plazas            p  ON p.id  = i.plaza_id
       JOIN bloques           b  ON b.id  = p.bloque_id
       JOIN estacionamientos  e  ON e.id  = b.estacionamiento_id
       ORDER BY i.creado_en DESC`
    );

    res.json(resultado.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/infracciones/tipos
// Lista los tipos de infracción disponibles
// Accesible para supervisor
router.get('/tipos', authJWT, soloSupervisor, async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT id, codigo, descripcion FROM tipos_infraccion ORDER BY id`
    );
    res.json(resultado.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;