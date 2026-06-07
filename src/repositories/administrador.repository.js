const pool = require('../../db');

async function findPendientes() {
  const result = await pool.query(
    `SELECT
       u.id,
       u.codigo_universitario,
       u.nombre,
       u.rol,
       u.correo_institucional,
       u.creado_en,
       json_agg(
         json_build_object(
           'id', v.id,
           'tipo', tv.codigo,
           'placa', v.placa,
           'modelo', v.modelo
         )
       ) FILTER (WHERE v.id IS NOT NULL) AS vehiculos
     FROM usuarios u
     LEFT JOIN vehiculos v ON v.usuario_id = u.id
     LEFT JOIN tipos_vehiculo tv ON tv.id = v.tipo_vehiculo_id
     WHERE u.verificado = false
       AND u.estado_cuenta = 'activa'
       AND u.rol IN ('estudiante', 'docente')
     GROUP BY u.id
     ORDER BY u.creado_en DESC`
  );
  return result.rows;
}

async function findUserDetail(id) {
  const result = await pool.query(
    `SELECT
       u.id,
       u.codigo_universitario,
       u.nombre,
       u.rol,
       u.telefono,
       u.dni,
       u.fecha_nacimiento,
       u.correo_institucional,
       u.nro_licencia,
       u.licencia_fecha_vencimiento,
       u.codigo_conadis,
       u.conadis_verificado,
       u.estado_cuenta,
       u.motivo_suspension,
       u.verificado,
       u.requiere_reverificacion,
       u.verificado_por,
       u.verificado_en,
       u.creado_en,
       json_agg(
         json_build_object(
           'id', v.id,
           'tipo', tv.codigo,
           'placa', v.placa,
           'modelo', v.modelo,
           'activo', v.activo
         )
       ) FILTER (WHERE v.id IS NOT NULL) AS vehiculos
     FROM usuarios u
     LEFT JOIN vehiculos v ON v.usuario_id = u.id
     LEFT JOIN tipos_vehiculo tv ON tv.id = v.tipo_vehiculo_id
     WHERE u.id = $1
     GROUP BY u.id`,
    [id]
  );
  return result.rows[0] || null;
}

async function findAllUsuarios({ search, rol, estado, fecha_desde, fecha_hasta } = {}) {
  let query = `
    SELECT
      u.id,
      u.codigo_universitario,
      u.nombre,
      u.rol,
      u.estado_cuenta,
      u.verificado,
      u.creado_en
    FROM usuarios u
    WHERE u.rol IN ('estudiante', 'docente')
  `;
  const params = [];
  let idx = 1;

  if (search) {
    query += ` AND (u.nombre ILIKE $${idx} OR u.codigo_universitario ILIKE $${idx})`;
    params.push(`%${search}%`);
    idx++;
  }

  if (rol) {
    query += ` AND u.rol = $${idx}`;
    params.push(rol);
    idx++;
  }

  if (estado) {
    query += ` AND u.estado_cuenta = $${idx}`;
    params.push(estado);
    idx++;
  }

  if (fecha_desde) {
    query += ` AND u.creado_en >= $${idx}::timestamp`;
    params.push(fecha_desde);
    idx++;
  }

  if (fecha_hasta) {
    query += ` AND u.creado_en <= ($${idx}::timestamp + INTERVAL '1 day')`;
    params.push(fecha_hasta);
    idx++;
  }

  query += ` ORDER BY u.creado_en DESC`;

  const result = await pool.query(query, params);
  return result.rows;
}

async function findUserByPlaca(placa) {
  const result = await pool.query(
    `SELECT u.* FROM usuarios u
     JOIN vehiculos v ON v.usuario_id = u.id
     WHERE v.placa = $1
     LIMIT 1`,
    [placa]
  );
  return result.rows[0] || null;
}

async function updateVerificacion(userId, adminId) {
  const result = await pool.query(
    `UPDATE usuarios
     SET verificado = true,
         verificado_por = $2,
         verificado_en = NOW(),
         requiere_reverificacion = false
     WHERE id = $1
     RETURNING *`,
    [userId, adminId]
  );
  return result.rows[0] || null;
}

async function updateEstadoCuenta(userId, estado, motivo) {
  if (motivo !== undefined) {
    const result = await pool.query(
      `UPDATE usuarios
       SET estado_cuenta = $2,
           motivo_suspension = $3
       WHERE id = $1
       RETURNING *`,
      [userId, estado, motivo]
    );
    return result.rows[0] || null;
  }
  const result = await pool.query(
    `UPDATE usuarios
     SET estado_cuenta = $2,
         motivo_suspension = NULL
     WHERE id = $1
     RETURNING *`,
    [userId, estado]
  );
  return result.rows[0] || null;
}

