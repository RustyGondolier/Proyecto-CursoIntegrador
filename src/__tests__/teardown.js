// ============================================================
// teardown.js — Teardown GLOBAL para todos los tests
// Jest ejecuta este archivo UNA VEZ despues de todos los tests
// via globalTeardown en jest.config.js
//
// Responsabilidad: Cerrar el pool de conexion a la BD
// ============================================================

const { Pool } = require('pg');

module.exports = async () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await pool.end();
    console.log('[teardown] Pool de BD cerrado.');
  } catch (err) {
    console.error('[teardown] Error al cerrar pool:', err.message);
  }
};
