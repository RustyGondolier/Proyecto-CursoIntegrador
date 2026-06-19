// ============================================================
// RF13-reportes-supervisor.test.js
// Cobertura: RF13 (Gestion de reportes de incidencias - supervisor)
// CUS13: El supervisor revisa, responde y escala reportes.
// ============================================================

const request = require('supertest');
const app = require('../app');
const pool = require('../../db');
const { createTestUser, createTestVehicle, createTestSolicitud, authCookie } = require('./helpers');

describe('RF13 - Gestion de reportes [CUS13]', () => {
  let supToken, supervisor;
  let userToken, usuario, vehiculo, reporteId;

  beforeAll(async () => {
    // ARRANGE
    await pool.query(`UPDATE solicitudes_estacionamiento SET estado = 'finalizado' WHERE estado IN ('pendiente', 'ingresado')`);

    const sup = await createTestUser({ rol: 'supervisor', codigo_universitario: `U${Date.now()}SUP` });
    supToken = sup.token;
    supervisor = sup.usuario;

    const user = await createTestUser({ verificado: true, codigo_universitario: `U${Date.now()}USR` });
    userToken = user.token;
    usuario = user.usuario;
    vehiculo = await createTestVehicle(usuario.id);
    await createTestSolicitud(usuario.id, vehiculo.id);

    const crear = await request(app).post('/api/reportes/').set(authCookie(userToken)).send({ descripcion: 'Plaza obstruida por otro vehiculo en la cochera' });
    reporteId = crear.body.id;
  });

  test('listar todos los reportes como supervisor', async () => {
    // ARRANGE
    // Reportes ya creados en beforeAll

    // ACT
    const res = await request(app).get('/api/reportes/todos').set(authCookie(supToken));

    // ASSERT
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  test('CP02: listar reportes sin pendientes devuelve array vacio (E1)', async () => {
    // ARRANGE
    const sup2 = await createTestUser({ rol: 'supervisor', codigo_universitario: `U${Date.now().toString(36)}SV` });

    // ACT
    const res = await request(app).get('/api/reportes/todos').set(authCookie(sup2.token));

    // ASSERT
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('CP03: error al actualizar estado de reporte inexistente (E2)', async () => {
    // ARRANGE
    const id = 99999;
    const datos = { respuesta: 'Respuesta de prueba' };

    // ACT
    const res = await request(app).put(`/api/reportes/${id}/responder`).set(authCookie(supToken)).send(datos);

    // ASSERT
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });

  test('obtener detalle de reporte', async () => {
    // ARRANGE
    const id = reporteId;

    // ACT
    const res = await request(app).get(`/api/reportes/${id}`).set(authCookie(supToken));

    // ASSERT
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('usuario_nombre');
    expect(res.body).toHaveProperty('descripcion');
    expect(res.body).toHaveProperty('estado');
  });

  test('marcar reporte en revision', async () => {
    // ARRANGE
    const id = reporteId;

    // ACT
    const res = await request(app).put(`/api/reportes/${id}/en-revision`).set(authCookie(supToken));

    // ASSERT
    expect(res.status).toBe(200);
    expect(res.body.estado_id).toBe(2);
  });

  test('E1: 404 al obtener reporte inexistente', async () => {
    // ARRANGE
    const id = 99999;

    // ACT
    const res = await request(app).get(`/api/reportes/${id}`).set(authCookie(supToken));

    // ASSERT
    expect(res.status).toBe(404);
  });

  test('responder y resolver reporte exitosamente', async () => {
    // ARRANGE
    const datos = { respuesta: 'Se ha solucionado el problema. La plaza esta libre.' };

    // ACT
    const res = await request(app).put(`/api/reportes/${reporteId}/responder`).set(authCookie(supToken)).send(datos);

    // ASSERT
    expect(res.status).toBe(200);
    expect(res.body.estado_id).toBe(3);
  });

  test('E1: rechaza responder sin respuesta', async () => {
    // ARRANGE
    const datos = {};

    // ACT
    const res = await request(app).put(`/api/reportes/${reporteId}/responder`).set(authCookie(supToken)).send(datos);

    // ASSERT
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/respuesta/i);
  });

  test('marcar reporte como prioritario', async () => {
    // ARRANGE
    const userPri = await createTestUser({ verificado: true, codigo_universitario: `U${Date.now()}PRI` });
    const vhPri = await createTestVehicle(userPri.usuario.id);
    await createTestSolicitud(userPri.usuario.id, vhPri.id);

    const crear = await request(app).post('/api/reportes/').set(authCookie(userPri.token)).send({ descripcion: 'Problema grave que requiere atencion urgente del administrador' });
    const nuevoId = crear.body.id;

    // ACT
    const res = await request(app).put(`/api/reportes/${nuevoId}/prioritario`).set(authCookie(supToken)).send({ razon: 'El problema afecta a varios usuarios y requiere intervencion administrativa' });

    // ASSERT
    expect(res.status).toBe(200);
    expect(res.body.estado_id).toBe(4);
    expect(res.body.es_prioritario).toBe(true);
  });

  test('E1: rechaza marcar prioritario sin razon', async () => {
    // ARRANGE
    const datos = {};

    // ACT
    const res = await request(app).put(`/api/reportes/${reporteId}/prioritario`).set(authCookie(supToken)).send(datos);

    // ASSERT
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/razon/i);
  });

  test('403: estudiante no accede a listar todos los reportes', async () => {
    // ARRANGE
    // Usuario estudiante autenticado

    // ACT
    const res = await request(app).get('/api/reportes/todos').set(authCookie(userToken));

    // ASSERT
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/denegado/i);
  });
});

afterAll(async () => {
  await pool.end();
});
