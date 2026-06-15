// ============================================================
// setup.js — Setup GLOBAL para todos los tests
// Jest ejecuta este archivo UNA VEZ antes de todos los tests
// via globalSetup en jest.config.js
//
// Responsabilidades:
//   1. Cargar .env.test
//   2. Truncar todas las tablas
//   3. Insertar datos base (sedes, estacionamientos, plazas,
//      tipos de vehiculo, infraccion, reporte, notificacion, FAQ)
// ============================================================

require('dotenv').config({ path: '.env.test' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = async () => {
  try {
    console.log('[setup] Iniciando setup de base de datos de pruebas...');

    // ────────────────────────────────────────────────────────
    // 1. Truncar todas las tablas (orden inverso a dependencias)
    // ────────────────────────────────────────────────────────
    await pool.query(`
      TRUNCATE TABLE
        acciones_administrativas,
        notificaciones,
        reportes_incidencias,
        infracciones,
        verificaciones_ubicacion,
        solicitudes_estacionamiento,
        plazas,
        vehiculos,
        historial_accesos,
        usuarios,
        tipos_infraccion,
        tipos_vehiculo,
        tipos_plaza,
        bloques,
        estacionamientos,
        estados_reporte,
        tipos_notificacion,
        faq,
        faq_categorias,
        sedes
      RESTART IDENTITY CASCADE
    `);

    console.log('[setup] Tablas truncadas.');

    // ────────────────────────────────────────────────────────
    // 2. SEDES (RF06, RF07)
    // ────────────────────────────────────────────────────────
    await pool.query(`
      INSERT INTO sedes (nombre, ubicacion, latitud, longitud, radio_permitido_metros)
      VALUES ('Lima Sur', 'Campus UTP Lima Sur', -12.19395294, -76.97149420, 2500)
    `);

    // ────────────────────────────────────────────────────────
    // 3. ESTACIONAMIENTOS (RF06, RF07)
    // ────────────────────────────────────────────────────────
    await pool.query(`
      INSERT INTO estacionamientos (sede_id, nombre, ubicacion)
      VALUES
        (1, 'Estacionamiento 1', 'Sede Sur - Subterraneo'),
        (1, 'Estacionamiento 2', 'Sede Sur - Exterior')
    `);

    // ────────────────────────────────────────────────────────
    // 4. BLOQUES (RF06, RF07)
    // ────────────────────────────────────────────────────────
    await pool.query(`
      INSERT INTO bloques (estacionamiento_id, codigo, tipo_vehiculo, letra_bloque, capacidad)
      VALUES
        (1, 'E1-A', 'auto', 'A', 8),
        (1, 'E1-B', 'moto', 'B', 8),
        (2, 'E2-A', 'auto', 'A', 8),
        (2, 'E2-B', 'moto', 'B', 8)
    `);

    // ────────────────────────────────────────────────────────
    // 5. TIPOS DE PLAZA (RF06)
    // ────────────────────────────────────────────────────────
    await pool.query(`
      INSERT INTO tipos_plaza (codigo, descripcion)
      VALUES
        ('auto_estandar', 'Auto estandar'),
        ('auto_discapacidad', 'Auto discapacidad'),
        ('moto_estandar', 'Moto estandar')
    `);

    // ────────────────────────────────────────────────────────
    // 6. PLAZAS (RF06, RF07, RF10, RF11)
    // 8 plazas de auto en E1-A, 8 de moto en E1-B,
    // 8 de auto en E2-A, 8 de moto en E2-B
    // ────────────────────────────────────────────────────────
    await pool.query(`
      INSERT INTO plazas (codigo, bloque_id, numero_plaza, tipo_plaza_id, estado)
      SELECT 'E1-A-' || LPAD(n::text, 2, '0'), 1, n, 1, 'disponible'
      FROM generate_series(1, 8) AS n
      UNION ALL
      SELECT 'E1-B-' || LPAD(n::text, 2, '0'), 2, n, 3, 'disponible'
      FROM generate_series(1, 8) AS n
      UNION ALL
      SELECT 'E2-A-' || LPAD(n::text, 2, '0'), 3, n, 1, 'disponible'
      FROM generate_series(1, 8) AS n
      UNION ALL
      SELECT 'E2-B-' || LPAD(n::text, 2, '0'), 4, n, 3, 'disponible'
      FROM generate_series(1, 8) AS n
    `);

    // ────────────────────────────────────────────────────────
    // 7. TIPOS DE VEHICULO (RF01, RF05)
    // ────────────────────────────────────────────────────────
    await pool.query(`
      INSERT INTO tipos_vehiculo (codigo, descripcion, categoria_plaza)
      VALUES
        ('auto', 'Automovil', 'auto'),
        ('moto', 'Motocicleta', 'moto'),
        ('mototaxi', 'Mototaxi', 'auto')
    `);

    // ────────────────────────────────────────────────────────
    // 8. TIPOS DE INFRACCION (RF14)
    // ────────────────────────────────────────────────────────
    await pool.query(`
      INSERT INTO tipos_infraccion (codigo, descripcion)
      VALUES
        ('mal_estacionado', 'Vehiculo mal estacionado'),
        ('sin_identificador', 'Perdida de identificador'),
        ('plaza_incorrecta', 'Uso de plaza incorrecta'),
        ('obstruccion', 'Obstruccion de transito'),
        ('conduccion_riesgosa', 'Conduccion riesgosa')
    `);

    // ────────────────────────────────────────────────────────
    // 9. ESTADOS DE REPORTE (RF13, RF18, RF19)
    // ────────────────────────────────────────────────────────
    await pool.query(`
      INSERT INTO estados_reporte (codigo, descripcion)
      VALUES
        ('enviado', 'Enviado'),
        ('en_revision', 'En revision'),
        ('resuelto', 'Resuelto'),
        ('prioritario', 'Prioritario'),
        ('cancelado', 'Cancelado')
    `);

    // ────────────────────────────────────────────────────────
    // 10. TIPOS DE NOTIFICACION (RF13, RF19)
    // ────────────────────────────────────────────────────────
    await pool.query(`
      INSERT INTO tipos_notificacion (codigo, descripcion)
      VALUES
        ('solicitud', 'Solicitud de estacionamiento'),
        ('reporte', 'Reporte de incidencia'),
        ('infraccion', 'Infraccion'),
        ('sistema', 'Sistema'),
        ('soporte', 'Soporte')
    `);

    // ────────────────────────────────────────────────────────
    // 11. FAQ — CATEGORIAS (RF21)
    // ────────────────────────────────────────────────────────
    await pool.query(`
      INSERT INTO faq_categorias (nombre)
      VALUES ('General'), ('Solicitudes'), ('Incidencias'), ('Cuentas')
    `);

    // ────────────────────────────────────────────────────────
    // 12. FAQ — PREGUNTAS (RF21)
    // ────────────────────────────────────────────────────────
    await pool.query(`
      INSERT INTO faq (categoria_id, pregunta, respuesta)
      VALUES
        (1, 'Como solicito una plaza?',
         'Debes estar dentro del radio de 2.5 km de la universidad y tener una cuenta verificada.'),
        (2, 'Cuanto tiempo tengo para ingresar?',
         'Tienes 30 minutos desde que realizas la solicitud para que el supervisor confirme tu ingreso.'),
        (3, 'Como reporto una incidencia?',
         'Ve a la seccion de reportes desde el menu lateral y completa el formulario.'),
        (4, 'Por que mi cuenta esta suspendida?',
         'Contacta al administrador a traves de tu correo institucional para mas informacion.')
    `);

    console.log('[setup] Datos base insertados correctamente.');
  } catch (err) {
    console.error('[setup] Error durante el setup:', err);
    throw err;
  } finally {
    await pool.end();
  }
};
