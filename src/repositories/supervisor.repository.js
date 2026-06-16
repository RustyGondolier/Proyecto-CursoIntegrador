const pool = require('../../db');
const { ESTADO_SOLICITUD, ESTADO_PLAZA, ESTADO_REPORTE_CODIGO } = require('../config/constants');

async function getDashboardData() {
  const result = await pool.query(
    `
    SELECT
      (SELECT COUNT(*) FROM solicitudes_estacionamiento WHERE estado = $1) AS pendientes_count,
      (SELECT COUNT(*) FROM solicitudes_estacionamiento WHERE hora_ingreso IS NOT NULL AND hora_ingreso::date = CURRENT_DATE) AS ingresos_hoy,
      (SELECT COUNT(*) FROM solicitudes_estacionamiento WHERE estado = $2 AND hora_salida::date = CURRENT_DATE) AS salidas_hoy,
      (SELECT COUNT(*) FROM reportes_incidencias r JOIN estados_reporte er ON er.id = r.estado_id WHERE er.codigo IN ($3, $4, $5)) AS incidencias_pendientes,
      (SELECT ROUND(
        (COUNT(*) FILTER (WHERE p.estado = $6)::DECIMAL / NULLIF(COUNT(*), 0)) * 100
      , 1) FROM plazas p) AS ocupacion_porcentaje
  `,
    [
      ESTADO_SOLICITUD.PENDIENTE,
      ESTADO_SOLICITUD.FINALIZADO,
      ESTADO_REPORTE_CODIGO.ENVIADO,
      ESTADO_REPORTE_CODIGO.EN_REVISION,
      ESTADO_REPORTE_CODIGO.PRIORITARIO,
      ESTADO_PLAZA.OCUPADA,
    ],
  );
  return result.rows[0];
}

async function getSolicitudesPendientes() {
  const result = await pool.query(
    `
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
    WHERE s.estado = $1
    ORDER BY s.hora_limite_ingreso ASC
  `,
    [ESTADO_SOLICITUD.PENDIENTE],
  );
  return result.rows;
}

async function getUltimosMovimientos(limite = 10) {
  const result = await pool.query(
    `
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
    WHERE s.estado IN ($2, $3)
    ORDER BY COALESCE(s.hora_ingreso, s.hora_salida) DESC
    LIMIT $1
  `,
    [limite, ESTADO_SOLICITUD.INGRESADO, ESTADO_SOLICITUD.FINALIZADO],
  );
  return result.rows;
}

async function buscarPorPlaca(placa) {
  const result = await pool.query(
    `
    SELECT
      u.id AS usuario_id,
      u.nombre AS usuario_nombre,
      u.codigo_universitario,
      u.rol,
      v.id AS vehiculo_id,
      v.placa,
      tv.descripcion AS tipo_vehiculo,
      tv.categoria_plaza,
      s.id AS solicitud_id,
      s.estado AS solicitud_estado,
      s.hora_ingreso,
      s.hora_limite_ingreso,
      EXTRACT(EPOCH FROM (s.hora_limite_ingreso - NOW()))::INTEGER AS tiempo_restante_segundos,
      e.id AS estacionamiento_id,
      e.nombre AS estacionamiento_nombre,
      p.codigo AS plaza_codigo
    FROM vehiculos v
    JOIN usuarios u ON u.id = v.usuario_id
    JOIN tipos_vehiculo tv ON tv.id = v.tipo_vehiculo_id
    LEFT JOIN solicitudes_estacionamiento s
      ON s.vehiculo_id = v.id AND s.estado IN ($2, $3)
    LEFT JOIN estacionamientos e ON e.id = s.estacionamiento_id
    LEFT JOIN plazas p ON p.id = s.plaza_asignada_id
    WHERE v.placa = $1 AND v.activo = true
    LIMIT 1
  `,
    [placa, ESTADO_SOLICITUD.PENDIENTE, ESTADO_SOLICITUD.INGRESADO],
  );
  return result.rows[0] || null;
}

async function plazasDisponibles(estacionamientoId, categoriaPlaza) {
  const result = await pool.query(
    `
    SELECT p.id, p.codigo, p.numero_plaza, p.estado,
           b.letra_bloque, b.codigo AS bloque_codigo, b.tipo_vehiculo,
           tp.codigo AS tipo_plaza, tp.descripcion AS tipo_plaza_descripcion
    FROM plazas p
    JOIN bloques b ON b.id = p.bloque_id
    JOIN tipos_plaza tp ON tp.id = p.tipo_plaza_id
    WHERE b.estacionamiento_id = $1
      AND b.tipo_vehiculo = $2
      AND p.estado = $3
    ORDER BY b.id, p.numero_plaza
  `,
    [estacionamientoId, categoriaPlaza, ESTADO_PLAZA.DISPONIBLE],
  );
  return result.rows;
}

