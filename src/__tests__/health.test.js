// ============================================================
// health.test.js
// Test de verificacion de infraestructura
// Verifica que app.js exporta correctamente y responde
// ============================================================

const request = require('supertest');
const app = require('../app');

describe('Infraestructura - Health Check', () => {
  test('GET /api/health responde 200', async () => {
    // ARRANGE
    const ruta = '/api/health';

    // ACT
    const res = await request(app).get(ruta);

    // ASSERT
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  test('GET /api/health no requiere autenticacion', async () => {
    // ARRANGE
    const ruta = '/api/health';

    // ACT
    const res = await request(app).get(ruta);

    // ASSERT
    expect(res.status).toBe(200);
  });
});
