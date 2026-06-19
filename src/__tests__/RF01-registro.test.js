// ============================================================
// RF01-registro.test.js
// Cobertura: RF01 (Registro de usuario)
// CUS01: El usuario crea su cuenta ingresando datos personales,
//        del vehiculo y de su licencia.
// ============================================================

const request = require('supertest');
const app = require('../app');
const { createTestUser } = require('./helpers');

describe('RF01 - Registro de usuario [CUS01]', () => {
  const baseUser = () => ({
    codigo_universitario: `U${Date.now()}E`,
    nombre: 'Juan Perez',
    password: 'clave123',
    fecha_nacimiento: '2000-01-15',
    correo_institucional: `juan${Date.now()}@utp.edu.pe`,
    nro_licencia: `L${Date.now()}`,
    licencia_fecha_vencimiento: '2030-12-31',
    placa: `ABC-${String(Date.now()).slice(-3)}`,
    modelo: 'Sedan',
    tipo_vehiculo_id: 'auto',
  });

  test('registro exitoso con todos los campos validos', async () => {
    // ARRANGE
    const datos = baseUser();

    // ACT
    const res = await request(app).post('/api/auth/register').send(datos);

    // ASSERT
    expect(res.status).toBe(201);
    expect(res.body.mensaje).toBe('Usuario registrado');
  });

  test('E1: rechaza registro con campos obligatorios vacios', async () => {
    // ARRANGE
    const datos = {};

    // ACT
    const res = await request(app).post('/api/auth/register').send(datos);

    // ASSERT
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test('E2: rechaza registro con codigo institucional ya existente', async () => {
    // ARRANGE
    const datos = baseUser();
    await request(app).post('/api/auth/register').send(datos);

    // ACT
    const res = await request(app).post('/api/auth/register').send(datos);

    // ASSERT
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/ya existe/i);
  });

  test('rechaza registro con correo no UTP', async () => {
    // ARRANGE
    const datos = { ...baseUser(), correo_institucional: 'juan@gmail.com', codigo_universitario: `U${Date.now()}X` };

    // ACT
    const res = await request(app).post('/api/auth/register').send(datos);

    // ASSERT
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/institucional/i);
  });

  test('E3: rechaza registro con licencia vencida', async () => {
    // ARRANGE
    const datos = { ...baseUser(), licencia_fecha_vencimiento: '2020-01-01', codigo_universitario: `U${Date.now()}Y` };

    // ACT
    const res = await request(app).post('/api/auth/register').send(datos);

    // ASSERT
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/vencida/i);
  });

  test('rechaza registro con placa formato invalido', async () => {
    // ARRANGE
    const datos = { ...baseUser(), placa: '12345', codigo_universitario: `U${Date.now()}Z` };

    // ACT
    const res = await request(app).post('/api/auth/register').send(datos);

    // ASSERT
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/formato/i);
  });

  test('rechaza registro con placa ya registrada por otro usuario', async () => {
    // ARRANGE
    const userA = baseUser();
    await request(app).post('/api/auth/register').send(userA);
    const datos = { ...baseUser(), codigo_universitario: `U${Date.now()}B`, placa: userA.placa };

    // ACT
    const res = await request(app).post('/api/auth/register').send(datos);

    // ASSERT
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/ya existe/i);
  });

  test('rechaza registro con password menor a 6 caracteres', async () => {
    // ARRANGE
    const datos = { ...baseUser(), password: '123', codigo_universitario: `U${Date.now()}C` };

    // ACT
    const res = await request(app).post('/api/auth/register').send(datos);

    // ASSERT
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/6 caracteres/i);
  });
});