async function registrarAccion({ administrador_id, usuario_afectado_id, tipo, descripcion }) {
  const result = await pool.query(
    `INSERT INTO acciones_administrativas
       (administrador_id, usuario_afectado_id, tipo, descripcion)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [administrador_id, usuario_afectado_id, tipo, descripcion]
  );
  return result.rows[0];
}

async function findAcciones(limit = 10) {
  const result = await pool.query(
    `SELECT
       aa.id,
       aa.tipo,
       aa.descripcion,
       aa.creado_en,
       admin.nombre AS administrador_nombre,
       admin.codigo_universitario AS administrador_codigo,
       u.nombre AS usuario_nombre,
       u.codigo_universitario AS usuario_codigo
     FROM acciones_administrativas aa
     JOIN usuarios admin ON admin.id = aa.administrador_id
     LEFT JOIN usuarios u ON u.id = aa.usuario_afectado_id
     ORDER BY aa.creado_en DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
}

async function findAllInfracciones({ tipo_id, usuario_search, fecha_desde, fecha_hasta } = {}) {
  let query = `
    SELECT
      i.id,
      i.descripcion,
      i.creado_en,
      ti.codigo AS tipo_codigo,
      ti.descripcion AS tipo_descripcion,
      u.id AS usuario_id,
      u.nombre AS usuario_nombre,
      u.codigo_universitario AS usuario_codigo,
      v.placa,
      p.codigo AS plaza_codigo,
      b.letra_bloque,
      p.numero_plaza,
      e.nombre AS estacionamiento_nombre
    FROM infracciones i
    JOIN tipos_infraccion ti ON ti.id = i.tipo_infraccion_id
    JOIN usuarios u ON u.id = i.usuario_id
    LEFT JOIN vehiculos v ON v.id = i.vehiculo_id
    LEFT JOIN plazas p ON p.id = i.plaza_id
    LEFT JOIN bloques b ON b.id = p.bloque_id
    LEFT JOIN estacionamientos e ON e.id = b.estacionamiento_id
    WHERE 1=1
  `;
  const params = [];
  let idx = 1;

  if (tipo_id) {
    query += ` AND i.tipo_infraccion_id = $${idx}`;
    params.push(tipo_id);
    idx++;
  }

  if (usuario_search) {
    query += ` AND (u.nombre ILIKE $${idx} OR u.codigo_universitario ILIKE $${idx} OR v.placa ILIKE $${idx})`;
    params.push(`%${usuario_search}%`);
    idx++;
  }

  if (fecha_desde) {
    query += ` AND i.creado_en >= $${idx}`;
    params.push(fecha_desde);
    idx++;
  }

  if (fecha_hasta) {
    query += ` AND i.creado_en <= $${idx}`;
    params.push(fecha_hasta);
    idx++;
  }

  query += ` ORDER BY i.creado_en DESC`;

  const result = await pool.query(query, params);
  return result.rows;
}

async function findInfraccionDetail(id) {
  const result = await pool.query(
    `SELECT
       i.id,
       i.descripcion,
       i.creado_en,
       ti.id AS tipo_infraccion_id,
       ti.codigo AS tipo_codigo,
       ti.descripcion AS tipo_descripcion,
       u.id AS usuario_id,
       u.nombre AS usuario_nombre,
       u.codigo_universitario AS usuario_codigo,
       u.correo_institucional AS usuario_correo,
       u.estado_cuenta AS usuario_estado,
       v.placa,
       v.modelo,
       p.codigo AS plaza_codigo,
       b.letra_bloque,
       p.numero_plaza,
       e.nombre AS estacionamiento_nombre,
       s.nombre AS supervisor_nombre
     FROM infracciones i
     JOIN tipos_infraccion ti ON ti.id = i.tipo_infraccion_id
     JOIN usuarios u ON u.id = i.usuario_id
     LEFT JOIN vehiculos v ON v.id = i.vehiculo_id
     LEFT JOIN plazas p ON p.id = i.plaza_id
     LEFT JOIN bloques b ON b.id = p.bloque_id
     LEFT JOIN estacionamientos e ON e.id = b.estacionamiento_id
     JOIN usuarios s ON s.id = i.supervisor_id
     WHERE i.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

async function findReportesPrioritarios() {
  const result = await pool.query(
    `SELECT
       r.id,
       r.descripcion,
       r.razon_prioridad,
       r.creado_en,
       r.actualizado_en,
       e.nombre AS estacionamiento_nombre,
       u.nombre AS usuario_nombre,
       u.codigo_universitario AS usuario_codigo,
       u.correo_institucional AS usuario_correo,
       u.rol AS usuario_rol,
       p.codigo AS plaza_codigo,
       b.letra_bloque,
       p.numero_plaza,
       sup.nombre AS supervisor_nombre,
       er.codigo AS estado_codigo,
       er.descripcion AS estado
     FROM reportes_incidencias r
     JOIN estados_reporte er ON er.id = r.estado_id
     LEFT JOIN estacionamientos e ON e.id = r.estacionamiento_id
     LEFT JOIN usuarios u ON u.id = r.usuario_id
     LEFT JOIN plazas p ON p.id = r.plaza_id
     LEFT JOIN bloques b ON b.id = p.bloque_id
     LEFT JOIN usuarios sup ON sup.id = r.supervisor_id
     WHERE r.es_prioritario = true
       AND r.estado_id != 3
     ORDER BY r.creado_en DESC`
  );
  return result.rows;
}

async function resolverReporte(reporteId) {
  const result = await pool.query(
    `UPDATE reportes_incidencias
     SET estado_id = 3,
         actualizado_en = NOW()
     WHERE id = $1 AND es_prioritario = true
     RETURNING *`,
    [reporteId]
  );
  return result.rows[0] || null;
}

async function getDashboardData() {
  const result = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM usuarios WHERE verificado = false AND estado_cuenta = 'activa' AND rol IN ('estudiante', 'docente')) AS pendientes_count,
      (SELECT COUNT(*) FROM usuarios WHERE estado_cuenta = 'suspendida') AS suspendidas_count,
      (SELECT COUNT(*) FROM reportes_incidencias WHERE es_prioritario = true AND estado_id != 3) AS prioritarios_count,
      (SELECT COUNT(*) FROM infracciones WHERE DATE_TRUNC('month', creado_en) = DATE_TRUNC('month', NOW())) AS infracciones_mes
  `);
  return result.rows[0];
}

module.exports = {
  findPendientes,
  findUserDetail,
  findAllUsuarios,
  findUserByPlaca,
  updateVerificacion,
  updateEstadoCuenta,
  registrarAccion,
  findAcciones,
  findAllInfracciones,
  findInfraccionDetail,
  findReportesPrioritarios,
  resolverReporte,
  getDashboardData
};
