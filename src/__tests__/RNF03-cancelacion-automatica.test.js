// ============================================================
// RNF03-cancelacion-automatica.test.js
// Cobertura: RNF03 (Cancelacion automatica por temporizador)
// El sistema cancela automaticamente una solicitud si el
// supervisor no confirma el ingreso dentro de 30 minutos.
// El contador se revierte y la plaza se libera.
// ============================================================

const request = require('supertest');
const app = require('../app');
const pool = require('../../db');
const { createTestUser, createTestVehicle, createTestSolicitud, authCookie } = require('./helpers');

describe('RNF03 - Cancelacion automatica por temporizador [RNF03]', () => {
  let token, usuario, vehiculo;

  beforeAll(async () => {
    // ARRANGE
    await pool.query(`UPDATE solicitudes_estacionamiento SET estado = 'finalizado' WHERE estado IN ('pendiente', 'ingresado')`);
    await pool.query(`UPDATE plazas SET estado = 'disponible' WHERE estado = 'ocupada'`);

    const data = await createTestUser({ verificado: true });
    token = data.token;
    usuario = data.usuario;
    vehiculo = await createTestVehicle(usuario.id);
  });

  test('solicitud expirada se cancela al consultar activa y revierte contador', async () => {
    // ARRANGE
    const inicialRes = await request(app).get('/api/estacionamientos/ocupacion').set(authCookie(token));
    const inicial = inicialRes.body.find((e) => e.id === 1);
    const autosInicial = Number(inicial.autos_ocupados);

    const fechaExpirada = new Date(Date.now() - 60 * 1000).toISOString();
    const solicitud = await createTestSolicitud(usuario.id, vehiculo.id, { hora_limite_ingreso: fechaExpirada, estado: 'pendiente' });

    const conSolicitudRes = await request(app).get('/api/estacionamientos/ocupacion').set(authCookie(token));
    const conSolicitud = conSolicitudRes.body.find((e) => e.id === 1);
    const autosConSolicitud = Number(conSolicitud.autos_ocupados);
    expect(autosConSolicitud).toBe(autosInicial + 1);

    // ACT
    const activaRes = await request(app).get('/api/solicitudes/activa').set(authCookie(token));

    // ASSERT
    expect(activaRes.status).toBe(404);
    expect(activaRes.body.error).toMatch(/activa/i);

    const verif = await pool.query('SELECT estado FROM solicitudes_estacionamiento WHERE id = $1', [solicitud.id]);

    const finalRes = await request(app).get('/api/estacionamientos/ocupacion').set(authCookie(token));
    const final = finalRes.body.find((e) => e.id === 1);
    expect(Number(final.autos_ocupados)).toBe(autosInicial);
  });

  test('solicitud activa no se cancela si hora_limite no ha vencido', async () => {
    // ARRANGE
    const fechaFutura = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    await createTestSolicitud(usuario.id, vehiculo.id, { hora_limite_ingreso: fechaFutura, estado: 'pendiente' });

    // ACT
    const activaRes = await request(app).get('/api/solicitudes/activa').set(authCookie(token));

    // ASSERT
    expect(activaRes.status).toBe(200);
    expect(activaRes.body).toHaveProperty('id');

    await request(app).post('/api/solicitudes/cancelar').set(authCookie(token));
  });

  test('contador nunca es negativo tras expiraciones multiples', async () => {
    // ARRANGE
    // Datos de BD ya preparados

    // ACT
    const actualRes = await request(app).get('/api/estacionamientos/ocupacion').set(authCookie(token));

    // ASSERT
    actualRes.body.forEach((c) => {
      expect(Number(c.autos_ocupados)).toBeGreaterThanOrEqual(0);
      expect(Number(c.motos_ocupadas ?? c.motos_ocupados)).toBeGreaterThanOrEqual(0);
    });
  });
});

afterAll(async () => {
  await pool.end();
});
