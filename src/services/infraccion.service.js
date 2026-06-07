const pool = require('../../db');
const infraccionRepository = require('../repositories/infraccion.repository');

async function obtenerTipos() {
  return infraccionRepository.findTipos();
}

async function registrar({ placa, tipo_infraccion_id, descripcion, supervisor_id }) {
  if (!placa || !placa.trim()) {
    const error = new Error('La placa es requerida');
    error.status = 400;
    throw error;
  }

  if (!tipo_infraccion_id) {
    const error = new Error('El tipo de infracción es requerido');
    error.status = 400;
    throw error;
  }

  const vehiculo = await pool.query(
    `SELECT v.id, v.usuario_id, v.placa, v.modelo, v.tipo_vehiculo_id
     FROM vehiculos v
     WHERE v.placa = $1 AND v.activo = true
     LIMIT 1`,
    [placa.trim().toUpperCase()]
  );

  if (!vehiculo.rows[0]) {
    const error = new Error('Vehículo no encontrado. La placa no está registrada en el sistema.');
    error.status = 404;
    throw error;
  }

  const vehiculoData = vehiculo.rows[0];

  const solicitud = await pool.query(
    `SELECT id, plaza_asignada_id
     FROM solicitudes_estacionamiento
     WHERE usuario_id = $1 AND estado IN ('pendiente', 'ingresado')
     LIMIT 1`,
    [vehiculoData.usuario_id]
  );

  const solicitudData = solicitud.rows[0] || null;

  return infraccionRepository.create({
    usuario_id: vehiculoData.usuario_id,
    vehiculo_id: vehiculoData.id,
    plaza_id: solicitudData?.plaza_asignada_id ?? null,
    solicitud_id: solicitudData?.id ?? null,
    supervisor_id,
    tipo_infraccion_id,
    descripcion: descripcion ? descripcion.trim() : null
  });
}

async function listar(supervisor_id) {
  return infraccionRepository.findAll(supervisor_id || null);
}

async function obtenerPorId(id) {
  const infraccion = await infraccionRepository.findById(id);
  if (!infraccion) {
    const error = new Error('Infracción no encontrada');
    error.status = 404;
    throw error;
  }
  return infraccion;
}

module.exports = {
  obtenerTipos,
  registrar,
  listar,
  obtenerPorId
};
