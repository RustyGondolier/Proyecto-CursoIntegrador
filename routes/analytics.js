const express = require('express');
const pool    = require('../db/index');
const { authJWT, supervisorODirectora } = require('../middleware/authJWT');
const router  = express.Router();

// Todas las rutas de analytics requieren supervisor o directora
router.use(authJWT, supervisorODirectora);

// GET /api/analytics/ocupacion
// Estado actual de ocupación por estacionamiento
router.get('/ocupacion', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM v_ocupacion_actual');
    res.json(resultado.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/analytics/reservas
// Reservas por día últimos 30 días
router.get('/reservas', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM v_reservas_por_dia');
    res.json(resultado.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/analytics/infracciones
// Infracciones por tipo y mes
router.get('/infracciones', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM v_infracciones_por_mes');
    res.json(resultado.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/analytics/incumplidos
// Usuarios que reservan y no cumplen
router.get('/incumplidos', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM v_usuarios_incumplidos');
    res.json(resultado.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/analytics/flujo-horas
// Reservas por hora del día
router.get('/flujo-horas', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM v_flujo_por_hora');
    res.json(resultado.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/analytics/resumen
// Resumen general para el dashboard de la directora
router.get('/resumen', async (req, res) => {
  try {
    const [ocupacion, reservasHoy, totalUsuarios, totalInfracciones] = await Promise.all([
      pool.query('SELECT * FROM v_ocupacion_actual'),
      pool.query(
        `SELECT COUNT(*) AS total FROM reservas
         WHERE DATE(creado_en) = CURRENT_DATE`
      ),
      pool.query(
        `SELECT
           COUNT(*) FILTER (WHERE rol = 'estudiante')     AS estudiantes,
           COUNT(*) FILTER (WHERE rol = 'docente')        AS docentes,
           COUNT(*) FILTER (WHERE rol = 'administrativo') AS administrativos
         FROM usuarios WHERE estado_cuenta = 'activa'`
      ),
      pool.query(
        `SELECT COUNT(*) AS total FROM infracciones
         WHERE DATE(creado_en) = CURRENT_DATE`
      )
    ]);

    res.json({
      ocupacion:          ocupacion.rows,
      reservas_hoy:       parseInt(reservasHoy.rows[0].total),
      usuarios:           totalUsuarios.rows[0],
      infracciones_hoy:   parseInt(totalInfracciones.rows[0].total)
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;