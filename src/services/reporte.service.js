const reporteRepository = require('../repositories/reporte.repository');

async function listar(usuario_id) {
  return reporteRepository.findByUserId(usuario_id);
}

async function crear({ usuario_id, estacionamiento_id, descripcion }) {
  if (!descripcion || descripcion.trim().length < 10) {
    const error = new Error('La descripción debe tener al menos 10 caracteres');
    error.status = 400;
    throw error;
  }

  return reporteRepository.create({
    usuario_id,
    estacionamiento_id,
    descripcion: descripcion.trim()
  });
}

module.exports = {
  listar,
  crear
};
