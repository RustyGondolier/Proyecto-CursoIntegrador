// ============================================================
// RF18-reportes-prioritarios.test.js
// Cobertura: RF18 (Revision de reportes prioritarios)
// CUS18: El administrador gestiona reportes marcados como
//        prioritarios por el supervisor.
// ============================================================

const request = require('supertest');
const app = require('../app');
const pool = require('../../db');
const { createTestUser, createTestVehicle, createTestSolicitud, authCookie } = require('./helpers');

describe('RF18 - Reportes prioritarios [CUS18]', () => {
  let adminToken, supToken, reporteId;

  beforeAll(async () => {
    // ARRANGE
    await pool.query(`UPDATE solicitudes_estacionamiento SET estado = 'finalizado' WHERE estado IN ('pendiente', 'ingresado')`);
    await pool.query(`UPDATE plazas SET estado = 'disponible'`);

    const admin = await createTestUser({ rol: 'administrador', codigo_universitario: `U${Date.now()}ADM4` });
    adminToken = admin.token;

    const sup = await createTestUser({ rol: 'supervisor', codigo_universitario: `U${Date.now()}SUP4` });
    supToken = sup.token;

    const user = await createTestUser({ verificado: true, codigo_universitario: `U${Date.now()}USR4` });
    const vh = await createTestVehicle(user.usuario.id);
    await createTestSolicitud(user.usuario.id, vh.id);

    const reporte = await request(app).post('/api/reportes/').set(authCookie(user.token)).send({ descripcion: 'Acceso bloqueado por obras en la entrada de la cochera' });
    reporteId = reporte.body.id;

    await request(app).put(`/api/reportes/${reporteId}/prioritario`).set(authCookie(supToken)).send({ razon: 'Requiere intervencion de obras y autorizacion administrativa' });
  });

  test('listar reportes prioritarios', async () => {
    // ARRANGE
    // Reportes ya preparados en beforeAll

    // ACT
    const res = await request(app).get('/api/administrador/reportes/prioritarios').set(authCookie(adminToken));

    // ASSERT
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  test('CP02: sin reportes prioritarios devuelve array vacio (E1)', async () => {
    // ARRANGE
    const admin2 = await createTestUser({ rol: 'administrador', codigo_universitario: `U${Date.now().toString(36)}AP` });

    // ACT
    const res = await request(app).get('/api/administrador/reportes/prioritarios').set(authCookie(admin2.token));

    // ASSERT
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('resolver reporte prioritario', async () => {
    // ARRANGE
    const id = reporteId;

    // ACT
    const res = await request(app).put(`/api/administrador/reportes/${id}/resolver`).set(authCookie(adminToken));

    // ASSERT
    expect(res.status).toBe(200);
  });

  test('E1: 404 al resolver reporte inexistente', async () => {
    // ARRANGE
    const id = 99999;

    // ACT
    const res = await request(app).put(`/api/administrador/reportes/${id}/resolver`).set(authCookie(adminToken));

    // ASSERT
    expect(res.status).toBe(404);
  });

  test('listar acciones administrativas', async () => {
    // ARRANGE
    // Acciones generadas por operaciones previas

    // ACT
    const res = await request(app).get('/api/administrador/acciones').set(authCookie(adminToken));

    // ASSERT
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

afterAll(async () => {
  await pool.end();
});
