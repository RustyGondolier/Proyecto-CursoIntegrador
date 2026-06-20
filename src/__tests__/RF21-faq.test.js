// ============================================================
// RF21-faq.test.js
// Cobertura: RF21 (Seccion de ayuda y preguntas frecuentes)
// CUS21: El usuario consulta las categorias de FAQ y las
//        preguntas/respuestas de cada categoria.
// ============================================================

const request = require('supertest');
const app = require('../app');
const { createTestUser, authCookie } = require('./helpers');

describe('RF21 - Seccion de ayuda y preguntas frecuentes [CUS21]', () => {
  let token;

  beforeAll(async () => {
    // ARRANGE
    const data = await createTestUser();
    token = data.token;
  });

  describe('LISTAR CATEGORIAS', () => {
    test('listar categorias de FAQ exitosamente', async () => {
      // ARRANGE
      // Usuario autenticado

      // ACT
      const res = await request(app).get('/api/faq/').set(authCookie(token));

      // ASSERT
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(4);

      res.body.forEach((cat) => {
        expect(cat).toHaveProperty('id');
        expect(cat).toHaveProperty('nombre');
      });

      const nombres = res.body.map((c) => c.nombre);
      expect(nombres).toContain('General');
      expect(nombres).toContain('Solicitudes');
      expect(nombres).toContain('Incidencias');
      expect(nombres).toContain('Cuentas');
    });

    test('E1: 401 sin autenticacion al listar categorias', async () => {
      // ARRANGE
      // No se envia token

      // ACT
      const res = await request(app).get('/api/faq/');

      // ASSERT
      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
    });

    test('E1: 403 con token invalido al listar categorias', async () => {
      // ARRANGE
      const cookie = { Cookie: 'token=token-invalido' };

      // ACT
      const res = await request(app).get('/api/faq/').set(cookie);

      // ASSERT
      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/sesión ha expirado/i);
    });
  });

  describe('PREGUNTAS POR CATEGORIA', () => {
    test('obtener preguntas de categoria existente', async () => {
      // ARRANGE
      const categoriaId = 1;

      // ACT
      const res = await request(app).get(`/api/faq/${categoriaId}/preguntas`).set(authCookie(token));

      // ASSERT
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);

      res.body.forEach((p) => {
        expect(p).toHaveProperty('id');
        expect(p).toHaveProperty('pregunta');
        expect(p).toHaveProperty('respuesta');
      });
    });

    test('categoria sin contenido devuelve array vacio', async () => {
      // ARRANGE
      const categoriaId = 999;

      // ACT
      const res = await request(app).get(`/api/faq/${categoriaId}/preguntas`).set(authCookie(token));

      // ASSERT
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0);
    });

    test('E1: 401 sin autenticacion al obtener preguntas', async () => {
      // ARRANGE
      // No se envia token

      // ACT
      const res = await request(app).get('/api/faq/1/preguntas');

      // ASSERT
      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
    });

    test('E1: 403 con token invalido al obtener preguntas', async () => {
      // ARRANGE
      const cookie = { Cookie: 'token=token-invalido' };

      // ACT
      const res = await request(app).get('/api/faq/1/preguntas').set(cookie);

      // ASSERT
      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/sesión ha expirado/i);
    });

    test('todas las categorias retornan preguntas correctamente', async () => {
      // ARRANGE
      const categorias = [1, 2, 3, 4];

      // ACT & ASSERT
      for (const catId of categorias) {
        const res = await request(app).get(`/api/faq/${catId}/preguntas`).set(authCookie(token));
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
      }
    });
  });
});
