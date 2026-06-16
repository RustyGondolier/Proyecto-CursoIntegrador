const logger = require('../config/logger');
const solicitudService = require('../services/solicitud.service');

async function crear(req, res) {
  try {
    const { estacionamiento_id, lat, lng } = req.body;

    if (!estacionamiento_id || typeof estacionamiento_id !== 'number') {
      return res
        .status(400)
        .json({ error: 'estacionamiento_id es requerido y debe ser un número' });
    }

    const data = await solicitudService.crear(req.usuario.id, estacionamiento_id, { lat, lng });
    res.status(201).json(data);
  } catch (err) {
    logger.error('Error al crear solicitud: ' + err.message, {
      stack: err.stack,
      usuario_id: req.usuario.id,
    });
    res.status(err.status || 500).json({ error: err.message || 'Error interno' });
  }
}

async function activa(req, res) {
  try {
    const data = await solicitudService.obtenerActiva(req.usuario.id);
    if (!data) {
      return res.status(404).json({ error: 'No tienes una solicitud activa' });
    }
    res.json(data);
  } catch (err) {
    logger.error('Error al obtener solicitud activa: ' + err.message, {
      stack: err.stack,
      usuario_id: req.usuario.id,
    });
    res.status(500).json({ error: 'Error interno' });
  }
}

async function cancelar(req, res) {
  try {
    const data = await solicitudService.cancelar(req.usuario.id);
    res.json(data);
  } catch (err) {
    logger.error('Error al cancelar solicitud: ' + err.message, {
      stack: err.stack,
      usuario_id: req.usuario.id,
    });
    res.status(err.status || 500).json({ error: err.message || 'Error interno' });
  }
}

async function getHistorial(req, res) {
  try {
    const data = await solicitudService.obtenerHistorial(req.usuario.id);
    res.json(data);
  } catch (err) {
    logger.error('Error al cargar historial: ' + err.message, {
      stack: err.stack,
      usuario_id: req.usuario.id,
    });
    res.status(500).json({ error: 'Error al cargar el historial' });
  }
}

module.exports = {
  crear,
  activa,
  cancelar,
  getHistorial,
};
