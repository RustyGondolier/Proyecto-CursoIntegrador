// ============================================================
// 00-health.test.js
// Test de verificación de infraestructura
// Verifica que app.js exporta correctamente y responde
// ============================================================

const request = require('supertest');
const app = require('../app');

describe('Infraestructura - Health Check', () => {
  test('GET /api/health responde 200', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  test('GET /api/health no requiere autenticacion', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
  });
});
