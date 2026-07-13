const logger = require('../config/logger');
const estacionamientoService = require('../services/estacionamiento.service');

let ocupacionCache = [];

async function ocupacion(req, res) {
  try {
    if (req.query.force_error) {
      throw new Error('Error forzado para pruebas');
    }

    const data = await estacionamientoService.obtenerOcupacion();

    ocupacionCache = data;

    res.json(data);
  } catch (err) {
    logger.error('Error al obtener ocupación: ' + err.message, { stack: err.stack });

    res.json({
      datos: ocupacionCache,
      advertencia: 'No se pudo obtener la información actualizada. Mostrando datos anteriores.',
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
    res.status(err.status || 500).json({ error: err.message || 'Error interno' });
  }
}

async function obtenerMapa(req, res) {
  try {
    const { id } = req.params;
    const data = await estacionamientoService.obtenerMapa(id);
    res.json(data);
  } catch (err) {
    logger.error('Error al obtener mapa: ' + err.message, {
      stack: err.stack,
      estacionamiento_id: req.params.id,
    });
    res.status(err.status || 500).json({ error: err.message || 'Error interno' });
  }
}

module.exports = {
  ocupacion,
  listar,
  listarPlazas,
  obtenerMapa,
};
