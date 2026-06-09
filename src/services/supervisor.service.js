const pool = require('../../db');
const { getIO } = require('../config/socket');
const solicitudRepository = require('../repositories/solicitud.repository');
const plazaRepository = require('../repositories/plaza.repository');
const supervisorRepository = require('../repositories/supervisor.repository');

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

async function getDashboard() {
  const [dashboard, pendientesList, movimientos] = await Promise.all([
    supervisorRepository.getDashboardData(),
    supervisorRepository.getSolicitudesPendientes(),
    supervisorRepository.getUltimosMovimientos()
  ]);
  return {
    pendientes_count: dashboard.pendientes_count,
    ingresos_hoy: dashboard.ingresos_hoy,
    salidas_hoy: dashboard.salidas_hoy,
    incidencias_pendientes: dashboard.incidencias_pendientes,
    ocupacion_porcentaje: dashboard.ocupacion_porcentaje,
    pendientes: pendientesList,
    movimientos
  };
}

function normalizarPlaca(placa) {
  const limpia = placa.trim().toUpperCase().replace(/[\s-]/g, '');
  const matchAuto = limpia.match(/^([A-Z]{3})(\d{3})$/);
  if (matchAuto) return `${matchAuto[1]}-${matchAuto[2]}`;
  const matchMoto = limpia.match(/^([A-Z]{2})(\d{4})$/);
  if (matchMoto) return `${matchMoto[1]}-${matchMoto[2]}`;
  return limpia;
}

async function buscarPorPlaca(placa) {
  const placaNormalizada = normalizarPlaca(placa);
  const resultado = await supervisorRepository.buscarPorPlaca(placaNormalizada);
  if (!resultado) {
    const error = new Error('Vehículo no encontrado');
    error.status = 404;
    throw error;
  }
  return resultado;
}

async function buscarPorSolicitudId(solicitudId) {
  const resultado = await supervisorRepository.buscarPorSolicitudId(solicitudId);
  if (!resultado) {
    const error = new Error('Solicitud no encontrada o ya no está pendiente');
    error.status = 404;
    throw error;
  }
  return resultado;
}

async function obtenerPlazasDisponibles(estacionamientoId, categoriaPlaza) {
  return await supervisorRepository.plazasDisponibles(estacionamientoId, categoriaPlaza);
}

async function confirmarIngreso(solicitudId, plazaId, supervisorId) {
  const plaza = await pool.query(
    `SELECT p.*, p.numero_plaza, b.letra_bloque, b.estacionamiento_id FROM plazas p JOIN bloques b ON b.id = p.bloque_id WHERE p.id = $1`,
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

  const identificador = `${plaza.rows[0].letra_bloque}-${String(plaza.rows[0].numero_plaza).padStart(2, '0')}`;
  const solicitud = await supervisorRepository.confirmarIngreso(solicitudId, plazaId, supervisorId, identificador);
  if (!solicitud) {
    const error = new Error('Solicitud no encontrada o ya no está pendiente');
    error.status = 404;
    throw error;
  }

  await plazaRepository.updateEstado(plazaId, 'ocupada');

  try { getIO().emit('ocupacion:updated'); } catch (_) {}

  try {
    getIO().to(`user:${solicitud.usuario_id}`).emit('plaza:asignada', {
      solicitud_id: solicitudId,
      plaza_id: plazaId,
      plaza_codigo: plaza.rows[0].codigo
    });
  } catch (_) {}

  return {
    mensaje: 'Ingreso confirmado exitosamente',
    solicitud
  };
}

async function registrarSalida(solicitudId, supervisorId) {
  const solicitud = await solicitudRepository.findById(solicitudId);
  if (!solicitud) {
    const error = new Error('Solicitud no encontrada');
    error.status = 404;
    throw error;
  }
  if (solicitud.estado !== 'ingresado') {
    const error = new Error('La solicitud no tiene un ingreso confirmado');
    error.status = 400;
    throw error;
  }

  const updated = await supervisorRepository.registrarSalida(solicitudId, supervisorId);
  if (!updated) {
    const error = new Error('Error al registrar la salida');
    error.status = 500;
    throw error;
  }

  if (solicitud.plaza_asignada_id) {
    await plazaRepository.updateEstado(solicitud.plaza_asignada_id, 'disponible');
  }

  try { getIO().emit('ocupacion:updated'); } catch (_) {}

  try {
    getIO().to(`user:${solicitud.usuario_id}`).emit('salida:registrada', {
      solicitud_id: solicitudId,
      mensaje: 'Su salida ha sido registrada'
    });
  } catch (_) {}

  return {
    mensaje: 'Salida registrada exitosamente',
    solicitud: updated
  };
}

async function buscarPorIdentificador(estacionamientoId, tipoVehiculo, codigo) {
  const match = codigo.match(/^([A-Z])-?(\d+)$/i);
  if (!match) {
    const error = new Error('Formato de código inválido. Use: A-12');
    error.status = 400;
    throw error;
  }
  const letraBloque = match[1].toUpperCase();
  const numeroPlaza = parseInt(match[2], 10);

  const resultado = await supervisorRepository.buscarPorIdentificador(
    estacionamientoId, tipoVehiculo, letraBloque, numeroPlaza
  );
  if (!resultado) {
    const error = new Error('No se encontró ninguna solicitud activa con ese código');
    error.status = 404;
    throw error;
  }
  return resultado;
}

module.exports = { asignarPlaza, getDashboard, buscarPorPlaca, buscarPorSolicitudId, obtenerPlazasDisponibles, confirmarIngreso, registrarSalida, buscarPorIdentificador };
