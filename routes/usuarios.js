const express = require('express');
const pool    = require('../db/index');
const { authJWT, soloSupervisor } = require('../middleware/authJWT');
const router  = express.Router();

// GET /api/usuarios
// Lista de usuarios con búsqueda por nombre, código o placa
// Solo supervisor
router.get('/', authJWT, soloSupervisor, async (req, res) => {
  const { buscar } = req.query;

  try {
    let query = `
      SELECT
        u.id,
        u.codigo_universitario,
        u.nombre,
        u.telefono,
        u.rol,
        u.estado_cuenta,
        u.puntos_infraccion,
        u.creado_en,
        v.placa,
        v.modelo,
        tv.codigo AS tipo_vehiculo
      FROM usuarios u
      LEFT JOIN vehiculos     v  ON v.usuario_id = u.id AND v.activo = true
      LEFT JOIN tipos_vehiculo tv ON tv.id = v.tipo_vehiculo_id
      WHERE u.WHERE u.rol IN ('estudiante','docente','administrativo') = 'user'
    `;

    const params = [];

    if (buscar) {
      query += `
        AND (
          u.nombre              ILIKE $1 OR
          u.codigo_universitario ILIKE $1 OR
          v.placa               ILIKE $1
        )
      `;
      params.push(`%${buscar}%`);
    }

    query += ' ORDER BY u.creado_en DESC';

    const resultado = await pool.query(query, params);
    res.json(resultado.rows);

  } catch (err) {
    console.error("Detalle",err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/usuarios/:id
// Detalle completo de un usuario con sus reservas e infracciones
// Solo supervisor
router.get('/:id', authJWT, soloSupervisor, async (req, res) => {
  try {
    const usuario = await pool.query(
      `SELECT
        u.id,
        u.codigo_universitario,
        u.nombre,
        u.telefono,
        u.rol,
        u.estado_cuenta,
        u.motivo_suspension,
        u.puntos_infraccion,
        u.creado_en,
        v.id     AS vehiculo_id,
        v.placa,
        v.modelo,
        tv.codigo AS tipo_vehiculo
       FROM usuarios u
       LEFT JOIN vehiculos      v  ON v.usuario_id = u.id AND v.activo = true
       LEFT JOIN tipos_vehiculo tv ON tv.id = v.tipo_vehiculo_id
       WHERE u.id = $1`,
      [req.params.id]
    );

    if (usuario.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Reservas del usuario
    const reservas = await pool.query(
      `SELECT
        r.id, r.hora_inicio, r.hora_fin, r.estado, r.creado_en,
        p.codigo AS plaza_codigo,
        e.nombre AS estacionamiento
       FROM reservas r
       JOIN plazas          p ON p.id = r.plaza_id
       JOIN bloques         b ON b.id = p.bloque_id
       JOIN estacionamientos e ON e.id = b.estacionamiento_id
       WHERE r.usuario_id = $1
       ORDER BY r.creado_en DESC
       LIMIT 10`,
      [req.params.id]
    );

    // Infracciones del usuario
    const infracciones = await pool.query(
      `SELECT
        i.id, i.hora_infraccion, i.descripcion, i.creado_en,
        ti.descripcion  AS tipo,
        p.codigo  AS plaza_codigo
       FROM infracciones i
       JOIN tipos_infraccion ti ON ti.id = i.tipo_infraccion_id
       JOIN plazas           p  ON p.id  = i.plaza_id
       WHERE i.usuario_id = $1
       ORDER BY i.creado_en DESC`,
      [req.params.id]
    );

    res.json({
      ...usuario.rows[0],
      reservas:    reservas.rows,
      infracciones: infracciones.rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PATCH /api/usuarios/:id/suspender
// Suspende o reactiva una cuenta
// Solo supervisor
router.patch('/:id/suspender', authJWT, soloSupervisor, async (req, res) => {
  const { motivo } = req.body;

  try {
    const usuario = await pool.query(
      `SELECT id, estado_cuenta FROM usuarios WHERE id = $1 AND rol IN ('estudiante','docente','administrativo')`,
      [req.params.id]
    );

    if (usuario.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const nuevoEstado = usuario.rows[0].estado_cuenta === 'activa'
      ? 'suspendida'
      : 'activa';

    await pool.query(
      `UPDATE usuarios
       SET estado_cuenta = $1, motivo_suspension = $2
       WHERE id = $3`,
      [nuevoEstado, motivo || null, req.params.id]
    );

    res.json({
      mensaje: `Cuenta ${nuevoEstado === 'suspendida' ? 'suspendida' : 'reactivada'} correctamente`,
      estado_cuenta: nuevoEstado
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PATCH /api/usuarios/:id/conadis
// Verifica o revoca el código CONADIS de un usuario
// Solo supervisor
router.patch('/:id/conadis', authJWT, soloSupervisor, async (req, res) => {
  const { verificado } = req.body;

  try {
    const usuario = await pool.query(
      `SELECT id, codigo_conadis FROM usuarios
       WHERE id = $1 AND rol IN ('estudiante','docente','administrativo')`,
      [req.params.id]
    );

    if (usuario.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (!usuario.rows[0].codigo_conadis) {
      return res.status(400).json({ error: 'El usuario no tiene código CONADIS registrado' });
    }

    await pool.query(
      `UPDATE usuarios SET conadis_verificado = $1 WHERE id = $2`,
      [verificado === true, req.params.id]
    );

    // Notificar al usuario
    await pool.query(
      `INSERT INTO notificaciones (usuario_id, tipo_id, titulo, mensaje)
       VALUES ($1,
         (SELECT id FROM tipos_notificacion WHERE codigo = 'sistema'),
         $2, $3)`,
      [
        req.params.id,
        verificado ? 'CONADIS verificado' : 'CONADIS revocado',
        verificado
          ? 'Tu código CONADIS fue verificado. Ya puedes reservar plazas para discapacidad.'
          : 'Tu verificación CONADIS fue revocada. Contacta al supervisor.'
      ]
    );

    res.json({
      mensaje: `CONADIS ${verificado ? 'verificado' : 'revocado'} correctamente`
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;