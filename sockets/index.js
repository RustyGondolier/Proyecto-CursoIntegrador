const pool = require('../db/index');

function initSockets(io) {
  io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);

    // Evento enviado por el ESP32 cuando detecta un cambio en una plaza
    // Payload: { plaza_codigo: 'E1-A-C-03', ocupado: true/false }
    socket.on('sensor:lectura', async (data) => {
      const { plaza_codigo, ocupado, valor_raw } = data;

      try {
        // Buscar la plaza y su reserva activa
        const plaza = await pool.query(
          `SELECT p.id, p.estado, r.id AS reserva_id
           FROM plazas p
           LEFT JOIN reservas r
             ON r.plaza_id = p.id AND r.estado = 'activa'
           WHERE p.codigo = $1`,
          [plaza_codigo]
        );

        if (plaza.rows.length === 0) return;

        const p           = plaza.rows[0];
        let   nuevoEstado = p.estado;

        if (ocupado && !p.reserva_id) {
          // Auto detectado SIN reserva → alerta
          nuevoEstado = 'ocupada_sin_reserva';

          // Notificar al supervisor con alerta especial
          io.emit('plaza:alerta', {
            plaza_codigo,
            mensaje: `Plaza ${plaza_codigo} ocupada sin reserva`
          });

        } else if (ocupado && p.reserva_id) {
          // Auto detectado CON reserva → todo correcto
          nuevoEstado = 'ocupada';

        } else if (!ocupado) {
          // Plaza vacía → verificar si tenía reserva activa
          if (p.reserva_id) {
            // El auto se fue antes de que termine la reserva
            await pool.query(
              `UPDATE reservas SET estado = 'completada' WHERE id = $1`,
              [p.reserva_id]
            );
          }
          nuevoEstado = 'libre';
        }

        // Actualizar estado en BD solo si cambió
        if (nuevoEstado !== p.estado) {
          await pool.query(
            `UPDATE plazas SET estado = $1 WHERE id = $2`,
            [nuevoEstado, p.id]
          );
        }

        // Guardar lectura del sensor
        const sensor = await pool.query(
          `SELECT id FROM sensores WHERE plaza_id = $1`,
          [p.id]
        );
        if (sensor.rows.length > 0) {
          await pool.query(
            `INSERT INTO lecturas_sensor (sensor_id, valor_raw, ocupado)
             VALUES ($1, $2, $3)`,
            [sensor.rows[0].id, valor_raw || 0, ocupado]
          );
        }

        // Emitir actualización a todos los clientes
        io.emit('plaza:actualizada', {
          plaza_codigo,
          plaza_id:  p.id,
          estado:    nuevoEstado
        });

      } catch (err) {
        console.error('Error en sensor:lectura:', err.message);
      }
    });

    socket.on('disconnect', () => {
      console.log('Cliente desconectado:', socket.id);
    });
  });
}

module.exports = initSockets;