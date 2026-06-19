// ============================================================
// RF19-incidencias.test.js
// Cobertura: RF19 (Reporte de incidencias - usuario)
// CUS19: El usuario reporta un problema en su plaza asignada.
// ============================================================

const request = require('supertest');
const app = require('../app');
const pool = require('../../db');
const { createTestUser, createTestVehicle, createTestSolicitud, authCookie } = require('./helpers');

describe('RF19 - Reporte de incidencias [CUS19]', () => {
  let userToken, usuario, vehiculo;

  beforeAll(async () => {
    // ARRANGE
    await pool.query(`UPDATE solicitudes_estacionamiento SET estado = 'finalizado' WHERE estado IN ('pendiente', 'ingresado')`);
    const data = await createTestUser({ verificado: true });
    userToken = data.token;
    usuario = data.usuario;
    vehiculo = await createTestVehicle(usuario.id);
    await createTestSolicitud(usuario.id, vehiculo.id);
  });

  test('crear reporte exitosamente con solicitud activa', async () => {
    // ARRANGE
    const datos = { descripcion: 'Hay un vehiculo mal estacionado en mi plaza' };

    // ACT
    const res = await request(app).post('/api/reportes/').set(authCookie(userToken)).send(datos);

    // ASSERT
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('descripcion');
    expect(res.body).toHaveProperty('estado_id');
    expect(res.body.estado_id).toBe(1);
  });

  test('E1: rechaza reporte sin descripcion', async () => {
    // ARRANGE
    const datos = {};

    // ACT
    const res = await request(app).post('/api/reportes/').set(authCookie(userToken)).send(datos);

    // ASSERT
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/descripcion/i);
  });

  test('E1: rechaza reporte con descripcion demasiado corta', async () => {
    // ARRANGE
    const datos = { descripcion: 'Corto' };

    // ACT
    const res = await request(app).post('/api/reportes/').set(authCookie(userToken)).send(datos);

    // ASSERT
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/10 caracteres/i);
  });

  test('E2: error al enviar reporte con datos invalidos', async () => {
    // ARRANGE
    const datos = { descripcion: null };

    // ACT
    const res = await request(app).post('/api/reportes/').set(authCookie(userToken)).send(datos);

    // ASSERT
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test('rechaza reporte sin solicitud activa', async () => {
    // ARRANGE
    const userSinSol = await createTestUser({ verificado: true, codigo_universitario: `U${Date.now()}SIN` });
    await createTestVehicle(userSinSol.usuario.id);

    // ACT
    const res = await request(app).post('/api/reportes/').set(authCookie(userSinSol.token)).send({ descripcion: 'Problema con la plaza asignada' });

    // ASSERT
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/solicitud activa/i);
  });

  test('401 sin autenticacion al crear reporte', async () => {
    // ARRANGE
    const datos = { descripcion: 'Test' };

    // ACT
    const res = await request(app).post('/api/reportes/').send(datos);

    // ASSERT
    expect(res.status).toBe(401);
  });

  test('listar mis reportes', async () => {
    // ARRANGE
    // Usuario autenticado con reportes previos

    // ACT
    const res = await request(app).get('/api/reportes/').set(authCookie(userToken));

    // ASSERT
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });
});

afterAll(async () => {
  await pool.end();
});
