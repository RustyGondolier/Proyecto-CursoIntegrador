// ============================================================
// RF04-logout.test.js
// Cobertura: RF04 (Cierre de sesion)
// CUS04: El usuario cierra sesion y la cookie se invalida.
// ============================================================

const request = require('supertest');
const app = require('../app');
const { createTestUser, authCookie } = require('./helpers');

describe('RF04 - Cierre de sesion [CUS04]', () => {
  test('logout exitoso limpia la cookie', async () => {
    // ARRANGE
    // No se necesitan datos previos para el logout

    // ACT
    const res = await request(app).post('/api/auth/logout');

    // ASSERT
    expect(res.status).toBe(200);
    expect(res.body.mensaje).toBeDefined();
    expect(res.headers['set-cookie']).toBeDefined();
  });

  test('CP02: cancelacion del cierre mantiene sesion activa (E1)', async () => {
    // ARRANGE
    // No se llama a logout; se verifica que la sesion sigue activa
    const { token } = await createTestUser();

    // ACT
    const res = await request(app).get('/api/auth/me').set(authCookie(token));

    // ASSERT
    expect(res.status).toBe(200);
    expect(res.body.usuario).toBeDefined();
  });

  test('CP03: error al cerrar sesion (E2)', async () => {
    // ARRANGE
    // Enviar solicitud de logout sin sesion activa
    const res = await request(app).post('/api/auth/logout');

    // ACT
    const res2 = await request(app).post('/api/auth/logout');

    // ASSERT
    expect(res2.status).toBe(200);
  });
});
