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

module.exports = {
  obtenerOcupacion,
  listar
};