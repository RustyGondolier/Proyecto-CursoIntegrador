const pool = require('../../db');

async function getDashboardData() {
  const result = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM solicitudes_estacionamiento WHERE estado = 'pendiente') AS pendientes_count,
      (SELECT COUNT(*) FROM solicitudes_estacionamiento WHERE estado = 'ingresado' AND hora_ingreso::date = CURRENT_DATE) AS ingresos_hoy,
      (SELECT COUNT(*) FROM solicitudes_estacionamiento WHERE estado = 'finalizado' AND hora_salida::date = CURRENT_DATE) AS salidas_hoy,
      (SELECT COUNT(*) FROM reportes_incidencias r JOIN estados_reporte er ON er.id = r.estado_id WHERE er.codigo IN ('enviado', 'en_revision', 'prioritario')) AS incidencias_pendientes,
      (SELECT ROUND(
        (COUNT(*) FILTER (WHERE p.estado = 'ocupada')::DECIMAL / NULLIF(COUNT(*), 0)) * 100
      , 1) FROM plazas p) AS ocupacion_porcentaje
  `);
  return result.rows[0];
}

async function getSolicitudesPendientes() {
  const result = await pool.query(`
    SELECT
      s.id,
      s.estado,
      s.hora_limite_ingreso,
      EXTRACT(EPOCH FROM (s.hora_limite_ingreso - NOW()))::INTEGER AS tiempo_restante_segundos,
      u.nombre AS usuario_nombre,
      u.codigo_universitario,
      v.placa,
      tv.descripcion AS tipo_vehiculo,
      e.nombre AS estacionamiento_nombre
    FROM solicitudes_estacionamiento s
    JOIN usuarios u ON u.id = s.usuario_id
    JOIN vehiculos v ON v.id = s.vehiculo_id
    JOIN tipos_vehiculo tv ON tv.id = v.tipo_vehiculo_id
    JOIN estacionamientos e ON e.id = s.estacionamiento_id
    WHERE s.estado = 'pendiente'
    ORDER BY s.hora_limite_ingreso ASC
  `);
  return result.rows;
}

async function getUltimosMovimientos(limite = 10) {
  const result = await pool.query(`
    SELECT
      s.id,
      s.estado,
      s.hora_ingreso,
      s.hora_salida,
      u.nombre AS usuario_nombre,
      v.placa,
      p.codigo AS plaza_codigo,
      e.nombre AS estacionamiento_nombre
    FROM solicitudes_estacionamiento s
    JOIN usuarios u ON u.id = s.usuario_id
    JOIN vehiculos v ON v.id = s.vehiculo_id
    LEFT JOIN plazas p ON p.id = s.plaza_asignada_id
    JOIN estacionamientos e ON e.id = s.estacionamiento_id
    WHERE s.estado IN ('ingresado', 'finalizado')
    ORDER BY COALESCE(s.hora_ingreso, s.hora_salida) DESC
    LIMIT $1
  `, [limite]);
  return result.rows;
}

module.exports = {
  getDashboardData,
  getSolicitudesPendientes,
  getUltimosMovimientos
};
