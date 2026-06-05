const estacionamientoService =
  require(
    '../services/estacionamiento.service'
  );

async function ocupacion(
  req,
  res
){

  try{

    const data =
      await estacionamientoService
        .obtenerOcupacion();

    res.json(data);

  }catch(err){

    console.error(err);

    res.status(500).json({
      error:
        'Error interno'
    });

  }

}

async function listar(req, res) {
  try {
    const data = await estacionamientoService.listar();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
}

module.exports = {
  ocupacion,
  listar
};