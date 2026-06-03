const estacionamientoRepository =
  require(
    '../repositories/estacionamiento.repository'
  );

async function obtenerOcupacion(){

  return await
    estacionamientoRepository
      .getOcupacion();

}

module.exports = {
  obtenerOcupacion
};