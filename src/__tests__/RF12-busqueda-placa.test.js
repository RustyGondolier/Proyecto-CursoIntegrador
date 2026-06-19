// ============================================================
// RF12-busqueda-placa.test.js
// Cobertura: RF12 (Busqueda de usuario por placa)
// CUS12: El supervisor busca un usuario ingresando la placa
//        para consultar su solicitud activa o datos.
// ============================================================

const request = require('supertest');
const app = require('../app');
const { createTestUser, createTestVehicle, authCookie } = require('./helpers');

describe('RF12 - Busqueda por placa [CUS12]', () => {
  let supToken;
  let vehiculo;

  beforeAll(async () => {
    // ARRANGE
    const sup = await createTestUser({ rol: 'supervisor', codigo_universitario: `U${Date.now()}SUP3` });
    supToken = sup.token;

    const user = await createTestUser({ verificado: true, codigo_universitario: `U${Date.now()}USR3` });
    vehiculo = await createTestVehicle(user.usuario.id, { placa: `SUP-${String(Date.now()).slice(-3)}` });
  });

  test('E2: rechaza busqueda con formato de placa invalido', async () => {
    // ARRANGE
    const placa = '12'; // Formato invalido

    // ACT
    const res = await request(app).get(`/api/supervisor/buscar?placa=${placa}`).set(authCookie(supToken));

    // ASSERT
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/formato/i);
  });

  test('buscar por placa existente', async () => {
    // ARRANGE
    const placa = vehiculo.placa;

    // ACT
    const res = await request(app).get(`/api/supervisor/buscar?placa=${placa}`).set(authCookie(supToken));

    // ASSERT
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('usuario_nombre');
    expect(res.body).toHaveProperty('placa');
  });

  test('E1: muestra error para placa no registrada', async () => {
    // ARRANGE
    const placa = 'XXX-999';

    // ACT
    const res = await request(app).get(`/api/supervisor/buscar?placa=${placa}`).set(authCookie(supToken));

    // ASSERT
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/no encontrado/i);
  });

  test('rechaza busqueda sin parametro placa', async () => {
    // ARRANGE
    // No se envia query param

    // ACT
    const res = await request(app).get('/api/supervisor/buscar').set(authCookie(supToken));

    // ASSERT
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/placa/i);
  });
});
