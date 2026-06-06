const estacionamientoRepository =
  require(
    '../repositories/estacionamiento.repository'
  );

async function obtenerOcupacion(){

  return await
    estacionamientoRepository
      .getOcupacion();

}

async function listar() {
  return estacionamientoRepository.getAll();
}

async function obtenerPlazas(estacionamientoId) {
  return estacionamientoRepository.getPlazasByEstacionamiento(estacionamientoId);
}

module.exports = {
  obtenerOcupacion,
  listar,
  obtenerPlazas
};