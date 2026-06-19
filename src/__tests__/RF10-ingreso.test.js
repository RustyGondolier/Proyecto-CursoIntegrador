// ============================================================
// RF10-ingreso.test.js
// Cobertura: RF10 (Registro oficial de ingreso del vehiculo)
// CUS10: El supervisor confirma el ingreso fisico. La solicitud
//        pasa de "pendiente" a "ingresado". La plaza se marca
//        como ocupada.
// ============================================================

const request = require('supertest');
const app = require('../app');
const pool = require('../../db');
const { createTestUser, createTestVehicle, createTestSolicitud, authCookie } = require('./helpers');

describe('RF10 - Registro de ingreso [CUS10]', () => {
  let supToken, supervisor;
  let userToken, usuario, vehiculo;

  beforeAll(async () => {
    // ARRANGE
    const sup = await createTestUser({ rol: 'supervisor', codigo_universitario: `U${Date.now()}SUP` });
    supToken = sup.token;
    supervisor = sup.usuario;

    const user = await createTestUser({ verificado: true, codigo_universitario: `U${Date.now()}USR` });
    userToken = user.token;
    usuario = user.usuario;
    vehiculo = await createTestVehicle(usuario.id);
  });

  test('CP02: rechaza ingreso con solicitud_id inexistente (E1)', async () => {
    // ARRANGE
    const solicitud_id = 99999;
    const plaza = await pool.query(`SELECT id FROM plazas WHERE estado = 'disponible' LIMIT 1`);

    // ACT
    const res = await request(app).post('/api/supervisor/confirmar-ingreso').set(authCookie(supToken)).send({ solicitud_id, plaza_id: plaza.rows[0].id });

    // ASSERT
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/no encontrada|pendiente/i);
  });

  test('CP03: rechaza ingreso con datos invalidos (E2)', async () => {
    // ARRANGE
    const datos = {};

    // ACT
    const res = await request(app).post('/api/supervisor/confirmar-ingreso').set(authCookie(supToken)).send(datos);

    // ASSERT
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test('confirmar ingreso exitosamente', async () => {
    // ARRANGE
    const solicitud = await createTestSolicitud(usuario.id, vehiculo.id);
    const plaza = await pool.query(`SELECT id FROM plazas WHERE estado = 'disponible' LIMIT 1`);

    // ACT
    const res = await request(app).post('/api/supervisor/confirmar-ingreso').set(authCookie(supToken)).send({ solicitud_id: solicitud.id, plaza_id: plaza.rows[0].id });

    // ASSERT
    expect(res.status).toBe(200);
    expect(res.body.mensaje).toMatch(/confirmado/i);
  });

  test('E1: rechaza ingreso de solicitud ya confirmada', async () => {
    // ARRANGE
    const otroUser = await createTestUser({ verificado: true, codigo_universitario: `U${Date.now()}OTRO` });
    const otroVh = await createTestVehicle(otroUser.usuario.id);
    const solicitud = await createTestSolicitud(otroUser.usuario.id, otroVh.id);
    const plaza = await pool.query(`SELECT id FROM plazas WHERE estado = 'disponible' LIMIT 1`);
    await request(app).post('/api/supervisor/confirmar-ingreso').set(authCookie(supToken)).send({ solicitud_id: solicitud.id, plaza_id: plaza.rows[0].id });
    const otraPlaza = await pool.query(`SELECT id FROM plazas WHERE estado = 'disponible' LIMIT 1`);

    // ACT
    const res = await request(app).post('/api/supervisor/confirmar-ingreso').set(authCookie(supToken)).send({ solicitud_id: solicitud.id, plaza_id: otraPlaza.rows[0].id });

    // ASSERT
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/no encontrada|pendiente/i);
  });

  test('E2: rechaza con supervisor sin autenticacion', async () => {
    // ARRANGE
    const solicitud_id = 1;
    const plaza_id = 1;

    // ACT
    const res = await request(app).post('/api/supervisor/confirmar-ingreso').send({ solicitud_id, plaza_id });

    // ASSERT
    expect(res.status).toBe(401);
  });
});

afterAll(async () => {
  await pool.end();
});
