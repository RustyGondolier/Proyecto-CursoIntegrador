// ============================================================
// 01-auth.test.js
// Cobertura: RF01 (Registro), RF02 (Login), RF04 (Logout)
// ============================================================

const request = require('supertest');
const app = require('../app');
const { pool } = require('../../db');
const { createTestUser, authCookie } = require('./helpers');

// ────────────────────────────────────────────────────────────
// RF01 — Registro de usuario
// CUS01: El usuario crea su cuenta ingresando datos personales,
//        del vehiculo y de su licencia.
// ────────────────────────────────────────────────────────────
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
    tipo_vehiculo_id: 'auto'
  });

  // Escenario exitoso
  test('registro exitoso con todos los campos validos', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(baseUser());
    expect(res.status).toBe(201);
    expect(res.body.mensaje).toBe('Usuario registrado');
  });

  // E1: Campos obligatorios vacios
  test('E1: rechaza registro con campos obligatorios vacios', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  // E2: Codigo institucional duplicado
  test('E2: rechaza registro con codigo institucional ya existente', async () => {
    const user = baseUser();
    await request(app).post('/api/auth/register').send(user);
    const res = await request(app).post('/api/auth/register').send(user);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/ya existe/i);
  });

  // Correo no institucional
  test('rechaza registro con correo no UTP', async () => {
    const res = await request(app).post('/api/auth/register').send({
      ...baseUser(),
      correo_institucional: 'juan@gmail.com',
      codigo_universitario: `U${Date.now()}X`
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/institucional/i);
  });

  // E3: Licencia vencida
  test('E3: rechaza registro con licencia vencida', async () => {
    const res = await request(app).post('/api/auth/register').send({
      ...baseUser(),
      licencia_fecha_vencimiento: '2020-01-01',
      codigo_universitario: `U${Date.now()}Y`
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/vencida/i);
  });

  // Placa con formato invalido
  test('rechaza registro con placa formato invalido', async () => {
    const res = await request(app).post('/api/auth/register').send({
      ...baseUser(),
      placa: '12345',
      codigo_universitario: `U${Date.now()}Z`
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/formato/i);
  });

  // Placa duplicada
  test('rechaza registro con placa ya registrada por otro usuario', async () => {
    const userA = baseUser();
    await request(app).post('/api/auth/register').send(userA);
    const res = await request(app).post('/api/auth/register').send({
      ...baseUser(),
      codigo_universitario: `U${Date.now()}B`,
      placa: userA.placa
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/ya existe/i);
  });

  // Contrasena corta
  test('rechaza registro con password menor a 6 caracteres', async () => {
    const res = await request(app).post('/api/auth/register').send({
      ...baseUser(),
      password: '123',
      codigo_universitario: `U${Date.now()}C`
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/6 caracteres/i);
  });
});

// ────────────────────────────────────────────────────────────
// RF02 — Inicio de sesion
// CUS02: El usuario accede a la plataforma con su codigo y
//        contrasena. Redirige al dashboard segun rol.
// ────────────────────────────────────────────────────────────
describe('RF02 - Inicio de sesion [CUS02]', () => {
  let credenciales;

  beforeAll(async () => {
    const { usuario } = await createTestUser();
    credenciales = {
      codigo_universitario: usuario.codigo_universitario,
      password: 'password123'
    };
  });

  // Escenario exitoso
  test('login exitoso con credenciales validas', async () => {
    const { usuario } = await createTestUser({
      codigo_universitario: `U${Date.now()}LOGIN`
    });
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        codigo_universitario: usuario.codigo_universitario,
        password: 'password123'
      });
    expect(res.status).toBe(200);
    expect(res.body.usuario).toBeDefined();
    expect(res.body.usuario.rol).toBe('estudiante');
    expect(res.body.usuario.nombre).toBeDefined();
    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.headers['set-cookie'][0]).toMatch(/token=/);
  });

  // E1: Contrasena incorrecta
  test('E1: rechaza login con contrasena incorrecta', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ ...credenciales, password: 'incorrecta' });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/credenciales/i);
  });

  // E1: Codigo inexistente
  test('E1: rechaza login con codigo inexistente (mismo mensaje)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ codigo_universitario: 'NOEXISTE', password: 'x' });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/credenciales/i);
  });

  // E2: Cuenta suspendida
  test('E2: rechaza login de cuenta suspendida', async () => {
    const { usuario } = await createTestUser({
      estado_cuenta: 'suspendida',
      motivo_suspension: 'Documentacion incorrecta',
      codigo_universitario: `U${Date.now()}SUS`
    });
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        codigo_universitario: usuario.codigo_universitario,
        password: 'password123'
      });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/suspendida/i);
  });

  // Redireccion por rol — GET /api/auth/me devuelve el rol correcto
  test('login devuelve el rol correcto del usuario autenticado', async () => {
    const { token } = await createTestUser({
      rol: 'administrador',
      codigo_universitario: `U${Date.now()}ADM`
    });
    const res = await request(app)
      .get('/api/auth/me')
      .set(authCookie(token));
    expect(res.status).toBe(200);
    expect(res.body.usuario.rol).toBe('administrador');
  });
});

// ────────────────────────────────────────────────────────────
// RF04 — Cierre de sesion
// CUS04: El usuario cierra sesion y la cookie se invalida.
// ────────────────────────────────────────────────────────────
describe('RF04 - Cierre de sesion [CUS04]', () => {
  test('logout exitoso limpia la cookie', async () => {
    const res = await request(app)
      .post('/api/auth/logout');
    expect(res.status).toBe(200);
    expect(res.body.mensaje).toBeDefined();
    expect(res.headers['set-cookie']).toBeDefined();
  });
});
