// ============================================================
// 10-faq.test.js
// Cobertura: RF21 (Seccion de ayuda y preguntas frecuentes)
// ============================================================

const request = require('supertest');
const app = require('../app');
const { createTestUser, authCookie } = require('./helpers');

// ────────────────────────────────────────────────────────────
// RF21 — Seccion de ayuda y preguntas frecuentes
// CUS21: El usuario consulta las categorias de FAQ y las
//        preguntas/respuestas de cada categoria.
// ────────────────────────────────────────────────────────────
describe('RF21 - Seccion de ayuda y preguntas frecuentes [CUS21]', () => {
  let token;

  beforeAll(async () => {
    const data = await createTestUser();
    token = data.token;
  });

  // ── LISTAR CATEGORIAS ─────────────────────────────────────

  // Escenario exitoso: obtener las 4 categorias con id y nombre
  test('listar categorias de FAQ exitosamente', async () => {
    const res = await request(app)
      .get('/api/faq/')
      .set(authCookie(token));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(4);

    res.body.forEach(cat => {
      expect(cat).toHaveProperty('id');
      expect(cat).toHaveProperty('nombre');
    });

    const nombres = res.body.map(c => c.nombre);
    expect(nombres).toContain('General');
    expect(nombres).toContain('Solicitudes');
    expect(nombres).toContain('Incidencias');
    expect(nombres).toContain('Cuentas');
  });

  test('E1: 401 sin autenticacion al listar categorias', async () => {
    const res = await request(app)
      .get('/api/faq/');
    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  test('E1: 403 con token invalido al listar categorias', async () => {
    const res = await request(app)
      .get('/api/faq/')
      .set({ Cookie: 'token=token-invalido' });
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Token/);
  });

  // ── PREGUNTAS POR CATEGORIA ───────────────────────────────

  // Escenario exitoso: obtener preguntas de la categoria con id=1
  test('obtener preguntas de categoria existente', async () => {
    const res = await request(app)
      .get('/api/faq/1/preguntas')
      .set(authCookie(token));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);

    res.body.forEach(p => {
      expect(p).toHaveProperty('id');
      expect(p).toHaveProperty('pregunta');
      expect(p).toHaveProperty('respuesta');
    });
  });

  // Escenario exitoso: categoria inexistente devuelve array vacio
  test('categoria sin contenido devuelve array vacio', async () => {
    const res = await request(app)
      .get('/api/faq/999/preguntas')
      .set(authCookie(token));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  // Escenario de excepcion (E1): sin token de autenticacion
  test('E1: 401 sin autenticacion al obtener preguntas', async () => {
    const res = await request(app)
      .get('/api/faq/1/preguntas');
    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  // Escenario de excepcion (E1): token invalido / malformado
  test('E1: 403 con token invalido al obtener preguntas', async () => {
    const res = await request(app)
      .get('/api/faq/1/preguntas')
      .set({ Cookie: 'token=token-invalido' });
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Token/);
  });

  // Escenario exitoso: todas las categorias tienen preguntas asociadas
  test('todas las categorias retornan preguntas correctamente', async () => {
    for (const catId of [1, 2, 3, 4]) {
      const res = await request(app)
        .get(`/api/faq/${catId}/preguntas`)
        .set(authCookie(token));
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    }
  });
});
