const logger = require('../config/logger');
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
    logger.error('Error asignarPlaza: ' + err.message, {
      stack: err.stack,
      solicitud_id: req.body.solicitud_id,
    });
    res.status(err.status || 500).json({ error: err.message || 'Error interno' });
  }
}

async function dashboard(req, res) {
  try {
    const data = await supervisorService.getDashboard();
    res.json(data);
  } catch (err) {
    logger.error('Error al cargar dashboard: ' + err.message, { stack: err.stack });
    res.status(500).json({ error: 'Error al cargar dashboard' });
  }
}

async function buscar(req, res) {
  try {
    const { placa } = req.query;
    if (!placa) {
      return res.status(400).json({ error: 'El parámetro placa es requerido' });
    }
    const data = await supervisorService.buscarPorPlaca(placa);
    res.json(data);
  } catch (err) {
    logger.error('Error al buscar por placa: ' + err.message, {
      stack: err.stack,
      placa: req.query.placa,
    });
    res.status(err.status || 500).json({ error: err.message || 'Error interno' });
  }
}

async function buscarSolicitud(req, res) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'El parámetro id es requerido' });
    }
    const data = await supervisorService.buscarPorSolicitudId(id);
    res.json(data);
  } catch (err) {
    logger.error('Error al buscar solicitud: ' + err.message, {
      stack: err.stack,
      solicitud_id: req.params.id,
    });
    res.status(err.status || 500).json({ error: err.message || 'Error interno' });
  }
}

async function plazasDisponibles(req, res) {
  try {
    const { estacionamiento_id, categoria_plaza } = req.query;
    if (!estacionamiento_id || !categoria_plaza) {
      return res.status(400).json({ error: 'estacionamiento_id y categoria_plaza son requeridos' });
    }
    const data = await supervisorService.obtenerPlazasDisponibles(
      estacionamiento_id,
      categoria_plaza,
    );
    res.json(data);
  } catch (err) {
    logger.error('Error al obtener plazas: ' + err.message, { stack: err.stack });
    res.status(500).json({ error: 'Error al obtener plazas' });
  }
}

async function confirmarIngreso(req, res) {
  try {
    const { solicitud_id, plaza_id } = req.body;
    if (!solicitud_id || !plaza_id) {
      return res.status(400).json({ error: 'solicitud_id y plaza_id son requeridos' });
    }
    const data = await supervisorService.confirmarIngreso(solicitud_id, plaza_id, req.usuario.id);
    res.json(data);
  } catch (err) {
    logger.error('Error confirmarIngreso: ' + err.message, {
      stack: err.stack,
      solicitud_id: req.body.solicitud_id,
    });
    res.status(err.status || 500).json({ error: err.message || 'Error interno' });
  }
}

async function registrarSalida(req, res) {
  try {
    const { solicitud_id } = req.body;
    if (!solicitud_id) {
      return res.status(400).json({ error: 'solicitud_id es requerido' });
    }
    const data = await supervisorService.registrarSalida(solicitud_id, req.usuario.id);
    res.json(data);
  } catch (err) {
    logger.error('Error registrarSalida: ' + err.message, {
      stack: err.stack,
      solicitud_id: req.body.solicitud_id,
    });
    res.status(err.status || 500).json({ error: err.message || 'Error interno' });
  }
}

async function buscarIdentificador(req, res) {
  try {
    const { estacionamiento_id, tipo_vehiculo, codigo } = req.query;
    if (!estacionamiento_id || !tipo_vehiculo || !codigo) {
      return res
        .status(400)
        .json({ error: 'estacionamiento_id, tipo_vehiculo y codigo son requeridos' });
    }
    const data = await supervisorService.buscarPorIdentificador(
      estacionamiento_id,
      tipo_vehiculo,
      codigo,
    );
    res.json(data);
  } catch (err) {
    logger.error('Error buscarIdentificador: ' + err.message, { stack: err.stack });
    res.status(err.status || 500).json({ error: err.message || 'Error interno' });
  }
}

module.exports = {
  asignarPlaza,
  dashboard,
  buscar,
  buscarSolicitud,
  plazasDisponibles,
  confirmarIngreso,
  registrarSalida,
  buscarIdentificador,
};
