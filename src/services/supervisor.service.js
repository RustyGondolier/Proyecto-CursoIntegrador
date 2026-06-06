const pool = require('../../db');
const { getIO } = require('../config/socket');
const solicitudRepository = require('../repositories/solicitud.repository');
const plazaRepository = require('../repositories/plaza.repository');

async function asignarPlaza(solicitudId, plazaId, supervisorId) {
  const solicitud = await solicitudRepository.findById(solicitudId);
  if (!solicitud) {
    const error = new Error('Solicitud no encontrada');
    error.status = 404;
    throw error;
  }
  if (solicitud.estado !== 'pendiente') {
    const error = new Error('La solicitud no está pendiente');
    error.status = 400;
    throw error;
  }

  const plaza = await pool.query(
    `SELECT p.*, b.estacionamiento_id FROM plazas p JOIN bloques b ON b.id = p.bloque_id WHERE p.id = $1`,
    [plazaId]
  );
  if (!plaza.rows[0]) {
    const error = new Error('Plaza no encontrada');
    error.status = 404;
    throw error;
  }
  if (plaza.rows[0].estado !== 'disponible') {
    const error = new Error('La plaza no está disponible');
    error.status = 409;
    throw error;
  }

  await solicitudRepository.assignPlaza(solicitudId, plazaId);
  await plazaRepository.updateEstado(plazaId, 'ocupada');

  try { getIO().emit('ocupacion:updated'); } catch (_) {}

  try {
    getIO().to(`user:${solicitud.usuario_id}`).emit('plaza:asignada', {
      solicitud_id: solicitudId,
      plaza_id: plazaId,
      plaza_codigo: plaza.rows[0].codigo
    });
  } catch (_) {}

  return { mensaje: 'Plaza asignada exitosamente' };
}

module.exports = { asignarPlaza };
