// ============================================================
// 11-authz.test.js
// Cobertura: RNF06 (Seguridad de acceso y roles)
// ============================================================

const request = require('supertest');
const app = require('../app');
const { createTestUser, authCookie } = require('./helpers');

const RUTA_USUARIO = '/api/estacionamientos/ocupacion';
const RUTA_SUPERVISOR = '/api/supervisor/dashboard';
const RUTA_ADMIN = '/api/administrador/usuarios';
const RUTA_DIRECCION = '/api/direccion/dashboard';

// ────────────────────────────────────────────────────────────
// RNF06 — Seguridad de acceso y roles
// El sistema implementa autenticacion por token y roles
// diferenciados. Cada actor accede unicamente a las funciones
// de su rol.
// ────────────────────────────────────────────────────────────
describe('RNF06 - Seguridad de acceso y roles', () => {
  let tokenEstudiante;
  let tokenSupervisor;
  let tokenAdmin;
  let tokenDireccion;

  beforeAll(async () => {
    const est = await createTestUser({
      codigo_universitario: `U${Date.now()}EST`,
      rol: 'estudiante'
    });
    tokenEstudiante = est.token;

    const sup = await createTestUser({
      codigo_universitario: `U${Date.now()}SUP`,
      rol: 'supervisor'
    });
    tokenSupervisor = sup.token;

    const adm = await createTestUser({
      codigo_universitario: `U${Date.now()}ADM`,
      rol: 'administrador'
    });
    tokenAdmin = adm.token;

    const dir = await createTestUser({
      codigo_universitario: `U${Date.now()}DIR`,
      rol: 'direccion'
    });
    tokenDireccion = dir.token;
  });

  // ─── SIN AUTENTICACION (E1) ─────────────────────────────
  describe('sin autenticacion', () => {
    test('401 sin token en ruta de usuario', async () => {
      const res = await request(app).get(RUTA_USUARIO);
      expect(res.status).toBe(401);
    });

    test('401 sin token en ruta de supervisor', async () => {
      const res = await request(app).get(RUTA_SUPERVISOR);
      expect(res.status).toBe(401);
    });

    test('401 sin token en ruta de administrador', async () => {
      const res = await request(app).get(RUTA_ADMIN);
      expect(res.status).toBe(401);
    });

    test('401 sin token en ruta de direccion', async () => {
      const res = await request(app).get(RUTA_DIRECCION);
      expect(res.status).toBe(401);
    });
  });

  // ─── TOKEN INVALIDO (E1) ────────────────────────────────
  describe('token invalido', () => {
    test('403 con token invalido en ruta de usuario', async () => {
      const res = await request(app)
        .get(RUTA_USUARIO)
        .set({ Cookie: 'token=token-malo' });
      expect(res.status).toBe(403);
    });

    test('403 con token invalido en ruta de supervisor', async () => {
      const res = await request(app)
        .get(RUTA_SUPERVISOR)
        .set({ Cookie: 'token=token-malo' });
      expect(res.status).toBe(403);
    });

    test('403 con token invalido en ruta de administrador', async () => {
      const res = await request(app)
        .get(RUTA_ADMIN)
        .set({ Cookie: 'token=token-malo' });
      expect(res.status).toBe(403);
    });

    test('403 con token invalido en ruta de direccion', async () => {
      const res = await request(app)
        .get(RUTA_DIRECCION)
        .set({ Cookie: 'token=token-malo' });
      expect(res.status).toBe(403);
    });
  });

  // ─── ROL ESTUDIANTE (1 acceso permitido, 3 denegados) ──
  describe('rol estudiante', () => {
    test('accede a ruta de usuario', async () => {
      const res = await request(app)
        .get(RUTA_USUARIO)
        .set(authCookie(tokenEstudiante));
      expect(res.status).toBe(200);
    });

    test('denegado en ruta de supervisor', async () => {
      const res = await request(app)
        .get(RUTA_SUPERVISOR)
        .set(authCookie(tokenEstudiante));
      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/denegado/i);
    });

    test('denegado en ruta de administrador', async () => {
      const res = await request(app)
        .get(RUTA_ADMIN)
        .set(authCookie(tokenEstudiante));
      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/denegado/i);
    });

    test('denegado en ruta de direccion', async () => {
      const res = await request(app)
        .get(RUTA_DIRECCION)
        .set(authCookie(tokenEstudiante));
      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/denegado/i);
    });
  });

  // ─── ROL SUPERVISOR (2 accesos permitidos, 2 denegados) ─
  describe('rol supervisor', () => {
    test('accede a ruta de usuario', async () => {
      const res = await request(app)
        .get(RUTA_USUARIO)
        .set(authCookie(tokenSupervisor));
      expect(res.status).toBe(200);
    });

    test('accede a ruta de supervisor', async () => {
      const res = await request(app)
        .get(RUTA_SUPERVISOR)
        .set(authCookie(tokenSupervisor));
      expect(res.status).toBe(200);
    });

    test('denegado en ruta de administrador', async () => {
      const res = await request(app)
        .get(RUTA_ADMIN)
        .set(authCookie(tokenSupervisor));
      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/denegado/i);
    });

    test('denegado en ruta de direccion', async () => {
      const res = await request(app)
        .get(RUTA_DIRECCION)
        .set(authCookie(tokenSupervisor));
      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/denegado/i);
    });
  });

  // ─── ROL ADMINISTRADOR (4 accesos permitidos) ──────────
  describe('rol administrador', () => {
    test('accede a ruta de usuario', async () => {
      const res = await request(app)
        .get(RUTA_USUARIO)
        .set(authCookie(tokenAdmin));
      expect(res.status).toBe(200);
    });

    test('accede a ruta de supervisor', async () => {
      const res = await request(app)
        .get(RUTA_SUPERVISOR)
        .set(authCookie(tokenAdmin));
      expect(res.status).toBe(200);
    });

    test('accede a ruta de administrador', async () => {
      const res = await request(app)
        .get(RUTA_ADMIN)
        .set(authCookie(tokenAdmin));
      expect(res.status).toBe(200);
    });

    test('accede a ruta de direccion', async () => {
      const res = await request(app)
        .get(RUTA_DIRECCION)
        .set(authCookie(tokenAdmin));
      expect(res.status).toBe(200);
    });
  });

  // ─── ROL DIRECCION (2 accesos permitidos, 2 denegados) ─
  describe('rol direccion', () => {
    test('accede a ruta de usuario', async () => {
      const res = await request(app)
        .get(RUTA_USUARIO)
        .set(authCookie(tokenDireccion));
      expect(res.status).toBe(200);
    });

    test('denegado en ruta de supervisor', async () => {
      const res = await request(app)
        .get(RUTA_SUPERVISOR)
        .set(authCookie(tokenDireccion));
      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/denegado/i);
    });

    test('denegado en ruta de administrador', async () => {
      const res = await request(app)
        .get(RUTA_ADMIN)
        .set(authCookie(tokenDireccion));
      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/denegado/i);
    });

    test('accede a ruta de direccion', async () => {
      const res = await request(app)
        .get(RUTA_DIRECCION)
        .set(authCookie(tokenDireccion));
      expect(res.status).toBe(200);
    });
  });
});
