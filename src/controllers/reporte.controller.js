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
    const { descripcion } = req.body;

    if (!descripcion || typeof descripcion !== 'string') {
      return res.status(400).json({ error: 'descripcion es requerida' });
    }

    const data = await reporteService.crear({
      usuario_id: req.usuario.id,
      descripcion
    });

    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || 'Error al crear el reporte' });
  }
}

async function listarTodos(req, res) {
  try {
    const { estado_id } = req.query;
    const reportes = await reporteService.listarTodos(estado_id ? Number(estado_id) : null);
    res.json(reportes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener los reportes' });
  }
}

async function marcarEnRevision(req, res) {
  try {
    const { id } = req.params;
    const data = await reporteService.marcarEnRevision({
      id: Number(id),
      supervisor_id: req.usuario.id
    });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || 'Error al actualizar el reporte' });
  }
}

async function obtener(req, res) {
  try {
    const { id } = req.params;
    const reporte = await reporteService.obtenerDetalle(Number(id));
    res.json(reporte);
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || 'Error al obtener el reporte' });
  }
}

async function responder(req, res) {
  try {
    const { id } = req.params;
    const { respuesta } = req.body;

    if (!respuesta || typeof respuesta !== 'string') {
      return res.status(400).json({ error: 'respuesta es requerida' });
    }

    const data = await reporteService.responder({
      id: Number(id),
      supervisor_id: req.usuario.id,
      respuesta
    });

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || 'Error al responder el reporte' });
  }
}

async function marcarPrioritario(req, res) {
  try {
    const { id } = req.params;
    const { razon } = req.body;

    if (!razon || typeof razon !== 'string') {
      return res.status(400).json({ error: 'razon es requerida' });
    }

    const data = await reporteService.marcarPrioritario({
      id: Number(id),
      supervisor_id: req.usuario.id,
      razon
    });

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || 'Error al marcar como prioritario' });
  }
}

module.exports = {
  listar,
  listarTodos,
  marcarEnRevision,
  obtener,
  crear,
  responder,
  marcarPrioritario
};
