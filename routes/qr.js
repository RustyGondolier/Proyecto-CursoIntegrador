const express = require('express');
const pool    = require('../db/index');
const router  = express.Router();

// GET /api/qr/:token
// Valida el QR del usuario en la entrada física
router.get('/:token', async (req, res) => {
  try {
    const usuario = await pool.query(
      `SELECT id, nombre, estado_cuenta FROM usuarios
       WHERE qr_token = $1`,
      [req.params.token]
    );

    if (usuario.rows.length === 0) {
      return res.status(404).json({
        resultado: 'sin_reserva',
        mensaje:   'QR no reconocido'
      });
    }

    const u = usuario.rows[0];

    if (u.estado_cuenta !== 'activa') {
      await registrarEscaneo(u.id, null, 'cuenta_suspendida');
      return res.status(403).json({
        resultado: 'cuenta_suspendida',
        mensaje:   'Cuenta suspendida'
      });
    }

    const reserva = await pool.query(
      `SELECT r.*, p.codigo AS plaza_codigo
       FROM reservas r
       JOIN plazas p ON p.id = r.plaza_id
       WHERE r.usuario_id = $1
         AND r.estado = 'activa'
         AND r.hora_inicio <= NOW() + INTERVAL '15 minutes'
         AND r.hora_fin    >= NOW()`,
      [u.id]
    );

    if (reserva.rows.length === 0) {
      await registrarEscaneo(u.id, null, 'sin_reserva');
      return res.status(200).json({
        resultado: 'sin_reserva',
        mensaje:   'No tienes reserva activa en este momento'
      });
    }

    const r = reserva.rows[0];

    await registrarEscaneo(u.id, r.id, 'acceso_ok');

    await pool.query(
      `INSERT INTO registros_acceso (reserva_id, plaza_id, tipo)
       VALUES ($1, $2, 'entrada')`,
      [r.id, r.plaza_id]
    );

    await pool.query(
      `UPDATE plazas SET estado = 'ocupada' WHERE id = $1`,
      [r.plaza_id]
    );

    const io = req.app.get('io');
    io.emit('plaza:actualizada', {
      plaza_id:    r.plaza_id,
      plaza_codigo: r.plaza_codigo,
      estado:      'ocupada'
    });

    res.json({
      resultado:    'acceso_ok',
      mensaje:      `Bienvenido ${u.nombre}`,
      plaza_codigo: r.plaza_codigo,
      hora_fin:     r.hora_fin
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

async function registrarEscaneo(usuario_id, reserva_id, resultado) {
  await pool.query(
    `INSERT INTO escaneos_qr (usuario_id, reserva_id, resultado)
     VALUES ($1, $2, $3)`,
    [usuario_id, reserva_id, resultado]
  );
}

module.exports = router;