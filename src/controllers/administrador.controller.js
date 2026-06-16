const logger = require('../config/logger');
const adminService = require('../services/administrador.service');

async function dashboard(req, res) {
  try {
    const data = await adminService.getDashboard();
    res.json(data);
  } catch (err) {
    logger.error('Error al cargar dashboard: ' + err.message, { stack: err.stack });
    res.status(500).json({ error: 'Error al cargar dashboard' });
  }
}

async function listarPendientes(req, res) {
  try {
    const data = await adminService.listarPendientes();
    res.json(data);
  } catch (err) {
    logger.error('Error al obtener pendientes: ' + err.message, { stack: err.stack });
    res.status(500).json({ error: 'Error al obtener pendientes' });
  }
}

async function listarUsuarios(req, res) {
  try {
    const { search, rol, estado, fecha_desde, fecha_hasta } = req.query;
    const data = await adminService.listarUsuarios({
      search,
      rol,
      estado,
      fecha_desde,
      fecha_hasta,
    });
    res.json(data);
  } catch (err) {
    logger.error('Error al obtener usuarios: ' + err.message, { stack: err.stack });
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
}

async function obtenerUsuario(req, res) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'El parámetro id es requerido' });
    }
    const data = await adminService.obtenerUsuario(Number(id));
    res.json(data);
  } catch (err) {
    logger.error('Error al obtener usuario: ' + err.message, {
      stack: err.stack,
      usuario_id: req.params.id,
    });
    res.status(err.status || 500).json({ error: err.message || 'Error interno' });
  }
}

async function aprobarPerfil(req, res) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'El parámetro id es requerido' });
    }
    const data = await adminService.aprobarPerfil(req.usuario.id, Number(id));
    res.json(data);
  } catch (err) {
    logger.error('Error al aprobar perfil: ' + err.message, {
      stack: err.stack,
      target_usuario_id: req.params.id,
    });
    res.status(err.status || 500).json({ error: err.message || 'Error interno' });
  }
}

async function suspenderCuenta(req, res) {
  try {
    const { id } = req.params;
    const { motivo } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'El parámetro id es requerido' });
    }
    const data = await adminService.suspenderCuenta(req.usuario.id, Number(id), motivo);
    res.json(data);
  } catch (err) {
    logger.error('Error al suspender cuenta: ' + err.message, {
      stack: err.stack,
      target_usuario_id: req.params.id,
    });
    res.status(err.status || 500).json({ error: err.message || 'Error interno' });
  }
}

async function reactivarCuenta(req, res) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'El parámetro id es requerido' });
    }
    const data = await adminService.reactivarCuenta(req.usuario.id, Number(id));
    res.json(data);
  } catch (err) {
    logger.error('Error al reactivar cuenta: ' + err.message, {
      stack: err.stack,
      target_usuario_id: req.params.id,
    });
    res.status(err.status || 500).json({ error: err.message || 'Error interno' });
  }
}

async function listarInfracciones(req, res) {
  try {
    const { tipo_id, usuario_search, fecha_desde, fecha_hasta, usuario_estado } = req.query;
    const data = await adminService.listarInfracciones({
      tipo_id: tipo_id ? Number(tipo_id) : undefined,
      usuario_search,
      fecha_desde,
      fecha_hasta,
      usuario_estado,
    });
    res.json(data);
  } catch (err) {
    logger.error('Error al obtener infracciones: ' + err.message, { stack: err.stack });
    res.status(500).json({ error: 'Error al obtener infracciones' });
  }
}

async function obtenerInfraccion(req, res) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'El parámetro id es requerido' });
    }
    const data = await adminService.obtenerInfraccion(Number(id));
    res.json(data);
  } catch (err) {
    logger.error('Error al obtener infracción: ' + err.message, {
      stack: err.stack,
      infraccion_id: req.params.id,
    });
    res.status(err.status || 500).json({ error: err.message || 'Error interno' });
  }
}

async function listarReportesPrioritarios(req, res) {
  try {
    const data = await adminService.listarReportesPrioritarios();
    res.json(data);
  } catch (err) {
    logger.error('Error al obtener reportes prioritarios: ' + err.message, { stack: err.stack });
    res.status(500).json({ error: 'Error al obtener reportes prioritarios' });
  }
}

async function resolverReporte(req, res) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'El parámetro id es requerido' });
    }
    const data = await adminService.resolverReporte(req.usuario.id, Number(id));
    res.json(data);
  } catch (err) {
    logger.error('Error al resolver reporte: ' + err.message, {
      stack: err.stack,
      reporte_id: req.params.id,
    });
    res.status(err.status || 500).json({ error: err.message || 'Error interno' });
  }
}

async function listarAcciones(req, res) {
  try {
    const data = await adminService.listarAcciones();
    res.json(data);
  } catch (err) {
    logger.error('Error al obtener acciones: ' + err.message, { stack: err.stack });
    res.status(500).json({ error: 'Error al obtener acciones' });
  }
}

module.exports = {
  dashboard,
  listarPendientes,
  listarUsuarios,
  obtenerUsuario,
  aprobarPerfil,
  suspenderCuenta,
  reactivarCuenta,
  listarInfracciones,
  obtenerInfraccion,
  listarReportesPrioritarios,
  resolverReporte,
  listarAcciones,
};
