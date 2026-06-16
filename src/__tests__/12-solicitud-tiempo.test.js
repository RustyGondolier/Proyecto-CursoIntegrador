// ============================================================
// 12-solicitud-tiempo.test.js
// Cobertura: RNF03 (Cancelacion automatica por temporizador)
// ============================================================

const request = require('supertest');
const app = require('../app');
const pool = require('../../db');
const {
  createTestUser, createTestVehicle, createTestSolicitud,
  authCookie
} = require('./helpers');

// ────────────────────────────────────────────────────────────
// RNF03 — Cancelacion automatica de solicitud por vencimiento
//         de temporizador (30 min)
// El sistema cancela automaticamente una solicitud si el
// supervisor no confirma el ingreso dentro de 30 minutos.
// El contador se revierte y la plaza se libera.
// ────────────────────────────────────────────────────────────
describe('RNF03 - Cancelacion automatica por temporizador [RNF03]', () => {
  let token, usuario, vehiculo;

  beforeAll(async () => {
    await pool.query(`UPDATE solicitudes_estacionamiento SET estado = 'finalizado' WHERE estado IN ('pendiente', 'ingresado')`);
    await pool.query(`UPDATE plazas SET estado = 'disponible' WHERE estado = 'ocupada'`);

    const data = await createTestUser({ verificado: true });
    token = data.token;
    usuario = data.usuario;
    vehiculo = await createTestVehicle(usuario.id);
  });

  // Escenario exitoso: solicitud con hora_limite pasada se cancela
  // automaticamente y el contador de plazas se revierte
  test('solicitud expirada se cancela al consultar activa y revierte contador', async () => {
    // Obtener contador inicial del estacionamiento 1
    const inicialRes = await request(app)
      .get('/api/estacionamientos/ocupacion')
      .set(authCookie(token));
    const inicial = inicialRes.body.find(e => e.id === 1);
    const autosInicial = Number(inicial.autos_ocupados);

    // Crear solicitud con hora_limite en el pasado (ya expirada)
    const fechaExpirada = new Date(Date.now() - 60 * 1000).toISOString();
    const solicitud = await createTestSolicitud(usuario.id, vehiculo.id, {
      hora_limite_ingreso: fechaExpirada,
      estado: 'pendiente'
    });

    // Verificar que el contador aumento al crear la solicitud
    const conSolicitudRes = await request(app)
      .get('/api/estacionamientos/ocupacion')
      .set(authCookie(token));
    const conSolicitud = conSolicitudRes.body.find(e => e.id === 1);
    const autosConSolicitud = Number(conSolicitud.autos_ocupados);
    expect(autosConSolicitud).toBe(autosInicial + 1);

    // Llamar a GET /api/solicitudes/activa para disparar expireOlderThan
    const activaRes = await request(app)
      .get('/api/solicitudes/activa')
      .set(authCookie(token));

    // La solicitud ya expiro, entonces devuelve 404
    expect(activaRes.status).toBe(404);
    expect(activaRes.body.error).toMatch(/activa/i);

    // Verificar en BD que la solicitud quedo como 'expirado'
    const verif = await pool.query(
      'SELECT estado FROM solicitudes_estacionamiento WHERE id = $1',
      [solicitud.id]
    );
    expect(verif.rows[0].estado).toBe('expirado');

    // Verificar que el contador se revirtio al valor inicial
    const finalRes = await request(app)
      .get('/api/estacionamientos/ocupacion')
      .set(authCookie(token));
    const final = finalRes.body.find(e => e.id === 1);
    expect(Number(final.autos_ocupados)).toBe(autosInicial);
  });

  // Escenario exitoso: solicitud con hora_limite futura sigue activa
  test('solicitud activa no se cancela si hora_limite no ha vencido', async () => {
    // Crear solicitud con hora_limite en el futuro
    const fechaFutura = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    await createTestSolicitud(usuario.id, vehiculo.id, {
      hora_limite_ingreso: fechaFutura,
      estado: 'pendiente'
    });

    // Llamar a activa - debe encontrar la solicitud activa
    const activaRes = await request(app)
      .get('/api/solicitudes/activa')
      .set(authCookie(token));
    expect(activaRes.status).toBe(200);
    expect(activaRes.body).toHaveProperty('id');

    // Cancelar la solicitud para limpiar
    await request(app)
      .post('/api/solicitudes/cancelar')
      .set(authCookie(token));
  });

  // Escenario de verificacion: contador de plazas no debe ser negativo
  test('contador nunca es negativo tras expiraciones multiples', async () => {
    // Obtener contador actual
    const actualRes = await request(app)
      .get('/api/estacionamientos/ocupacion')
      .set(authCookie(token));
    actualRes.body.forEach(c => {
      expect(Number(c.autos_ocupados)).toBeGreaterThanOrEqual(0);
      expect(Number(c.motos_ocupadas ?? c.motos_ocupados)).toBeGreaterThanOrEqual(0);
    });
  });

  afterAll(async () => {
    await pool.end();
  });
});
