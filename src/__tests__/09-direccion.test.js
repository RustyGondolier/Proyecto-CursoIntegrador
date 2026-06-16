// ============================================================
// 09-direccion.test.js
// Cobertura: RF22 (Dashboard de metricas para Direccion)
// ============================================================

const request = require('supertest');
const app = require('../app');
const { createTestUser, authCookie } = require('./helpers');

// ────────────────────────────────────────────────────────────
// RF22 — Dashboard de metricas para Direccion
// CUS22: La Direccion consulta metricas del estacionamiento:
//        tiempo de permanencia, solicitudes por hora,
//        ocupacion e informacion de reportes.
// ────────────────────────────────────────────────────────────
describe('RF22 - Dashboard de metricas [CUS22]', () => {
  let dirToken, estToken;

  beforeAll(async () => {
    const dir = await createTestUser({
      rol: 'direccion',
      codigo_universitario: `U${Date.now()}DIR`
    });
    dirToken = dir.token;

    const est = await createTestUser({
      codigo_universitario: `U${Date.now()}EST`
    });
    estToken = est.token;
  });

  // Escenario exitoso: dashboard con periodo default de 30 dias
  test('obtener dashboard sin filtros de fecha', async () => {
    const res = await request(app)
      .get('/api/direccion/dashboard')
      .set(authCookie(dirToken));
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('resumen');
    expect(res.body).toHaveProperty('permanencia');
    expect(res.body).toHaveProperty('solicitudes_por_hora');
    expect(res.body).toHaveProperty('ocupacion');
    expect(res.body).toHaveProperty('reportes');
  });

  // Escenario exitoso: dashboard filtrado por rango de fechas
  test('obtener dashboard con rango de fechas valido', async () => {
    const res = await request(app)
      .get('/api/direccion/dashboard')
      .query({ fecha_inicio: '2026-01-01', fecha_fin: '2026-12-31' })
      .set(authCookie(dirToken));
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('resumen');
  });

  // Escenario de excepcion (E1): formato de fecha DD-MM-YYYY invalido
  test('E1: rechaza formato de fecha invalido', async () => {
    const res = await request(app)
      .get('/api/direccion/dashboard')
      .query({ fecha_inicio: '01-01-2026', fecha_fin: '31-12-2026' })
      .set(authCookie(dirToken));
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/fecha/i);
  });

  // Escenario de excepcion (E1): fecha_inicio posterior a fecha_fin
  test('E1: rechaza fecha_inicio mayor que fecha_fin', async () => {
    const res = await request(app)
      .get('/api/direccion/dashboard')
      .query({ fecha_inicio: '2026-12-31', fecha_fin: '2026-01-01' })
      .set(authCookie(dirToken));
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/fecha_inicio/i);
  });

  // Escenario de borde: periodo sin registros devuelve metricas en cero
  test('periodo sin registros devuelve dashboard con ceros', async () => {
    const res = await request(app)
      .get('/api/direccion/dashboard')
      .query({ fecha_inicio: '2020-01-01', fecha_fin: '2020-01-02' })
      .set(authCookie(dirToken));
    expect(res.status).toBe(200);
    expect(res.body.resumen.total_solicitudes).toBe(0);
    expect(res.body.resumen.total_ingresos).toBe(0);
  });

  // Escenario de excepcion (E1): sin token de autenticacion
  test('401 sin autenticacion al obtener dashboard', async () => {
    const res = await request(app)
      .get('/api/direccion/dashboard');
    expect(res.status).toBe(401);
  });

  // Escenario de excepcion (E2): rol estudiante no autorizado
  test('403 con rol estudiante al obtener dashboard', async () => {
    const res = await request(app)
      .get('/api/direccion/dashboard')
      .set(authCookie(estToken));
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/denegado/i);
  });

  // Escenario exitoso: exportar dashboard a Excel con filtro de fechas
  test('exportar dashboard a Excel con rango de fechas', async () => {
    const res = await request(app)
      .get('/api/direccion/exportar')
      .query({ fecha_inicio: '2026-01-01', fecha_fin: '2026-12-31' })
      .set(authCookie(dirToken));
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/spreadsheet|octet/);
  });
});
