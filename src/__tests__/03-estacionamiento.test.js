// ============================================================
// 03-estacionamiento.test.js
// Cobertura: RF06 (Dashboard principal con contadores)
// ============================================================

const request = require('supertest');
const app = require('../app');
const pool = require('../../db');
const { createTestUser, authCookie, seedPlazasOcupadas } = require('./helpers');

// ────────────────────────────────────────────────────────────
// RF06 — Dashboard principal con contadores de plazas
// CUS06: Muestra total de plazas disponibles y ocupadas
//        por cochera, actualizado en tiempo real.
// ────────────────────────────────────────────────────────────
describe('RF06 - Dashboard contadores [CUS06]', () => {
  let token;

  beforeAll(async () => {
    await pool.query(`UPDATE plazas SET estado = 'disponible'`);
    await pool.query(
      `UPDATE solicitudes_estacionamiento SET estado = 'cancelado' WHERE estado = 'pendiente'`,
    );
    const data = await createTestUser();
    token = data.token;
  });

  // Escenario exitoso: obtener ocupacion de las 2 cocheras con sus contadores
  test('obtener ocupacion de todas las cocheras', async () => {
    const res = await request(app).get('/api/estacionamientos/ocupacion').set(authCookie(token));
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

  // Escenario de verificacion: ocupados no debe superar el total de plazas
  test('contadores coherentes (ocupados no excede total)', async () => {
    const res = await request(app).get('/api/estacionamientos/ocupacion').set(authCookie(token));
    expect(res.status).toBe(200);

    res.body.forEach((cochera) => {
      expect(Number(cochera.autos_ocupados)).toBeLessThanOrEqual(Number(cochera.autos_total));
      expect(Number(cochera.motos_ocupadas)).toBeLessThanOrEqual(Number(cochera.motos_total));
    });
  });

  // Escenario de verificacion: contadores no deben ser negativos
  test('contadores nunca son negativos', async () => {
    const res = await request(app).get('/api/estacionamientos/ocupacion').set(authCookie(token));
    expect(res.status).toBe(200);

    res.body.forEach((cochera) => {
      expect(Number(cochera.autos_ocupados)).toBeGreaterThanOrEqual(0);
      expect(Number(cochera.motos_ocupadas)).toBeGreaterThanOrEqual(0);
    });
  });

  // Escenario exitoso: seedPlazasOcupadas se refleja en los contadores
  test('contadores reflejan plazas ocupadas en BD', async () => {
    await seedPlazasOcupadas(1, 3);

    const res = await request(app).get('/api/estacionamientos/ocupacion').set(authCookie(token));
    expect(res.status).toBe(200);

    const est1 = res.body.find((e) => e.nombre === 'Estacionamiento 1');
    expect(est1).toBeDefined();
    expect(Number(est1.autos_ocupados)).toBe(3);
  });

  // Escenario exitoso: listar todos los estacionamientos registrados
  test('listar estacionamientos disponibles', async () => {
    const res = await request(app).get('/api/estacionamientos/').set(authCookie(token));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  // Escenario de excepcion (E1): sin token de autenticacion
  test('E1: devuelve 401 sin autenticacion', async () => {
    const res = await request(app).get('/api/estacionamientos/ocupacion');
    expect(res.status).toBe(401);
  });

  afterAll(async () => {
    await pool.end();
  });
});
