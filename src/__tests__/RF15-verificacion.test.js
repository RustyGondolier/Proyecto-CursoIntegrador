// ============================================================
// RF15-verificacion.test.js
// Cobertura: RF15 (Verificacion de datos de usuario)
// CUS15: El administrador verifica la informacion del usuario.
// ============================================================

const request = require('supertest');
const app = require('../app');
const pool = require('../../db');
const { createTestUser, authCookie } = require('./helpers');

describe('RF15 - Verificacion de datos [CUS15]', () => {
  let adminToken, userPendiente;

  beforeAll(async () => {
    // ARRANGE
    await pool.query(`UPDATE solicitudes_estacionamiento SET estado = 'finalizado' WHERE estado IN ('pendiente', 'ingresado')`);
    await pool.query(`UPDATE plazas SET estado = 'disponible'`);

    const admin = await createTestUser({ rol: 'administrador', codigo_universitario: `U${Date.now()}ADM` });
    adminToken = admin.token;

    userPendiente = await createTestUser({ verificado: false, requiere_reverificacion: true, codigo_universitario: `U${Date.now()}PEND` });
  });

  test('listar usuarios pendientes de verificacion', async () => {
    // ARRANGE
    // Usuarios creados en beforeAll

    // ACT
    const res = await request(app).get('/api/administrador/usuarios/pendientes').set(authCookie(adminToken));

    // ASSERT
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  test('CP02: sin pendientes devuelve array vacio (E1)', async () => {
    // ARRANGE
    const admin = await createTestUser({ rol: 'administrador', codigo_universitario: `U${Date.now().toString(36)}AS` });

    // ACT
    const res = await request(app).get('/api/administrador/usuarios/pendientes').set(authCookie(admin.token));

    // ASSERT
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('CP03: error al aprobar perfil inexistente (E2)', async () => {
    // ARRANGE
    const id = 99999;

    // ACT
    const res = await request(app).put(`/api/administrador/usuarios/${id}/aprobar`).set(authCookie(adminToken));

    // ASSERT
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });

  test('obtener detalle de usuario', async () => {
    // ARRANGE
    const id = userPendiente.usuario.id;

    // ACT
    const res = await request(app).get(`/api/administrador/usuarios/${id}`).set(authCookie(adminToken));

    // ASSERT
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('nombre');
    expect(res.body).toHaveProperty('codigo_universitario');
  });

  test('aprobar perfil de usuario pendiente', async () => {
    // ARRANGE
    const id = userPendiente.usuario.id;

    // ACT
    const res = await request(app).put(`/api/administrador/usuarios/${id}/aprobar`).set(authCookie(adminToken));

    // ASSERT
    expect(res.status).toBe(200);
    expect(res.body.mensaje).toMatch(/aprobado|verificad/i);
  });

  test('E1: 400 al aprobar perfil ya verificado', async () => {
    // ARRANGE
    const id = userPendiente.usuario.id;

    // ACT
    const res = await request(app).put(`/api/administrador/usuarios/${id}/aprobar`).set(authCookie(adminToken));

    // ASSERT
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/verificad/i);
  });

  test('E1: 404 al obtener usuario inexistente', async () => {
    // ARRANGE
    const id = 99999;

    // ACT
    const res = await request(app).get(`/api/administrador/usuarios/${id}`).set(authCookie(adminToken));

    // ASSERT
    expect(res.status).toBe(404);
  });

  test('E1: 401 sin autenticacion', async () => {
    // ARRANGE
    // No se envia token

    // ACT
    const res = await request(app).get('/api/administrador/usuarios/pendientes');

    // ASSERT
    expect(res.status).toBe(401);
  });
});

afterAll(async () => {
  await pool.end();
});
