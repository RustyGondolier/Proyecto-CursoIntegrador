// ============================================================
// RF03-perfil.test.js
// Cobertura: RF03 (Gestion de perfil de usuario)
// CUS03: El usuario visualiza y modifica sus datos personales.
//        Al modificar, la verificacion vuelve a "pendiente".
// ============================================================

const request = require('supertest');
const app = require('../app');
const { createTestUser, authCookie } = require('./helpers');

describe('RF03 - Gestion de perfil [CUS03]', () => {
  let token, usuario;

  beforeAll(async () => {
    // ARRANGE
    const data = await createTestUser();
    token = data.token;
    usuario = data.usuario;
  });

  test('obtener perfil propio', async () => {
    // ARRANGE
    // Usuario ya creado en beforeAll

    // ACT
    const res = await request(app).get('/api/usuarios/me').set(authCookie(token));

    // ASSERT
    expect(res.status).toBe(200);
    expect(res.body.nombre).toBe(usuario.nombre);
    expect(res.body.codigo_universitario).toBe(usuario.codigo_universitario);
    expect(res.body.rol).toBe(usuario.rol);
    expect(res.body).not.toHaveProperty('password_hash');
  });

  test('actualizar nombre exitosamente', async () => {
    // ARRANGE
    const datos = { nombre: 'Nuevo Nombre' };

    // ACT
    const res = await request(app).put('/api/usuarios/me').set(authCookie(token)).send(datos);

    // ASSERT
    expect(res.status).toBe(200);
    expect(res.body.nombre).toBe('Nuevo Nombre');
  });

  test('E1: rechaza nombre con menos de 2 caracteres', async () => {
    // ARRANGE
    const datos = { nombre: 'A' };

    // ACT
    const res = await request(app).put('/api/usuarios/me').set(authCookie(token)).send(datos);

    // ASSERT
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/2 caracteres/i);
  });

  test('E1: rechaza correo no institucional', async () => {
    // ARRANGE
    const datos = { correo_institucional: 'test@gmail.com' };

    // ACT
    const res = await request(app).put('/api/usuarios/me').set(authCookie(token)).send(datos);

    // ASSERT
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/institucional/i);
  });

  test('E1: rechaza DNI con formato invalido', async () => {
    // ARRANGE
    const datos = { dni: '1234' };

    // ACT
    const res = await request(app).put('/api/usuarios/me').set(authCookie(token)).send(datos);

    // ASSERT
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/8 d.gitos/i);
  });

  test('E1: rechaza licencia vencida', async () => {
    // ARRANGE
    const datos = { licencia_fecha_vencimiento: '2020-01-01' };

    // ACT
    const res = await request(app).put('/api/usuarios/me').set(authCookie(token)).send(datos);

    // ASSERT
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/vencida/i);
  });

  test('actualizar datos reinicia la verificacion del perfil', async () => {
    // ARRANGE
    const datos = { telefono: '999888777' };

    // ACT
    const res = await request(app).put('/api/usuarios/me').set(authCookie(token)).send(datos);

    // ASSERT
    expect(res.status).toBe(200);
    expect(res.body.requiere_reverificacion).toBe(true);
    expect(res.body.verificado).toBe(false);
  });

  test('E2: devuelve 401 sin token', async () => {
    // ARRANGE
    // No se envia token

    // ACT
    const res = await request(app).get('/api/usuarios/me');

    // ASSERT
    expect(res.status).toBe(401);
  });
});

describe('RF03 - Cambio de contrasena', () => {
  let token;

  beforeAll(async () => {
    // ARRANGE
    const data = await createTestUser();
    token = data.token;
  });

  test('cambiar contrasena exitosamente', async () => {
    // ARRANGE
    const datos = { actual: 'password123', nueva: 'nuevaClave456', confirmar: 'nuevaClave456' };

    // ACT
    const res = await request(app).put('/api/usuarios/me/password').set(authCookie(token)).send(datos);

    // ASSERT
    expect(res.status).toBe(200);
    expect(res.body.mensaje).toMatch(/actualizada/i);
  });

  test('rechaza cambio con contrasena actual incorrecta', async () => {
    // ARRANGE
    const datos = { actual: 'incorrecta', nueva: 'nuevaClave456', confirmar: 'nuevaClave456' };

    // ACT
    const res = await request(app).put('/api/usuarios/me/password').set(authCookie(token)).send(datos);

    // ASSERT
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/actual no es correcta/i);
  });

  test('rechaza cambio si nueva y confirmar no coinciden', async () => {
    // ARRANGE
    const datos = { actual: 'password123', nueva: 'nuevaClave456', confirmar: 'distinta' };

    // ACT
    const res = await request(app).put('/api/usuarios/me/password').set(authCookie(token)).send(datos);

    // ASSERT
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/no coinciden/i);
  });

  test('rechaza cambio sin todos los campos', async () => {
    // ARRANGE
    const datos = {};

    // ACT
    const res = await request(app).put('/api/usuarios/me/password').set(authCookie(token)).send(datos);

    // ASSERT
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/requeridos/i);
  });
});
