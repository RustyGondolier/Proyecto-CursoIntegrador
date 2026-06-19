// ============================================================
// RF20-historial.test.js
// Cobertura: RF20 (Historial de accesos del usuario)
// CUS20: El usuario consulta su historial con hora de
//        solicitud, ingreso oficial y salida por visita.
// ============================================================

const request = require('supertest');
const app = require('../app');
const { createTestUser, createTestVehicle, authCookie } = require('./helpers');

describe('RF20 - Historial de accesos [CUS20]', () => {
  let token, usuario;

  beforeAll(async () => {
    // ARRANGE
    const data = await createTestUser({ verificado: true });
    token = data.token;
    usuario = data.usuario;
  });

  test('E1: permite consultar historial sin registros', async () => {
    // ARRANGE
    // Usuario sin actividad previa

    // ACT
    const res = await request(app).get('/api/solicitudes/historial').set(authCookie(token));

    // ASSERT
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('historial incluye solicitudes realizadas', async () => {
    // ARRANGE
    const vh = await createTestVehicle(usuario.id);
    await request(app).post('/api/solicitudes/crear').set(authCookie(token)).send({ estacionamiento_id: 1, lat: -12.1939, lng: -76.9715 });
    await request(app).post('/api/solicitudes/cancelar').set(authCookie(token));

    // ACT
    const res = await request(app).get('/api/solicitudes/historial').set(authCookie(token));

    // ASSERT
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  test('E2: error al cargar historial con filtros invalidos', async () => {
    // ARRANGE
    const query = { fecha_inicio: 'no-valida' };

    // ACT
    const res = await request(app).get('/api/solicitudes/historial').query(query).set(authCookie(token));

    // ASSERT
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});
