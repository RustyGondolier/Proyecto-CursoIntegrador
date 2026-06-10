const pool = require('../../db');

async function getTiempoPermanencia(fechaInicio, fechaFin) {
  const result = await pool.query(
    `SELECT
       DATE(hora_ingreso) AS dia,
       ROUND(AVG(tiempo_permanencia_min)::numeric, 1) AS promedio_minutos
     FROM solicitudes_estacionamiento
     WHERE hora_ingreso IS NOT NULL
       AND hora_salida IS NOT NULL
       AND tiempo_permanencia_min IS NOT NULL
       AND hora_ingreso >= $1::timestamp
       AND hora_ingreso < ($2::timestamp + INTERVAL '1 day')
     GROUP BY DATE(hora_ingreso)
     ORDER BY dia`,
    [fechaInicio, fechaFin]
  );
  return result.rows;
}

async function getSolicitudesPorHora(fechaInicio, fechaFin) {
  const result = await pool.query(
    `SELECT
       EXTRACT(HOUR FROM hora_solicitud)::INTEGER AS hora,
       COUNT(*) AS total
     FROM solicitudes_estacionamiento
     WHERE hora_solicitud >= $1::timestamp
       AND hora_solicitud < ($2::timestamp + INTERVAL '1 day')
     GROUP BY hora
     ORDER BY hora`,
    [fechaInicio, fechaFin]
  );
  return result.rows;
}

async function getOcupacionPorDia(fechaInicio, fechaFin) {
  const result = await pool.query(
    `SELECT
       e.nombre AS estacionamiento,
       DATE(s.hora_ingreso) AS dia,
       COUNT(DISTINCT s.plaza_asignada_id) AS ocupadas
     FROM solicitudes_estacionamiento s
     JOIN plazas p ON p.id = s.plaza_asignada_id
     JOIN bloques b ON b.id = p.bloque_id
     JOIN estacionamientos e ON e.id = b.estacionamiento_id
     WHERE s.estado IN ('ingresado', 'finalizado')
       AND s.hora_ingreso >= $1::timestamp
       AND s.hora_ingreso < ($2::timestamp + INTERVAL '1 day')
     GROUP BY e.nombre, DATE(s.hora_ingreso)
     ORDER BY dia, e.nombre`,
    [fechaInicio, fechaFin]
  );
  return result.rows;
}

async function getOcupacionPorSemana(fechaInicio, fechaFin) {
  const result = await pool.query(
    `SELECT
       e.nombre AS estacionamiento,
       TO_CHAR(s.hora_ingreso, 'IYYY-IW') AS semana,
       COUNT(DISTINCT s.plaza_asignada_id) AS ocupadas
     FROM solicitudes_estacionamiento s
     JOIN plazas p ON p.id = s.plaza_asignada_id
     JOIN bloques b ON b.id = p.bloque_id
     JOIN estacionamientos e ON e.id = b.estacionamiento_id
     WHERE s.estado IN ('ingresado', 'finalizado')
       AND s.hora_ingreso >= $1::timestamp
       AND s.hora_ingreso < ($2::timestamp + INTERVAL '1 day')
     GROUP BY e.nombre, TO_CHAR(s.hora_ingreso, 'IYYY-IW')
     ORDER BY semana, e.nombre`,
    [fechaInicio, fechaFin]
  );
  return result.rows;
}

async function getOcupacionPorHora(fechaInicio, fechaFin) {
  const result = await pool.query(
    `SELECT
       e.nombre AS estacionamiento,
       EXTRACT(HOUR FROM s.hora_ingreso)::INTEGER AS hora,
       COUNT(DISTINCT s.plaza_asignada_id) AS ocupadas
     FROM solicitudes_estacionamiento s
     JOIN plazas p ON p.id = s.plaza_asignada_id
     JOIN bloques b ON b.id = p.bloque_id
     JOIN estacionamientos e ON e.id = b.estacionamiento_id
     WHERE s.estado IN ('ingresado', 'finalizado')
       AND s.hora_ingreso >= $1::timestamp
       AND s.hora_ingreso < ($2::timestamp + INTERVAL '1 day')
     GROUP BY e.nombre, EXTRACT(HOUR FROM s.hora_ingreso)
     ORDER BY hora, e.nombre`,
    [fechaInicio, fechaFin]
  );
  return result.rows;
}

