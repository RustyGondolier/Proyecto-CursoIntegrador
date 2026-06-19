// ============================================================
// RF02-login.test.js
// Cobertura: RF02 (Inicio de sesion)
// CUS02: El usuario accede a la plataforma con su codigo y
//        contrasena. Redirige al dashboard segun rol.
// ============================================================

const request = require('supertest');
const app = require('../app');
const { createTestUser, authCookie } = require('./helpers');

describe('RF02 - Inicio de sesion [CUS02]', () => {
  test('login exitoso con credenciales validas', async () => {
    // ARRANGE
    const { usuario } = await createTestUser({
      codigo_universitario: `U${Date.now()}LOGIN`,
    });
    const credenciales = {
      codigo_universitario: usuario.codigo_universitario,
      password: 'password123',
    };

    // ACT
    const res = await request(app).post('/api/auth/login').send(credenciales);

    // ASSERT
    expect(res.status).toBe(200);
    expect(res.body.usuario).toBeDefined();
    expect(res.body.usuario.rol).toBe('estudiante');
    expect(res.body.usuario.nombre).toBeDefined();
    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.headers['set-cookie'][0]).toMatch(/token=/);
  });

  test('E1: rechaza login con contrasena incorrecta', async () => {
    // ARRANGE
    const { usuario } = await createTestUser({
      codigo_universitario: `U${Date.now()}E1PW`,
    });
    const credenciales = { codigo_universitario: usuario.codigo_universitario, password: 'incorrecta' };

    // ACT
    const res = await request(app).post('/api/auth/login').send(credenciales);

    // ASSERT
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/credenciales/i);
  });

  test('E1: rechaza login con codigo inexistente (mismo mensaje)', async () => {
    // ARRANGE
    const credenciales = { codigo_universitario: 'NOEXISTE', password: 'x' };

    // ACT
    const res = await request(app).post('/api/auth/login').send(credenciales);

    // ASSERT
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/credenciales/i);
  });

  test('E2: rechaza login de cuenta suspendida', async () => {
    // ARRANGE
    const { usuario } = await createTestUser({
      estado_cuenta: 'suspendida',
      motivo_suspension: 'Documentacion incorrecta',
      codigo_universitario: `U${Date.now()}SUS`,
    });
    const credenciales = {
      codigo_universitario: usuario.codigo_universitario,
      password: 'password123',
    };

    // ACT
    const res = await request(app).post('/api/auth/login').send(credenciales);

    // ASSERT
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/suspendida/i);
  });

  test('login devuelve el rol correcto del usuario autenticado', async () => {
    // ARRANGE
    const { token } = await createTestUser({
      rol: 'administrador',
      codigo_universitario: `U${Date.now()}ADM`,
    });

    // ACT
    const res = await request(app).get('/api/auth/me').set(authCookie(token));

    // ASSERT
    expect(res.status).toBe(200);
    expect(res.body.usuario.rol).toBe('administrador');
  });
});
