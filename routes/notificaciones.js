const express = require('express');
const pool    = require('../db/index');
const { authJWT } = require('../middleware/authJWT');
const router  = express.Router();

// GET /api/notificaciones
// Notificaciones del usuario autenticado
router.get('/', authJWT, async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT
        n.id,
        n.titulo,
        n.mensaje,
        n.leida,
        n.url_destino,
        n.creado_en,
        tn.codigo AS tipo
       FROM notificaciones n
       JOIN tipos_notificacion tn ON tn.id = n.tipo_id
       WHERE n.usuario_id = $1
       ORDER BY n.creado_en DESC
       LIMIT 50`,
      [req.usuario.id]
    );

    res.json(resultado.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PATCH /api/notificaciones/leer-todas
// Marca todas las notificaciones como leídas
router.patch('/leer-todas', authJWT, async (req, res) => {
  try {
    await pool.query(
      `UPDATE notificaciones SET leida = true WHERE usuario_id = $1`,
      [req.usuario.id]
    );

    res.json({ mensaje: 'Todas las notificaciones marcadas como leídas' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PATCH /api/notificaciones/:id
// Marca una notificación como leída
router.patch('/:id', authJWT, async (req, res) => {
  try {
    const resultado = await pool.query(
      `UPDATE notificaciones
       SET leida = true
       WHERE id = $1 AND usuario_id = $2
       RETURNING id`,
      [req.params.id, req.usuario.id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }

    res.json({ mensaje: 'Notificación marcada como leída' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;