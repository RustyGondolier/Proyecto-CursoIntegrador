// ============================================================
// RNF06-seguridad.test.js
// Cobertura: RNF06 (Seguridad de acceso y roles)
// El sistema implementa autenticacion por token y roles
// diferenciados. Cada actor accede unicamente a las funciones
// de su rol.
// ============================================================

const request = require('supertest');
const app = require('../app');
const { createTestUser, authCookie } = require('./helpers');

const RUTA_USUARIO = '/api/estacionamientos/ocupacion';
const RUTA_SUPERVISOR = '/api/supervisor/dashboard';
const RUTA_ADMIN = '/api/administrador/usuarios';
const RUTA_DIRECCION = '/api/direccion/dashboard';

describe('RNF06 - Seguridad de acceso y roles', () => {
  let tokenEstudiante;
  let tokenSupervisor;
  let tokenAdmin;
  let tokenDireccion;

  beforeAll(async () => {
    // ARRANGE
    const est = await createTestUser({ codigo_universitario: `U${Date.now()}EST`, rol: 'estudiante' });
    tokenEstudiante = est.token;

    const sup = await createTestUser({ codigo_universitario: `U${Date.now()}SUP`, rol: 'supervisor' });
    tokenSupervisor = sup.token;

    const adm = await createTestUser({ codigo_universitario: `U${Date.now()}ADM`, rol: 'administrador' });
    tokenAdmin = adm.token;

    const dir = await createTestUser({ codigo_universitario: `U${Date.now()}DIR`, rol: 'direccion' });
    tokenDireccion = dir.token;
  });

  describe('sin autenticacion', () => {
    test('401 sin token en ruta de usuario', async () => {
      // ACT
      const res = await request(app).get(RUTA_USUARIO);

      // ASSERT
      expect(res.status).toBe(401);
    });

    test('401 sin token en ruta de supervisor', async () => {
      // ACT
      const res = await request(app).get(RUTA_SUPERVISOR);

      // ASSERT
      expect(res.status).toBe(401);
    });

    test('401 sin token en ruta de administrador', async () => {
      // ACT
      const res = await request(app).get(RUTA_ADMIN);

      // ASSERT
      expect(res.status).toBe(401);
    });

    test('401 sin token en ruta de direccion', async () => {
      // ACT
      const res = await request(app).get(RUTA_DIRECCION);

      // ASSERT
      expect(res.status).toBe(401);
    });
  });

  describe('token invalido', () => {
    const cookie = { Cookie: 'token=token-malo' };

    test('403 con token invalido en ruta de usuario', async () => {
      // ACT
      const res = await request(app).get(RUTA_USUARIO).set(cookie);

      // ASSERT
      expect(res.status).toBe(403);
    });

    test('403 con token invalido en ruta de supervisor', async () => {
      // ACT
      const res = await request(app).get(RUTA_SUPERVISOR).set(cookie);

      // ASSERT
      expect(res.status).toBe(403);
    });

    test('403 con token invalido en ruta de administrador', async () => {
      // ACT
      const res = await request(app).get(RUTA_ADMIN).set(cookie);

      // ASSERT
      expect(res.status).toBe(403);
    });

    test('403 con token invalido en ruta de direccion', async () => {
      // ACT
      const res = await request(app).get(RUTA_DIRECCION).set(cookie);

      // ASSERT
      expect(res.status).toBe(403);
    });
  });

  describe('rol estudiante', () => {
    test('accede a ruta de usuario', async () => {
      // ACT
      const res = await request(app).get(RUTA_USUARIO).set(authCookie(tokenEstudiante));

      // ASSERT
      expect(res.status).toBe(200);
    });

    test('denegado en ruta de supervisor', async () => {
      // ACT
      const res = await request(app).get(RUTA_SUPERVISOR).set(authCookie(tokenEstudiante));

      // ASSERT
      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/denegado/i);
    });

    test('denegado en ruta de administrador', async () => {
      // ACT
      const res = await request(app).get(RUTA_ADMIN).set(authCookie(tokenEstudiante));

      // ASSERT
      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/denegado/i);
    });

    test('denegado en ruta de direccion', async () => {
      // ACT
      const res = await request(app).get(RUTA_DIRECCION).set(authCookie(tokenEstudiante));

      // ASSERT
      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/denegado/i);
    });
  });

  describe('rol supervisor', () => {
    test('accede a ruta de usuario', async () => {
      // ACT
      const res = await request(app).get(RUTA_USUARIO).set(authCookie(tokenSupervisor));

      // ASSERT
      expect(res.status).toBe(200);
    });

    test('accede a ruta de supervisor', async () => {
      // ACT
      const res = await request(app).get(RUTA_SUPERVISOR).set(authCookie(tokenSupervisor));

      // ASSERT
      expect(res.status).toBe(200);
    });

    test('denegado en ruta de administrador', async () => {
      // ACT
      const res = await request(app).get(RUTA_ADMIN).set(authCookie(tokenSupervisor));

      // ASSERT
      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/denegado/i);
    });

    test('denegado en ruta de direccion', async () => {
      // ACT
      const res = await request(app).get(RUTA_DIRECCION).set(authCookie(tokenSupervisor));

      // ASSERT
      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/denegado/i);
    });
  });

  describe('rol administrador', () => {
    test('accede a ruta de usuario', async () => {
      // ACT
      const res = await request(app).get(RUTA_USUARIO).set(authCookie(tokenAdmin));

      // ASSERT
      expect(res.status).toBe(200);
    });

    test('accede a ruta de supervisor', async () => {
      // ACT
      const res = await request(app).get(RUTA_SUPERVISOR).set(authCookie(tokenAdmin));

      // ASSERT
      expect(res.status).toBe(200);
    });

    test('accede a ruta de administrador', async () => {
      // ACT
      const res = await request(app).get(RUTA_ADMIN).set(authCookie(tokenAdmin));

      // ASSERT
      expect(res.status).toBe(200);
    });

    test('accede a ruta de direccion', async () => {
      // ACT
      const res = await request(app).get(RUTA_DIRECCION).set(authCookie(tokenAdmin));

      // ASSERT
      expect(res.status).toBe(200);
    });
  });

  describe('rol direccion', () => {
    test('accede a ruta de usuario', async () => {
      // ACT
      const res = await request(app).get(RUTA_USUARIO).set(authCookie(tokenDireccion));

      // ASSERT
      expect(res.status).toBe(200);
    });

    test('denegado en ruta de supervisor', async () => {
      // ACT
      const res = await request(app).get(RUTA_SUPERVISOR).set(authCookie(tokenDireccion));

      // ASSERT
      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/denegado/i);
    });

    test('denegado en ruta de administrador', async () => {
      // ACT
      const res = await request(app).get(RUTA_ADMIN).set(authCookie(tokenDireccion));

      // ASSERT
      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/denegado/i);
    });

    test('accede a ruta de direccion', async () => {
      // ACT
      const res = await request(app).get(RUTA_DIRECCION).set(authCookie(tokenDireccion));

      // ASSERT
      expect(res.status).toBe(200);
    });
  });
});
