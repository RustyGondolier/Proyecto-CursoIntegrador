const reporteRepository = require('../repositories/reporte.repository');
const solicitudRepository = require('../repositories/solicitud.repository');

async function listar(usuario_id) {
  return reporteRepository.findByUserId(usuario_id);
}

async function crear({ usuario_id, estacionamiento_id, descripcion }) {
  if (!descripcion || descripcion.trim().length < 10) {
    const error = new Error('La descripción debe tener al menos 10 caracteres');
    error.status = 400;
    throw error;
  }

  const activa = await solicitudRepository.findActiveByUser(usuario_id);

  return reporteRepository.create({
    usuario_id,
    estacionamiento_id,
    solicitud_id: activa?.id ?? null,
    plaza_id: activa?.plaza_asignada_id ?? null,
    descripcion: descripcion.trim()
  });
}

module.exports = {
  listar,
  crear
};
