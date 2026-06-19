// ============================================================
// RF11-salida.test.js
// Cobertura: RF11 (Registro de salida del vehiculo)
// CUS11: El supervisor registra la salida fisica. La solicitud
//        pasa a "finalizado". La plaza se libera.
// ============================================================

const request = require('supertest');
const app = require('../app');
const pool = require('../../db');
const { createTestUser, createTestVehicle, createTestSolicitud, createTestIngreso, authCookie } = require('./helpers');

describe('RF11 - Registro de salida [CUS11]', () => {
  let supToken, supervisor;
  let userToken, usuario, vehiculo;

  beforeAll(async () => {
    // ARRANGE
    const sup = await createTestUser({ rol: 'supervisor', codigo_universitario: `U${Date.now()}SUP2` });
    supToken = sup.token;
    supervisor = sup.usuario;

    const user = await createTestUser({ verificado: true, codigo_universitario: `U${Date.now()}USR2` });
    userToken = user.token;
    usuario = user.usuario;
    vehiculo = await createTestVehicle(usuario.id);
  });

  test('CP03: error al registrar salida con datos invalidos (E2)', async () => {
    // ARRANGE
    const datos = {};

    // ACT
    const res = await request(app).post('/api/supervisor/registrar-salida').set(authCookie(supToken)).send(datos);

    // ASSERT
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test('registrar salida exitosamente', async () => {
    // ARRANGE
    const ingreso = await createTestIngreso(usuario.id, vehiculo.id, supervisor.id);

    // ACT
    const res = await request(app).post('/api/supervisor/registrar-salida').set(authCookie(supToken)).send({ solicitud_id: ingreso.id });

    // ASSERT
    expect(res.status).toBe(200);
    expect(res.body.mensaje).toMatch(/salida/i);

    const sol = await pool.query('SELECT estado FROM solicitudes_estacionamiento WHERE id = $1', [ingreso.id]);
    expect(sol.rows[0].estado).toBe('finalizado');
  });

  test('E1: permite salida sin identificador', async () => {
    // ARRANGE
    const ingreso = await createTestIngreso(usuario.id, vehiculo.id, supervisor.id);

    // ACT
    const res = await request(app).post('/api/supervisor/registrar-salida').set(authCookie(supToken)).send({ solicitud_id: ingreso.id });

    // ASSERT
    expect(res.status).toBe(200);
  });

  test('rechaza salida de solicitud inexistente', async () => {
    // ARRANGE
    const solicitud_id = 99999;

    // ACT
    const res = await request(app).post('/api/supervisor/registrar-salida').set(authCookie(supToken)).send({ solicitud_id });

    // ASSERT
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/no encontrada/i);
  });

  test('rechaza salida de solicitud sin ingreso confirmado', async () => {
    // ARRANGE
    const solicitud = await createTestSolicitud(usuario.id, vehiculo.id);

    // ACT
    const res = await request(app).post('/api/supervisor/registrar-salida').set(authCookie(supToken)).send({ solicitud_id: solicitud.id });

    // ASSERT
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/ingreso confirmado/i);
  });
});

afterAll(async () => {
  await pool.end();
});