async function buscarPorSolicitudId(solicitudId) {
  const result = await pool.query(
    `
    SELECT
      u.id AS usuario_id,
      u.nombre AS usuario_nombre,
      u.codigo_universitario,
      u.rol,
      v.id AS vehiculo_id,
      v.placa,
      tv.descripcion AS tipo_vehiculo,
      tv.categoria_plaza,
      s.id AS solicitud_id,
      s.estado AS solicitud_estado,
      s.hora_ingreso,
      s.hora_limite_ingreso,
      EXTRACT(EPOCH FROM (s.hora_limite_ingreso - NOW()))::INTEGER AS tiempo_restante_segundos,
      e.id AS estacionamiento_id,
      e.nombre AS estacionamiento_nombre,
      p.codigo AS plaza_codigo
    FROM solicitudes_estacionamiento s
    JOIN vehiculos v ON v.id = s.vehiculo_id
    JOIN usuarios u ON u.id = s.usuario_id
    JOIN tipos_vehiculo tv ON tv.id = v.tipo_vehiculo_id
    LEFT JOIN estacionamientos e ON e.id = s.estacionamiento_id
    LEFT JOIN plazas p ON p.id = s.plaza_asignada_id
    WHERE s.id = $1 AND s.estado IN ($2, $3)
    LIMIT 1
  `,
    [solicitudId, ESTADO_SOLICITUD.PENDIENTE, ESTADO_SOLICITUD.INGRESADO],
  );
  return result.rows[0] || null;
}

async function confirmarIngreso(solicitudId, plazaId, supervisorId, identificadorCodigo) {
  const result = await pool.query(
    `
    UPDATE solicitudes_estacionamiento
    SET estado = $5,
        plaza_asignada_id = $2,
        hora_ingreso = NOW(),
        supervisor_ingreso_id = $3,
        identificador_codigo = $4
    WHERE id = $1 AND estado = $6
    RETURNING *
  `,
    [
      solicitudId,
      plazaId,
      supervisorId,
      identificadorCodigo,
      ESTADO_SOLICITUD.INGRESADO,
      ESTADO_SOLICITUD.PENDIENTE,
    ],
  );
  return result.rows[0] || null;
}

async function registrarSalida(solicitudId, supervisorId) {
  const result = await pool.query(
    `
    UPDATE solicitudes_estacionamiento
    SET estado = $3,
        hora_salida = NOW(),
        supervisor_salida_id = $2,
        tiempo_permanencia_min = EXTRACT(EPOCH FROM (NOW() - hora_ingreso)) / 60
    WHERE id = $1 AND estado = $4
    RETURNING *
  `,
    [solicitudId, supervisorId, ESTADO_SOLICITUD.FINALIZADO, ESTADO_SOLICITUD.INGRESADO],
  );
  return result.rows[0] || null;
}

async function buscarPorIdentificador(estacionamientoId, tipoVehiculo, letraBloque, numeroPlaza) {
  const result = await pool.query(
    `
    SELECT
      s.id AS solicitud_id,
      s.estado AS solicitud_estado,
      s.hora_ingreso,
      s.hora_limite_ingreso,
      s.identificador_codigo,
      u.id AS usuario_id,
      u.nombre AS usuario_nombre,
      u.codigo_universitario,
      v.placa,
      tv.descripcion AS tipo_vehiculo,
      e.id AS estacionamiento_id,
      e.nombre AS estacionamiento_nombre,
      p.codigo AS plaza_codigo
    FROM solicitudes_estacionamiento s
    JOIN vehiculos v ON v.id = s.vehiculo_id
    JOIN usuarios u ON u.id = s.usuario_id
    JOIN tipos_vehiculo tv ON tv.id = v.tipo_vehiculo_id
    JOIN plazas p ON p.id = s.plaza_asignada_id
    JOIN bloques b ON b.id = p.bloque_id
    JOIN estacionamientos e ON e.id = b.estacionamiento_id
    WHERE s.estado = $5
      AND b.estacionamiento_id = $1
      AND b.tipo_vehiculo = $2
      AND b.letra_bloque = $3
      AND p.numero_plaza = $4
    LIMIT 1
  `,
    [estacionamientoId, tipoVehiculo, letraBloque, numeroPlaza, ESTADO_SOLICITUD.INGRESADO],
  );
  return result.rows[0] || null;
}

module.exports = {
  getDashboardData,
  getSolicitudesPendientes,
  getUltimosMovimientos,
  buscarPorPlaca,
  plazasDisponibles,
  confirmarIngreso,
  buscarPorSolicitudId,
  registrarSalida,
  buscarPorIdentificador,
};