async function getReportesInfo(fechaInicio, fechaFin) {
  const porEstado = await pool.query(
    `SELECT
       er.codigo,
       er.descripcion AS estado,
       COUNT(r.id) AS total
     FROM reportes_incidencias r
     JOIN estados_reporte er ON er.id = r.estado_id
     WHERE r.creado_en >= $1::timestamp
       AND r.creado_en < ($2::timestamp + INTERVAL '1 day')
     GROUP BY er.id, er.codigo, er.descripcion
     ORDER BY er.id`,
    [fechaInicio, fechaFin]
  );

  const porTipo = await pool.query(
    `SELECT
       ti.codigo,
       ti.descripcion AS tipo,
       COUNT(i.id) AS total
     FROM infracciones i
     JOIN tipos_infraccion ti ON ti.id = i.tipo_infraccion_id
     WHERE i.creado_en >= $1::timestamp
       AND i.creado_en < ($2::timestamp + INTERVAL '1 day')
     GROUP BY ti.id, ti.codigo, ti.descripcion
     ORDER BY total DESC`,
    [fechaInicio, fechaFin]
  );

  return {
    por_estado: porEstado.rows,
    por_tipo: porTipo.rows
  };
}

async function getSolicitudesExport(fechaInicio, fechaFin) {
  const result = await pool.query(
    `SELECT hora_solicitud
     FROM solicitudes_estacionamiento
     WHERE hora_solicitud >= $1::timestamp
       AND hora_solicitud < ($2::timestamp + INTERVAL '1 day')
     ORDER BY hora_solicitud`,
    [fechaInicio, fechaFin]
  );
  return result.rows;
}

async function getOcupacionExport(fechaInicio, fechaFin) {
  const result = await pool.query(
    `SELECT s.hora_ingreso, e.nombre AS estacionamiento
     FROM solicitudes_estacionamiento s
     JOIN plazas p ON p.id = s.plaza_asignada_id
     JOIN bloques b ON b.id = p.bloque_id
     JOIN estacionamientos e ON e.id = b.estacionamiento_id
     WHERE s.estado IN ('ingresado', 'finalizado')
       AND s.hora_ingreso >= $1::timestamp
       AND s.hora_ingreso < ($2::timestamp + INTERVAL '1 day')
     ORDER BY s.hora_ingreso`,
    [fechaInicio, fechaFin]
  );
  return result.rows;
}

async function getResumen(fechaInicio, fechaFin) {
  const result = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM solicitudes_estacionamiento
        WHERE creado_en >= $1::timestamp AND creado_en < ($2::timestamp + INTERVAL '1 day')) AS total_solicitudes,
       (SELECT COUNT(*) FROM solicitudes_estacionamiento
        WHERE hora_ingreso IS NOT NULL
          AND hora_ingreso >= $1::timestamp AND hora_ingreso < ($2::timestamp + INTERVAL '1 day')) AS total_ingresos,
       (SELECT COUNT(*) FROM infracciones
        WHERE creado_en >= $1::timestamp AND creado_en < ($2::timestamp + INTERVAL '1 day')) AS total_infracciones,
       (SELECT COUNT(*) FROM reportes_incidencias
        WHERE creado_en >= $1::timestamp AND creado_en < ($2::timestamp + INTERVAL '1 day')) AS total_reportes`,
    [fechaInicio, fechaFin]
  );
  return result.rows[0];
}

module.exports = {
  getTiempoPermanencia,
  getSolicitudesPorHora,
  getSolicitudesExport,
  getOcupacionPorDia,
  getOcupacionPorSemana,
  getOcupacionPorHora,
  getOcupacionExport,
  getReportesInfo,
  getResumen
};
