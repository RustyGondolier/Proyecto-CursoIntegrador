const logger = require('../config/logger');
const direccionService = require('../services/direccion.service');

async function dashboard(req, res) {
  try {
    let { fecha_inicio, fecha_fin } = req.query;

    if (!fecha_inicio) {
      fecha_inicio = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }
    if (!fecha_fin) {
      fecha_fin = new Date().toISOString().split('T')[0];
    }

    if (isNaN(Date.parse(fecha_inicio)) || isNaN(Date.parse(fecha_fin))) {
      return res.status(400).json({ error: 'Formato de fecha inválido. Use YYYY-MM-DD.' });
    }

    if (fecha_inicio > fecha_fin) {
      return res.status(400).json({ error: 'fecha_inicio no puede ser mayor que fecha_fin.' });
    }

    const data = await direccionService.getDashboard(fecha_inicio, fecha_fin);
    res.json(data);
  } catch (err) {
    logger.error('Error en dashboard direccion: ' + err.message, { stack: err.stack });
    res.status(500).json({ error: 'Error al cargar las métricas del dashboard' });
  }
}

module.exports = {
  dashboard
};
