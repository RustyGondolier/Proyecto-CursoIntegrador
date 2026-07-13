// ============================================================
// RF06-dashboard.test.js
// Cobertura: RF06 (Dashboard principal con contadores)
// CUS06: Muestra total de plazas disponibles y ocupadas
//        por cochera, actualizado en tiempo real.
// ============================================================

const request = require('supertest');
const app = require('../app');
const pool = require('../../db');
const { createTestUser, authCookie, seedPlazasOcupadas } = require('./helpers');

describe('RF06 - Dashboard contadores [CUS06]', () => {
  let token;

  beforeAll(async () => {
    // ARRANGE
    await pool.query(`UPDATE plazas SET estado = 'disponible'`);
    await pool.query(`UPDATE solicitudes_estacionamiento SET estado = 'cancelado' WHERE estado = 'pendiente'`);
    const data = await createTestUser();
    token = data.token;
  });

  test('CP02: error al obtener estado actualizado (E1)', async () => {
    // ARRANGE - poblar cache con una consulta exitosa primero
    await request(app).get('/api/estacionamientos/ocupacion').set(authCookie(token));

    // ACT - forzar error en el backend
    const res = await request(app).get('/api/estacionamientos/ocupacion?force_error=1').set(authCookie(token));

    // ASSERT
    expect(res.status).toBe(200);
    expect(res.body.advertencia).toMatch(/no se pudo obtener|actualizada/i);
    expect(Array.isArray(res.body.datos)).toBe(true);
  });

  test('obtener ocupacion de todas las cocheras', async () => {
    // ARRANGE
    // Datos de BD ya preparados en beforeAll

    // ACT
    const res = await request(app).get('/api/estacionamientos/ocupacion').set(authCookie(token));

    // ASSERT
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);

    res.body.forEach((cochera) => {
      expect(cochera).toHaveProperty('id');
      expect(cochera).toHaveProperty('nombre');
      expect(cochera).toHaveProperty('autos_total');
      expect(cochera).toHaveProperty('motos_total');
      expect(cochera).toHaveProperty('autos_ocupados');
      expect(cochera).toHaveProperty('motos_ocupadas');
    });
  });

  test('contadores coherentes (ocupados no excede total)', async () => {
    // ARRANGE
    // Datos ya listos

    // ACT
    const res = await request(app).get('/api/estacionamientos/ocupacion').set(authCookie(token));

    // ASSERT
    expect(res.status).toBe(200);

    res.body.forEach((cochera) => {
      expect(Number(cochera.autos_ocupados)).toBeLessThanOrEqual(Number(cochera.autos_total));
      expect(Number(cochera.motos_ocupadas)).toBeLessThanOrEqual(Number(cochera.motos_total));
    });
  });

  test('contadores nunca son negativos', async () => {
    // ARRANGE
    // Datos ya listos

    // ACT
    const res = await request(app).get('/api/estacionamientos/ocupacion').set(authCookie(token));

    // ASSERT
    expect(res.status).toBe(200);

    res.body.forEach((cochera) => {
      expect(Number(cochera.autos_ocupados)).toBeGreaterThanOrEqual(0);
      expect(Number(cochera.motos_ocupadas)).toBeGreaterThanOrEqual(0);
    });
  });

  test('contadores reflejan plazas ocupadas en BD', async () => {
    // ARRANGE
    await seedPlazasOcupadas(1, 3);

    // ACT
    const res = await request(app).get('/api/estacionamientos/ocupacion').set(authCookie(token));

    // ASSERT
    expect(res.status).toBe(200);

    const est1 = res.body.find((e) => e.nombre === 'Estacionamiento 1');
    expect(est1).toBeDefined();
    expect(Number(est1.autos_ocupados)).toBe(3);
  });

  test('listar estacionamientos disponibles', async () => {
    // ARRANGE
    // Datos ya listos

    // ACT
    const res = await request(app).get('/api/estacionamientos/').set(authCookie(token));

    // ASSERT
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  test('E1: devuelve 401 sin autenticacion', async () => {
    // ARRANGE
    // No se envia token

    // ACT
    const res = await request(app).get('/api/estacionamientos/ocupacion');

    // ASSERT
    expect(res.status).toBe(401);
  });

  test('E2: dashboard refleja estacionamiento completamente ocupado', async () => {
    // ARRANGE - ocupar todas las plazas del estacionamiento 1 (8 auto + 8 moto)
    await seedPlazasOcupadas(1, 16);

    // ACT
    const res = await request(app).get('/api/estacionamientos/ocupacion').set(authCookie(token));

    // ASSERT
    expect(res.status).toBe(200);

    const est1 = res.body.find((e) => e.nombre === 'Estacionamiento 1');
    expect(est1).toBeDefined();
    expect(Number(est1.autos_ocupados)).toBe(Number(est1.autos_total));
    expect(Number(est1.motos_ocupadas)).toBe(Number(est1.motos_total));
  });

  afterAll(async () => {
    await pool.end();
  });
});
