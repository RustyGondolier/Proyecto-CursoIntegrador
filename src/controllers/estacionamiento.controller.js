const logger = require('../config/logger');
const estacionamientoService = require('../services/estacionamiento.service');

async function ocupacion(req, res) {
  try {
    const data = await estacionamientoService.obtenerOcupacion();

    res.json(data);
  } catch (err) {
    logger.error('Error al obtener ocupación: ' + err.message, { stack: err.stack });

    res.status(500).json({
      error: 'Error interno',
    });
  }
}

async function listar(req, res) {
  try {
    const data = await estacionamientoService.listar();
    res.json(data);
  } catch (err) {
    logger.error('Error al listar estacionamientos: ' + err.message, { stack: err.stack });
    res.status(500).json({ error: 'Error interno' });
  }
}

async function listarPlazas(req, res) {
  try {
    const { id } = req.params;
    const data = await estacionamientoService.obtenerPlazas(id);
    res.json(data);
  } catch (err) {
    logger.error('Error al listar plazas: ' + err.message, {
      stack: err.stack,
      estacionamiento_id: req.params.id,
    });
    res.status(500).json({ error: 'Error interno' });
  }
}

module.exports = {
  ocupacion,
  listar,
  listarPlazas,
};
