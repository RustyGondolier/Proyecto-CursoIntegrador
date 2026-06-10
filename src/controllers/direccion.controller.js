const logger = require('../config/logger');
const direccionService = require('../services/direccion.service');
const { buildWorkbook } = require('../services/exportador.service');

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

async function exportarDashboard(req, res) {
  try {
    let { fecha_inicio, fecha_fin } = req.query;

    if (!fecha_inicio) {
      fecha_inicio = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }
    if (!fecha_fin) {
      fecha_fin = new Date().toISOString().split('T')[0];
    }

    const [data, solicitudesExport, ocupacionExport] = await Promise.all([
      direccionService.getDashboard(fecha_inicio, fecha_fin),
      direccionService.getSolicitudesExport(fecha_inicio, fecha_fin),
      direccionService.getOcupacionExport(fecha_inicio, fecha_fin)
    ]);

    const hojas = [
      {
        nombre: 'Resumen',
        columnas: [
          { header: 'Metrica', key: 'metrica' },
          { header: 'Cantidad', key: 'cantidad' }
        ],
        datos: [
          { metrica: 'Solicitudes', cantidad: data.resumen.total_solicitudes },
          { metrica: 'Ingresos', cantidad: data.resumen.total_ingresos },
          { metrica: 'Infracciones', cantidad: data.resumen.total_infracciones },
          { metrica: 'Reportes', cantidad: data.resumen.total_reportes }
        ]
      },
      {
        nombre: 'Permanencia',
        columnas: [
          { header: 'Dia', key: 'dia' },
          { header: 'Promedio (min)', key: 'promedio_minutos' }
        ],
        datos: data.permanencia.map(d => ({
          dia: new Date(d.dia).toLocaleDateString('es-PE'),
          promedio_minutos: d.promedio_minutos
        }))
      },
      {
        nombre: 'Solicitudes por hora',
        columnas: [
          { header: 'Fecha y hora', key: 'hora' }
        ],
        datos: solicitudesExport.map(d => ({
          hora: new Date(d.hora_solicitud).toLocaleString('es-PE')
        }))
      },
      {
        nombre: 'Ocupacion por dia',
        columnas: [
          { header: 'Estacionamiento', key: 'estacionamiento' },
          { header: 'Dia', key: 'dia' },
          { header: 'Ocupadas', key: 'ocupadas' }
        ],
        datos: data.ocupacion.por_dia.map(d => ({
          estacionamiento: d.estacionamiento,
          dia: new Date(d.dia).toLocaleDateString('es-PE'),
          ocupadas: d.ocupadas
        }))
      },
      {
        nombre: 'Ocupacion por semana',
        columnas: [
          { header: 'Estacionamiento', key: 'estacionamiento' },
          { header: 'Semana', key: 'semana' },
          { header: 'Ocupadas', key: 'ocupadas' }
        ],
        datos: data.ocupacion.por_semana
      },
      {
        nombre: 'Ocupacion por hora',
        columnas: [
          { header: 'Estacionamiento', key: 'estacionamiento' },
          { header: 'Fecha y hora de ingreso', key: 'hora' }
        ],
        datos: ocupacionExport.map(d => ({
          estacionamiento: d.estacionamiento,
          hora: new Date(d.hora_ingreso).toLocaleString('es-PE')
        }))
      },
      {
        nombre: 'Reportes por estado',
        columnas: [
          { header: 'Estado', key: 'estado' },
          { header: 'Total', key: 'total' }
        ],
        datos: data.reportes.por_estado
      },
      {
        nombre: 'Infracciones por tipo',
        columnas: [
          { header: 'Tipo', key: 'tipo' },
          { header: 'Total', key: 'total' }
        ],
        datos: data.reportes.por_tipo
      }
    ];

    const buffer = buildWorkbook(hojas);

    const filename = `dashboard-${fecha_inicio}-${fecha_fin}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    logger.error('Error al exportar dashboard: ' + err.message, { stack: err.stack });
    res.status(500).json({ error: 'Error al exportar el dashboard' });
  }
}

module.exports = {
  dashboard,
  exportarDashboard
};
