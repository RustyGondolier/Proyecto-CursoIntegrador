const supervisorService = require('../services/supervisor.service');

async function asignarPlaza(req, res) {
  try {
    const { solicitud_id, plaza_id } = req.body;
    if (!solicitud_id || !plaza_id) {
      return res.status(400).json({ error: 'solicitud_id y plaza_id son requeridos' });
    }
    const data = await supervisorService.asignarPlaza(solicitud_id, plaza_id, req.usuario.id);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || 'Error interno' });
  }
}

module.exports = { asignarPlaza };
