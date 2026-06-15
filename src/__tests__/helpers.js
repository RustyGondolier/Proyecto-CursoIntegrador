// ============================================================
// helpers.js — Utilidades compartidas para todos los tests
//
// Funciones:
//   createTestUser(overrides)     → { usuario, token }
//   createTestVehicle(usuarioId)  → vehiculo row
//   createTestSolicitud(...)      → solicitud row
//   createTestIngreso(...)        → solicitud ingresada
//   authCookie(token)             → { Cookie: 'token=...' }
//   seedPlazasOcupadas(cantidad)  → marca plazas como ocupadas
// ============================================================

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/jwt');

// Pool compartido para helpers que necesitan consultar BD directamente
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ────────────────────────────────────────────────────────────
// createTestUser
// RF01, RF02, RF03, RF05, RF07, RF08, RF15, RF16, RF19, RF20
// ────────────────────────────────────────────────────────────
async function createTestUser(overrides = {}) {
  const suffix = Date.now().toString(36) +
    Math.random().toString(36).slice(2, 6);

  const password_hash =
    await bcrypt.hash('password123', 4);

  const defaults = {
    codigo_universitario: `U${suffix}`,
    nombre: 'Usuario Test',
    password_hash,
    dni: '12345678',
    correo_institucional: `test${suffix}@utp.edu.pe`,
    nro_licencia: `L${suffix}`,
    licencia_fecha_vencimiento: '2030-12-31',
    rol: 'estudiante',
    estado_cuenta: 'activa',
    verificado: true,
    requiere_reverificacion: false,
    ...overrides
  };

  const keys = Object.keys(defaults);
  const values = Object.values(defaults);
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

  const result = await pool.query(
    `INSERT INTO usuarios (${keys.join(', ')})
     VALUES (${placeholders})
     RETURNING *`,
    values
  );

  const usuario = result.rows[0];
  const token = generateToken(usuario);

  return { usuario, token };
}

// ────────────────────────────────────────────────────────────
// createTestVehicle
// RF05, RF07
// ────────────────────────────────────────────────────────────
async function createTestVehicle(usuarioId, overrides = {}) {
  const suffix = Date.now().toString(36).toUpperCase().slice(-3);

  const data = {
    usuario_id: usuarioId,
    tipo_vehiculo_id: 'auto',
    placa: `ABC-${suffix}`,
    modelo: 'Sedan Test',
    activo: true,
    ...overrides
  };

  const result = await pool.query(
    `INSERT INTO vehiculos
       (usuario_id, tipo_vehiculo_id, placa, modelo, activo)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      data.usuario_id,
      data.tipo_vehiculo_id,
      data.placa,
      data.modelo,
      data.activo
    ]
  );

  return result.rows[0];
}

// ────────────────────────────────────────────────────────────
// createTestSolicitud
// RF07, RF08, RF10, RF11, RF19, RF20
// ────────────────────────────────────────────────────────────
async function createTestSolicitud(
  usuarioId,
  vehiculoId,
  overrides = {}
) {
  const hora_limite =
    new Date(Date.now() + 30 * 60 * 1000).toISOString();

  const defaults = {
    usuario_id: usuarioId,
    vehiculo_id: vehiculoId,
    estacionamiento_id: 1,
    hora_limite_ingreso: hora_limite,
    estado: 'pendiente',
    ...overrides
  };

  const result = await pool.query(
    `INSERT INTO solicitudes_estacionamiento
       (usuario_id, vehiculo_id, estacionamiento_id,
        hora_limite_ingreso, estado)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      defaults.usuario_id,
      defaults.vehiculo_id,
      defaults.estacionamiento_id,
      defaults.hora_limite_ingreso,
      defaults.estado
    ]
  );

  return result.rows[0];
}

// ────────────────────────────────────────────────────────────
// createTestIngreso
// Flujo completo: solicitud → asignar plaza → confirmar ingreso
// RF10, RF11, RF20
// ────────────────────────────────────────────────────────────
async function createTestIngreso(
  usuarioId,
  vehiculoId,
  supervisorId
) {
  // 1. Crear solicitud pendiente
  const solicitud =
    await createTestSolicitud(usuarioId, vehiculoId);

  // 2. Tomar una plaza disponible del estacionamiento 1
  const plaza = await pool.query(
    `SELECT id, codigo FROM plazas
     WHERE estado = 'disponible'
       AND bloque_id IN (
         SELECT id FROM bloques
         WHERE estacionamiento_id = $1
       )
     LIMIT 1`,
    [solicitud.estacionamiento_id]
  );

  if (plaza.rows.length === 0) {
    throw new Error(
      'No hay plazas disponibles para createTestIngreso'
    );
  }

  const plazaId = plaza.rows[0].id;

  // 3. Actualizar solicitud: asignar plaza, registrar ingreso
  await pool.query(
    `UPDATE solicitudes_estacionamiento
     SET plaza_asignada_id = $1,
         supervisor_ingreso_id = $2,
         hora_ingreso = NOW(),
         estado = 'ingresado',
         identificador_codigo = $3
     WHERE id = $4`,
    [
      plazaId,
      supervisorId,
      `ID-${solicitud.id}`,
      solicitud.id
    ]
  );

  // 4. Marcar plaza como ocupada
  await pool.query(
    `UPDATE plazas SET estado = 'ocupada' WHERE id = $1`,
    [plazaId]
  );

  return {
    ...solicitud,
    plaza_asignada_id: plazaId,
    plaza_codigo: plaza.rows[0].codigo,
    supervisor_ingreso_id: supervisorId,
    identificador_codigo: `ID-${solicitud.id}`
  };
}

// ────────────────────────────────────────────────────────────
// authCookie
// Devuelve headers de Cookie para peticiones autenticadas
// TODOS los tests de rutas protegidas
// ────────────────────────────────────────────────────────────
function authCookie(token) {
  return { Cookie: `token=${token}` };
}

// ────────────────────────────────────────────────────────────
// seedPlazasOcupadas
// Marca N plazas como ocupadas para simular estacionamiento
// RF06, RF07 (estacionamiento lleno)
// ────────────────────────────────────────────────────────────
async function seedPlazasOcupadas(
  estacionamientoId,
  cantidad
) {
  await pool.query(
    `UPDATE plazas SET estado = 'ocupada'
     WHERE id IN (
       SELECT p.id FROM plazas p
       JOIN bloques b ON b.id = p.bloque_id
       WHERE b.estacionamiento_id = $1
       LIMIT $2
     )`,
    [estacionamientoId, cantidad]
  );
}

// ────────────────────────────────────────────────────────────
// Cerrar pool interno al finalizar
// Se llama manualmente desde tests que usan helpers
// ────────────────────────────────────────────────────────────
async function closeHelpersPool() {
  await pool.end();
}

module.exports = {
  createTestUser,
  createTestVehicle,
  createTestSolicitud,
  createTestIngreso,
  authCookie,
  seedPlazasOcupadas,
  closeHelpersPool
};
