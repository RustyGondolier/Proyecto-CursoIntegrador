const express   = require('express');
const pool      = require('../db/index');
const { authJWT, soloSupervisor } = require('../middleware/authJWT');
const router    = express.Router();

// POST /api/reservas
// Crea una nueva reserva
router.post('/', authJWT, async (req, res) => {
  const { plaza_id, vehiculo_id, hora_inicio, hora_fin } = req.body;
  const usuario_id = req.usuario.id;

  if (!plaza_id || !vehiculo_id || !hora_inicio || !hora_fin) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    // 1. Verificar que el usuario no tenga ya una reserva activa
    const reservaActiva = await pool.query(
      `SELECT id FROM reservas
       WHERE usuario_id = $1 AND estado = 'activa'`,
      [usuario_id]
    );
    if (reservaActiva.rows.length > 0) {
      return res.status(409).json({ error: 'Ya tienes una reserva activa' });
    }

    // 2. Verificar que la plaza existe y está libre
    const plaza = await pool.query(
      `SELECT id, estado, tipo_plaza_id FROM plazas WHERE id = $1`,
      [plaza_id]
    );
    if (plaza.rows.length === 0) {
      return res.status(404).json({ error: 'Plaza no encontrada' });
    }
    if (plaza.rows[0].estado !== 'libre') {
      return res.status(409).json({ error: 'La plaza no está disponible' });
    }

    // 3. Verificar que el vehículo pertenece al usuario
    const vehiculo = await pool.query(
      `SELECT id, tipo_vehiculo_id FROM vehiculos
       WHERE id = $1 AND usuario_id = $2 AND activo = true`,
      [vehiculo_id, usuario_id]
    );
    if (vehiculo.rows.length === 0) {
      return res.status(404).json({ error: 'Vehículo no encontrado' });
    }

    // 4. Verificar que hora_inicio y hora_fin son válidos
    const inicio = new Date(hora_inicio);
    const fin    = new Date(hora_fin);
    const ahora  = new Date();

    if (inicio >= fin) {
      return res.status(400).json({ error: 'La hora de fin debe ser mayor a la de inicio' });
    }
    if (inicio < ahora) {
      return res.status(400).json({ error: 'No puedes reservar en el pasado' });
    }

    // 5. Verificar horario permitido (07:00 - 23:00)
    const horaInicio = inicio.getHours();
    const horaFin    = fin.getHours();
    if (horaInicio < 7 || horaFin > 23) {
      return res.status(400).json({ error: 'El horario permitido es de 07:00 a 23:00' });
    }

    // 6. Verificar que no hay otra reserva activa para esa plaza en ese horario
    const conflicto = await pool.query(
      `SELECT id FROM reservas
       WHERE plaza_id = $1
         AND estado = 'activa'
         AND hora_inicio < $3
         AND hora_fin    > $2`,
      [plaza_id, hora_inicio, hora_fin]
    );
    if (conflicto.rows.length > 0) {
      return res.status(409).json({ error: 'La plaza ya está reservada en ese horario' });
    }

    // 7. Crear la reserva y actualizar estado de la plaza
    const nuevaReserva = await pool.query(
      `INSERT INTO reservas
        (usuario_id, plaza_id, vehiculo_id, hora_inicio, hora_fin)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [usuario_id, plaza_id, vehiculo_id, hora_inicio, hora_fin]
    );

    await pool.query(
      `UPDATE plazas SET estado = 'reservada' WHERE id = $1`,
      [plaza_id]
    );

    // 8. Emitir evento WebSocket para actualizar el mapa en tiempo real
    const io = req.app.get('io');
    io.emit('plaza:actualizada', {
      plaza_id,
      estado: 'reservada'
    });

    res.status(201).json({
      mensaje:  'Reserva creada correctamente',
      reserva:  nuevaReserva.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/reservas/mis-reservas
// Devuelve las reservas del usuario autenticado
router.get('/mis-reservas', authJWT, async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT
        r.*,
        p.codigo   AS plaza_codigo,
        b.codigo   AS bloque_codigo,
        e.nombre   AS estacionamiento_nombre,
        v.placa,
        v.modelo
       FROM reservas r
       JOIN plazas          p ON p.id = r.plaza_id
       JOIN bloques         b ON b.id = p.bloque_id
       JOIN estacionamientos e ON e.id = b.estacionamiento_id
       JOIN vehiculos        v ON v.id = r.vehiculo_id
       WHERE r.usuario_id = $1
       ORDER BY r.creado_en DESC`,
      [req.usuario.id]
    );

    res.json(resultado.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/reservas/:id
// Cancela una reserva activa
router.delete('/:id', authJWT, async (req, res) => {
  try {
    // Verificar que la reserva existe y pertenece al usuario
    const reserva = await pool.query(
      `SELECT * FROM reservas WHERE id = $1 AND usuario_id = $2`,
      [req.params.id, req.usuario.id]
    );

    if (reserva.rows.length === 0) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    if (reserva.rows[0].estado !== 'activa') {
      return res.status(409).json({ error: 'Solo se pueden cancelar reservas activas' });
    }

    // Cancelar la reserva y liberar la plaza
    await pool.query(
      `UPDATE reservas SET estado = 'cancelada' WHERE id = $1`,
      [req.params.id]
    );

    await pool.query(
      `UPDATE plazas SET estado = 'libre' WHERE id = $1`,
      [reserva.rows[0].plaza_id]
    );

    // Emitir evento WebSocket
    const io = req.app.get('io');
    io.emit('plaza:actualizada', {
      plaza_id: reserva.rows[0].plaza_id,
      estado:   'libre'
    });

    res.json({ mensaje: 'Reserva cancelada correctamente' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;