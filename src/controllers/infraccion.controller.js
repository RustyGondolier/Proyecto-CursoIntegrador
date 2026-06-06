const infraccionService = require('../services/infraccion.service');

async function obtenerTipos(req, res) {
  try {
    const tipos = await infraccionService.obtenerTipos();
    res.json(tipos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener tipos de infracción' });
  }
}

async function registrar(req, res) {
  try {
    const { placa, tipo_infraccion_id, descripcion } = req.body;

    if (!placa || typeof placa !== 'string') {
      return res.status(400).json({ error: 'placa es requerida' });
    }

    if (!tipo_infraccion_id) {
      return res.status(400).json({ error: 'tipo_infraccion_id es requerido' });
    }

    const data = await infraccionService.registrar({
      placa,
      tipo_infraccion_id: Number(tipo_infraccion_id),
      descripcion,
      supervisor_id: req.usuario.id
    });

    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || 'Error al registrar la infracción' });
  }
}

async function listar(req, res) {
  try {
    const supervisor_id = req.query.mias === 'true' ? req.usuario.id : null;
    const infracciones = await infraccionService.listar(supervisor_id);
    res.json(infracciones);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener infracciones' });
  }
}

module.exports = {
  obtenerTipos,
  registrar,
  listar
};
