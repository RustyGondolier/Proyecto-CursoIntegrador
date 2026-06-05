const reporteService = require('../services/reporte.service');

async function listar(req, res) {
  try {
    const reportes = await reporteService.listar(req.usuario.id);
    res.json(reportes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener los reportes' });
  }
}

async function crear(req, res) {
  try {
    const { estacionamiento_id, descripcion } = req.body;

    if (!estacionamiento_id || typeof estacionamiento_id !== 'number') {
      return res.status(400).json({ error: 'estacionamiento_id es requerido y debe ser un número' });
    }

    if (!descripcion || typeof descripcion !== 'string') {
      return res.status(400).json({ error: 'descripcion es requerida' });
    }

    const data = await reporteService.crear({
      usuario_id: req.usuario.id,
      estacionamiento_id,
      descripcion
    });

    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || 'Error al crear el reporte' });
  }
}

module.exports = {
  listar,
  crear
};
