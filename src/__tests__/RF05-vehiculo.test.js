// ============================================================
// RF05-vehiculo.test.js
// Cobertura: RF05 (Gestion de datos del vehiculo)
// CUS05: El usuario registra, visualiza y modifica su vehiculo.
//        Al modificar, la verificacion se reinicia.
// ============================================================

const request = require('supertest');
const app = require('../app');
const { createTestUser, authCookie } = require('./helpers');

describe('RF05 - Gestion de vehiculo [CUS05]', () => {
  let token, usuario;

  beforeAll(async () => {
    // ARRANGE
    const data = await createTestUser();
    token = data.token;
    usuario = data.usuario;
  });

  test('listar vehiculos del usuario (inicialmente vacio)', async () => {
    // ARRANGE
    // Usuario creado en beforeAll sin vehiculos

    // ACT
    const res = await request(app).get('/api/usuarios/me/vehiculos').set(authCookie(token));

    // ASSERT
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  test('crear vehiculo exitosamente', async () => {
    // ARRANGE
    const suffix = String(Date.now()).slice(-3);
    const datos = { tipo_vehiculo_id: 'auto', placa: `XYZ-${suffix}`, modelo: 'Hatchback' };

    // ACT
    const res = await request(app).post('/api/usuarios/me/vehiculos').set(authCookie(token)).send(datos);

    // ASSERT
    expect(res.status).toBe(201);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
  });

  test('E1: rechaza vehiculo con placa formato invalido', async () => {
    // ARRANGE
    const datos = { tipo_vehiculo_id: 'auto', placa: '12345', modelo: 'Test' };

    // ACT
    const res = await request(app).post('/api/usuarios/me/vehiculos').set(authCookie(token)).send(datos);

    // ASSERT
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/formato/i);
  });

  test('E2: rechaza vehiculo con placa ya registrada', async () => {
    // ARRANGE
    const suffix = String(Date.now()).slice(-3);
    const placa = `DUP-${suffix}`;
    await request(app).post('/api/usuarios/me/vehiculos').set(authCookie(token)).send({ tipo_vehiculo_id: 'auto', placa, modelo: 'Uno' });

    // ACT
    const res = await request(app).post('/api/usuarios/me/vehiculos').set(authCookie(token)).send({ tipo_vehiculo_id: 'auto', placa, modelo: 'Dos' });

    // ASSERT
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/registrada/i);
  });

  test('crear vehiculo reinicia verificacion del perfil', async () => {
    // ARRANGE
    const suffix = String(Date.now()).slice(-3);
    const datos = { tipo_vehiculo_id: 'auto', placa: `VER-${suffix}`, modelo: 'Test' };

    // ACT
    await request(app).post('/api/usuarios/me/vehiculos').set(authCookie(token)).send(datos);

    // ASSERT
    const perfil = await request(app).get('/api/usuarios/me').set(authCookie(token));
    expect(perfil.body.requiere_reverificacion).toBe(true);
    expect(perfil.body.verificado).toBe(false);
  });

  test('actualizar vehiculo exitosamente', async () => {
    // ARRANGE
    const suffix = String(Date.now()).slice(-3);
    const placa = `UPD-${suffix}`;
    const crear = await request(app).post('/api/usuarios/me/vehiculos').set(authCookie(token)).send({ tipo_vehiculo_id: 'auto', placa, modelo: 'Original' });
    const vehicleId = crear.body.at(-1).id;
    const datos = { tipo_vehiculo_id: 'auto', placa, modelo: 'Actualizado' };

    // ACT
    const res = await request(app).put(`/api/usuarios/me/vehiculos/${vehicleId}`).set(authCookie(token)).send(datos);

    // ASSERT
    expect(res.status).toBe(200);
  });

  test('rechaza actualizar vehiculo de otro usuario', async () => {
    // ARRANGE
    const otro = await createTestUser({ codigo_universitario: `U${Date.now()}OTRO` });
    const suffix = String(Date.now()).slice(-3);
    const crear = await request(app).post('/api/usuarios/me/vehiculos').set(authCookie(otro.token)).send({ tipo_vehiculo_id: 'auto', placa: `OTR-${suffix}`, modelo: 'Otro' });

    // ACT
    const res = await request(app).put(`/api/usuarios/me/vehiculos/${crear.body[0].id}`).set(authCookie(token)).send({ modelo: 'No deberia' });

    // ASSERT
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/no pertenece/i);
  });

  test('eliminar vehiculo exitosamente', async () => {
    // ARRANGE
    const suffix = String(Date.now()).slice(-3);
    const crear = await request(app).post('/api/usuarios/me/vehiculos').set(authCookie(token)).send({ tipo_vehiculo_id: 'auto', placa: `DEL-${suffix}`, modelo: 'Borrar' });
    const deleteId = crear.body.at(-1).id;

    // ACT
    const res = await request(app).delete(`/api/usuarios/me/vehiculos/${deleteId}`).set(authCookie(token));

    // ASSERT
    expect(res.status).toBe(200);
  });

  test('activar vehiculo como principal', async () => {
    // ARRANGE
    const userData = await createTestUser({ codigo_universitario: `U${Date.now()}ACT` });
    const userToken = userData.token;
    const suffixA = String(Date.now()).slice(-3);
    const suffixB = String(Date.now() + 1).slice(-3);
    const vhA = await request(app).post('/api/usuarios/me/vehiculos').set(authCookie(userToken)).send({ tipo_vehiculo_id: 'auto', placa: `ACT-${suffixA}`, modelo: 'A' });
    const idA = vhA.body[0].id;
    await request(app).post('/api/usuarios/me/vehiculos').set(authCookie(userToken)).send({ tipo_vehiculo_id: 'auto', placa: `ACT-${suffixB}`, modelo: 'B' });

    // ACT
    const res = await request(app).patch(`/api/usuarios/me/vehiculos/${idA}/activar`).set(authCookie(userToken));

    // ASSERT
    expect(res.status).toBe(200);
    const lista = await request(app).get('/api/usuarios/me/vehiculos').set(authCookie(userToken));
    const activo = lista.body.find((v) => v.activo === true);
    expect(activo).toBeDefined();
    expect(activo.id).toBe(idA);
  });
});
