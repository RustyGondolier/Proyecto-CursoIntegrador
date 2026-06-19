// ============================================================
// RF16-suspension.test.js
// Cobertura: RF16 (Suspension y reactivacion de cuenta)
// CUS16: El administrador suspende y reactiva cuentas.
// ============================================================

const request = require('supertest');
const app = require('../app');
const pool = require('../../db');
const { createTestUser, authCookie } = require('./helpers');

describe('RF16 - Suspension y reactivacion [CUS16]', () => {
  let adminToken, userActivo, userSuspendido;

  beforeAll(async () => {
    // ARRANGE
    await pool.query(`UPDATE solicitudes_estacionamiento SET estado = 'finalizado' WHERE estado IN ('pendiente', 'ingresado')`);

    const admin = await createTestUser({ rol: 'administrador', codigo_universitario: `U${Date.now()}ADM2` });
    adminToken = admin.token;

    userActivo = await createTestUser({ verificado: true, codigo_universitario: `U${Date.now()}ACT` });

    userSuspendido = await createTestUser({ verificado: false, estado_cuenta: 'suspendida', motivo_suspension: 'Documentacion incorrecta', codigo_universitario: `U${Date.now()}SUS` });
  });

  test('suspender cuenta con motivo valido', async () => {
    // ARRANGE
    const id = userActivo.usuario.id;
    const datos = { motivo: 'Documentacion incompleta y datos incorrectos' };

    // ACT
    const res = await request(app).put(`/api/administrador/usuarios/${id}/suspender`).set(authCookie(adminToken)).send(datos);

    // ASSERT
    expect(res.status).toBe(200);
    expect(res.body.mensaje).toMatch(/suspendid/i);
  });

  test('E1: 400 al suspender sin motivo', async () => {
    // ARRANGE
    const id = userActivo.usuario.id;
    const datos = {};

    // ACT
    const res = await request(app).put(`/api/administrador/usuarios/${id}/suspender`).set(authCookie(adminToken)).send(datos);

    // ASSERT
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/motivo/i);
  });

  test('E1: 400 al suspender con motivo muy corto', async () => {
    // ARRANGE
    const id = userActivo.usuario.id;
    const datos = { motivo: 'No' };

    // ACT
    const res = await request(app).put(`/api/administrador/usuarios/${id}/suspender`).set(authCookie(adminToken)).send(datos);

    // ASSERT
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/5 caracteres/i);
  });

  test('E1: 400 al suspender cuenta ya suspendida', async () => {
    // ARRANGE
    const id = userSuspendido.usuario.id;
    const datos = { motivo: 'Duplicado de suspension' };

    // ACT
    const res = await request(app).put(`/api/administrador/usuarios/${id}/suspender`).set(authCookie(adminToken)).send(datos);

    // ASSERT
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/suspendid/i);
  });

  test('reactivar cuenta suspendida', async () => {
    // ARRANGE
    const id = userSuspendido.usuario.id;

    // ACT
    const res = await request(app).put(`/api/administrador/usuarios/${id}/reactivar`).set(authCookie(adminToken));

    // ASSERT
    expect(res.status).toBe(200);
    expect(res.body.mensaje).toMatch(/reactivad/i);
  });

  test('E1: 400 al reactivar cuenta no suspendida', async () => {
    // ARRANGE
    const userNormal = await createTestUser({ codigo_universitario: `U${Date.now()}NORM` });

    // ACT
    const res = await request(app).put(`/api/administrador/usuarios/${userNormal.usuario.id}/reactivar`).set(authCookie(adminToken));

    // ASSERT
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/suspendid/i);
  });
});

afterAll(async () => {
  await pool.end();
});
