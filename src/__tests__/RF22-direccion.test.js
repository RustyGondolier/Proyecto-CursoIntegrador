// ============================================================
// RF22-direccion.test.js
// Cobertura: RF22 (Dashboard de metricas para Direccion)
// CUS22: La Direccion consulta metricas del estacionamiento:
//        tiempo de permanencia, solicitudes por hora,
//        ocupacion e informacion de reportes.
// ============================================================

const request = require('supertest');
const app = require('../app');
const { createTestUser, authCookie } = require('./helpers');

describe('RF22 - Dashboard de metricas [CUS22]', () => {
  let dirToken, estToken;

  beforeAll(async () => {
    // ARRANGE
    const dir = await createTestUser({ rol: 'direccion', codigo_universitario: `U${Date.now()}DIR` });
    dirToken = dir.token;

    const est = await createTestUser({ codigo_universitario: `U${Date.now()}EST` });
    estToken = est.token;
  });

  test('obtener dashboard sin filtros de fecha', async () => {
    // ARRANGE
    // Usuario direccion autenticado

    // ACT
    const res = await request(app).get('/api/direccion/dashboard').set(authCookie(dirToken));

    // ASSERT
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('resumen');
    expect(res.body).toHaveProperty('permanencia');
    expect(res.body).toHaveProperty('solicitudes_por_hora');
    expect(res.body).toHaveProperty('ocupacion');
    expect(res.body).toHaveProperty('reportes');
  });

  test('obtener dashboard con rango de fechas valido', async () => {
    // ARRANGE
    const query = { fecha_inicio: '2026-01-01', fecha_fin: '2026-12-31' };

    // ACT
    const res = await request(app).get('/api/direccion/dashboard').query(query).set(authCookie(dirToken));

    // ASSERT
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('resumen');
  });

  test('E1: rechaza formato de fecha invalido', async () => {
    // ARRANGE
    const query = { fecha_inicio: '01-01-2026', fecha_fin: '31-12-2026' };

    // ACT
    const res = await request(app).get('/api/direccion/dashboard').query(query).set(authCookie(dirToken));

    // ASSERT
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/fecha/i);
  });

  test('E1: rechaza fecha_inicio mayor que fecha_fin', async () => {
    // ARRANGE
    const query = { fecha_inicio: '2026-12-31', fecha_fin: '2026-01-01' };

    // ACT
    const res = await request(app).get('/api/direccion/dashboard').query(query).set(authCookie(dirToken));

    // ASSERT
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/fecha_inicio/i);
  });

  test('CP02: E1 - periodo sin registros devuelve dashboard con ceros', async () => {
    // ARRANGE
    const query = { fecha_inicio: '2020-01-01', fecha_fin: '2020-01-02' };

    // ACT
    const res = await request(app).get('/api/direccion/dashboard').query(query).set(authCookie(dirToken));

    // ASSERT
    expect(res.status).toBe(200);
    expect(res.body.resumen.total_solicitudes).toBe(0);
    expect(res.body.resumen.total_ingresos).toBe(0);
  });

  test('401 sin autenticacion al obtener dashboard', async () => {
    // ARRANGE
    // No se envia token

    // ACT
    const res = await request(app).get('/api/direccion/dashboard');

    // ASSERT
    expect(res.status).toBe(401);
  });

  test('403 con rol estudiante al obtener dashboard', async () => {
    // ARRANGE
    // Usuario estudiante autenticado

    // ACT
    const res = await request(app).get('/api/direccion/dashboard').set(authCookie(estToken));

    // ASSERT
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/denegado/i);
  });

  test('exportar dashboard a Excel con rango de fechas', async () => {
    // ARRANGE
    const query = { fecha_inicio: '2026-01-01', fecha_fin: '2026-12-31' };

    // ACT
    const res = await request(app).get('/api/direccion/exportar').query(query).set(authCookie(dirToken));

    // ASSERT
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/spreadsheet|octet/);
  });

  test('CP03: E2 - error al generar dashboard con filtros invalidos', async () => {
    // ARRANGE
    const query = { fecha_inicio: '01-01-2026', fecha_fin: '31-12-2026' };

    // ACT
    const res = await request(app).get('/api/direccion/dashboard').query(query).set(authCookie(dirToken));

    // ASSERT
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/fecha/i);
  });
});
