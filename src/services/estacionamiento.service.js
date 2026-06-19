const estacionamientoRepository = require('../repositories/estacionamiento.repository');

async function obtenerOcupacion() {
  return await estacionamientoRepository.getOcupacion();
}

async function listar() {
  return estacionamientoRepository.getAll();
}

async function obtenerPlazas(estacionamientoId) {
  const estacionamiento = await estacionamientoRepository.getById(estacionamientoId);
  if (!estacionamiento) {
    const err = new Error('Estacionamiento no encontrado');
    err.status = 404;
    throw err;
  }
  return estacionamientoRepository.getPlazasByEstacionamiento(estacionamientoId);
}

async function obtenerMapa(estacionamientoId) {
  const estacionamiento = await estacionamientoRepository.getById(estacionamientoId);
  if (!estacionamiento) {
    const err = new Error('Estacionamiento no encontrado');
    err.status = 404;
    throw err;
  }
  const plazas = await estacionamientoRepository.getPlazasByEstacionamiento(estacionamientoId);
  return {
    svg_url: `/img/mapas/estacionamiento_${estacionamientoId}.svg`,
    plazas,
    capa_parking: `/img/mapas/parking_${estacionamientoId}.svg`,
    capa_rutas: `/img/mapas/rutas_${estacionamientoId}.svg`,
  };
}

module.exports = {
  obtenerOcupacion,
  listar,
  obtenerPlazas,
  obtenerMapa,
};
