const request = require('supertest');
const app = require('../app');
const pool = require('../../db');
const { createTestUser, authCookie } = require('./helpers');

describe('RF09 - Visualizacion del mapa del estacionamiento [CUS09]', () => {
  let token;

  beforeAll(async () => {
    const data = await createTestUser();
    token = data.token;
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('GET /api/estacionamientos/:id/plazas', () => {
    test('CP01: listar plazas de estacionamiento existente', async () => {
      // ARRANGE
      // El estacionamiento 1 existe en la BD (insertado en setup.js)

      // ACT
      const res = await request(app).get('/api/estacionamientos/1/plazas').set(authCookie(token));

      // ASSERT
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      res.body.forEach((plaza) => {
        expect(plaza).toHaveProperty('id');
        expect(plaza).toHaveProperty('codigo');
        expect(plaza).toHaveProperty('numero_plaza');
        expect(plaza).toHaveProperty('estado');
        expect(plaza).toHaveProperty('letra_bloque');
      });
    });

    test('CP01: plazas incluyen tipo de vehiculo del bloque', async () => {
      // ARRANGE
      // El estacionamiento 1 tiene bloques con tipo_vehiculo definido

      // ACT
      const res = await request(app).get('/api/estacionamientos/1/plazas').set(authCookie(token));

      // ASSERT
      expect(res.status).toBe(200);
      res.body.forEach((plaza) => {
        expect(plaza).toHaveProperty('tipo_vehiculo');
      });
    });

    test('E1: 401 sin autenticacion al listar plazas', async () => {
      // ARRANGE
      // No se envia cookie de autenticacion

      // ACT
      const res = await request(app).get('/api/estacionamientos/1/plazas');

      // ASSERT
      expect(res.status).toBe(401);
    });

    test('E1: 404 para estacionamiento inexistente', async () => {
      // ARRANGE
      // El estacionamiento 99999 no existe en la BD

      // ACT
      const res = await request(app).get('/api/estacionamientos/99999/plazas').set(authCookie(token));

      // ASSERT
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/estacionamientos/:id/mapa — endpoint dedicado del mapa', () => {
    test('CP01: endpoint mapa retorna configuracion del estacionamiento', async () => {
      // ARRANGE
      // El estacionamiento 1 tiene mapa configurado en la BD

      // ACT
      const res = await request(app).get('/api/estacionamientos/1/mapa').set(authCookie(token));

      // ASSERT
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('svg_url');
      expect(res.body).toHaveProperty('plazas');
      expect(res.body).toHaveProperty('capa_parking');
      expect(res.body).toHaveProperty('capa_rutas');
    });
  });
});
