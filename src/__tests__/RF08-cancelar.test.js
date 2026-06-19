// ============================================================
// RF08-cancelar.test.js
// Cobertura: RF08 (Cancelacion de solicitud activa)
// CUS08: El usuario cancela su solicitud antes del ingreso.
//        El contador disminuye en 1 y la plaza se libera.
// ============================================================

const request = require('supertest');
const app = require('../app');
const pool = require('../../db');
const { createTestUser, createTestVehicle, createTestIngreso, authCookie } = require('./helpers');

describe('RF08 - Cancelacion de solicitud [CUS08]', () => {
  let token, usuario, vehiculo;

  beforeAll(async () => {
    // ARRANGE
    const data = await createTestUser({ verificado: true });
    token = data.token;
    usuario = data.usuario;
    vehiculo = await createTestVehicle(usuario.id);
  });

  test('CP03: cancelacion anulada mantiene solicitud activa (E2)', async () => {
    // ARRANGE
    await request(app).post('/api/solicitudes/crear').set(authCookie(token)).send({ estacionamiento_id: 1, lat: -12.1939, lng: -76.9715 });

    // ACT - verificar que la solicitud sigue activa antes de cancelar
    const activa = await request(app).get('/api/solicitudes/activa').set(authCookie(token));

    // ASSERT
    expect(activa.status).toBe(200);
    expect(activa.body).toHaveProperty('id');
    expect(activa.body.estado).toBe('pendiente');
  });

  test('cancelar solicitud activa exitosamente', async () => {
    // ARRANGE
    await request(app).post('/api/solicitudes/crear').set(authCookie(token)).send({ estacionamiento_id: 1, lat: -12.1939, lng: -76.9715 });

    // ACT
    const res = await request(app).post('/api/solicitudes/cancelar').set(authCookie(token));

    // ASSERT
    expect(res.status).toBe(200);
    expect(res.body.mensaje).toMatch(/cancelada/i);
  });

  test('E1: no permite cancelar si supervisor ya confirmo ingreso', async () => {
    // ARRANGE
    const sup = await createTestUser({ rol: 'supervisor', codigo_universitario: `U${Date.now()}SUP` });
    const user = await createTestUser({ verificado: true, codigo_universitario: `U${Date.now()}USER` });
    const vh = await createTestVehicle(user.usuario.id);
    await createTestIngreso(user.usuario.id, vh.id, sup.usuario.id);

    // ACT
    const res = await request(app).post('/api/solicitudes/cancelar').set(authCookie(user.token));

    // ASSERT
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/supervisor/i);
  });

  test('rechaza cancelar sin solicitud activa', async () => {
    // ARRANGE
    // No hay solicitud activa

    // ACT
    const res = await request(app).post('/api/solicitudes/cancelar').set(authCookie(token));

    // ASSERT
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/activa/i);
  });
});

afterAll(async () => {
  await pool.end();
});
