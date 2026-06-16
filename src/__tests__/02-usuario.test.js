// ============================================================
// 02-usuario.test.js
// Cobertura: RF03 (Gestion de perfil), RF05 (Gestion vehiculo)
// ============================================================

const request = require('supertest');
const app = require('../app');
const { createTestUser, authCookie } = require('./helpers');

// ────────────────────────────────────────────────────────────
// RF03 — Gestion de perfil de usuario
// CUS03: El usuario visualiza y modifica sus datos personales.
//        Al modificar, la verificacion vuelve a "pendiente".
// ────────────────────────────────────────────────────────────
describe('RF03 - Gestion de perfil [CUS03]', () => {
  let token, usuario;

  beforeAll(async () => {
    const data = await createTestUser();
    token = data.token;
    usuario = data.usuario;
  });

  // Visualizar perfil
  test('obtener perfil propio', async () => {
    const res = await request(app)
      .get('/api/usuarios/me')
      .set(authCookie(token));
    expect(res.status).toBe(200);
    expect(res.body.nombre).toBe(usuario.nombre);
    expect(res.body.codigo_universitario).toBe(usuario.codigo_universitario);
    expect(res.body.rol).toBe(usuario.rol);
    expect(res.body).not.toHaveProperty('password_hash');
  });

  // Modificar nombre exitosamente
  test('actualizar nombre exitosamente', async () => {
    const res = await request(app)
      .put('/api/usuarios/me')
      .set(authCookie(token))
      .send({ nombre: 'Nuevo Nombre' });
    expect(res.status).toBe(200);
    expect(res.body.nombre).toBe('Nuevo Nombre');
  });

  // E1: Nombre muy corto
  test('E1: rechaza nombre con menos de 2 caracteres', async () => {
    const res = await request(app)
      .put('/api/usuarios/me')
      .set(authCookie(token))
      .send({ nombre: 'A' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/2 caracteres/i);
  });

  // E1: Correo no institucional
  test('E1: rechaza correo no institucional', async () => {
    const res = await request(app)
      .put('/api/usuarios/me')
      .set(authCookie(token))
      .send({ correo_institucional: 'test@gmail.com' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/institucional/i);
  });

  // E1: DNI invalido
  test('E1: rechaza DNI con formato invalido', async () => {
    const res = await request(app)
      .put('/api/usuarios/me')
      .set(authCookie(token))
      .send({ dni: '1234' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/8 dígitos/i);
  });

  // E1: Licencia vencida
  test('E1: rechaza licencia vencida', async () => {
    const res = await request(app)
      .put('/api/usuarios/me')
      .set(authCookie(token))
      .send({ licencia_fecha_vencimiento: '2020-01-01' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/vencida/i);
  });

  // Al modificar, reinicia verificacion
  test('actualizar datos reinicia la verificacion del perfil', async () => {
    const res = await request(app)
      .put('/api/usuarios/me')
      .set(authCookie(token))
      .send({ telefono: '999888777' });
    expect(res.status).toBe(200);
    expect(res.body.requiere_reverificacion).toBe(true);
    expect(res.body.verificado).toBe(false);
  });

  // E2: Sin autenticacion
  test('E2: devuelve 401 sin token', async () => {
    const res = await request(app)
      .get('/api/usuarios/me');
    expect(res.status).toBe(401);
  });
});

// ────────────────────────────────────────────────────────────
// RF05 — Gestion de datos del vehiculo
// CUS05: El usuario registra, visualiza y modifica su vehiculo.
//        Al modificar, la verificacion se reinicia.
// ────────────────────────────────────────────────────────────
describe('RF05 - Gestion de vehiculo [CUS05]', () => {
  let token, usuario;

  beforeAll(async () => {
    const data = await createTestUser();
    token = data.token;
    usuario = data.usuario;
  });

  // Listar vehiculos (vacio)
  test('listar vehiculos del usuario (inicialmente vacio)', async () => {
    const res = await request(app)
      .get('/api/usuarios/me/vehiculos')
      .set(authCookie(token));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  // Crear vehiculo exitosamente
  test('crear vehiculo exitosamente', async () => {
    const suffix = String(Date.now()).slice(-3);
    const res = await request(app)
      .post('/api/usuarios/me/vehiculos')
      .set(authCookie(token))
      .send({
        tipo_vehiculo_id: 'auto',
        placa: `XYZ-${suffix}`,
        modelo: 'Hatchback'
      });
    expect(res.status).toBe(201);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
  });

  // E1: Placa con formato invalido
  test('E1: rechaza vehiculo con placa formato invalido', async () => {
    const res = await request(app)
      .post('/api/usuarios/me/vehiculos')
      .set(authCookie(token))
      .send({
        tipo_vehiculo_id: 'auto',
        placa: '12345',
        modelo: 'Test'
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/formato/i);
  });

  // E2: Placa duplicada
  test('E2: rechaza vehiculo con placa ya registrada', async () => {
    const suffix = String(Date.now()).slice(-3);
    const placa = `DUP-${suffix}`;

    await request(app)
      .post('/api/usuarios/me/vehiculos')
      .set(authCookie(token))
      .send({ tipo_vehiculo_id: 'auto', placa, modelo: 'Uno' });

    const res = await request(app)
      .post('/api/usuarios/me/vehiculos')
      .set(authCookie(token))
      .send({ tipo_vehiculo_id: 'auto', placa, modelo: 'Dos' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/registrada/i);
  });

  // Crear vehiculo reinicia verificacion
  test('crear vehiculo reinicia verificacion del perfil', async () => {
    const suffix = String(Date.now()).slice(-3);
    await request(app)
      .post('/api/usuarios/me/vehiculos')
      .set(authCookie(token))
      .send({ tipo_vehiculo_id: 'auto', placa: `VER-${suffix}`, modelo: 'Test' });

    const perfil = await request(app)
      .get('/api/usuarios/me')
      .set(authCookie(token));
    expect(perfil.body.requiere_reverificacion).toBe(true);
    expect(perfil.body.verificado).toBe(false);
  });

  // Actualizar vehiculo
  test('actualizar vehiculo exitosamente', async () => {
    const suffix = String(Date.now()).slice(-3);
    const placa = `UPD-${suffix}`;

    const crear = await request(app)
      .post('/api/usuarios/me/vehiculos')
      .set(authCookie(token))
      .send({ tipo_vehiculo_id: 'auto', placa, modelo: 'Original' });

    const vehicleId = crear.body.at(-1).id;

    const res = await request(app)
      .put(`/api/usuarios/me/vehiculos/${vehicleId}`)
      .set(authCookie(token))
      .send({ tipo_vehiculo_id: 'auto', placa, modelo: 'Actualizado' });
    expect(res.status).toBe(200);
  });

  // Actualizar vehiculo que no pertenece al usuario
  test('rechaza actualizar vehiculo de otro usuario', async () => {
    const otro = await createTestUser({
      codigo_universitario: `U${Date.now()}OTRO`
    });
    const suffix = String(Date.now()).slice(-3);
    const crear = await request(app)
      .post('/api/usuarios/me/vehiculos')
      .set(authCookie(otro.token))
      .send({ tipo_vehiculo_id: 'auto', placa: `OTR-${suffix}`, modelo: 'Otro' });

    const res = await request(app)
      .put(`/api/usuarios/me/vehiculos/${crear.body[0].id}`)
      .set(authCookie(token))
      .send({ modelo: 'No deberia' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/no pertenece/i);
  });

  // Eliminar vehiculo
  test('eliminar vehiculo exitosamente', async () => {
    const suffix = String(Date.now()).slice(-3);
    const crear = await request(app)
      .post('/api/usuarios/me/vehiculos')
      .set(authCookie(token))
      .send({ tipo_vehiculo_id: 'auto', placa: `DEL-${suffix}`, modelo: 'Borrar' });

    const deleteId = crear.body.at(-1).id;
    const res = await request(app)
      .delete(`/api/usuarios/me/vehiculos/${deleteId}`)
      .set(authCookie(token));
    expect(res.status).toBe(200);
  });

  // Activar vehiculo
  test('activar vehiculo como principal', async () => {
    const userData = await createTestUser({
      codigo_universitario: `U${Date.now()}ACT`
    });
    const userToken = userData.token;

    const suffixA = String(Date.now()).slice(-3);
    const suffixB = String(Date.now() + 1).slice(-3);

    const vhA = await request(app)
      .post('/api/usuarios/me/vehiculos')
      .set(authCookie(userToken))
      .send({ tipo_vehiculo_id: 'auto', placa: `ACT-${suffixA}`, modelo: 'A' });
    const idA = vhA.body[0].id;

    await request(app)
      .post('/api/usuarios/me/vehiculos')
      .set(authCookie(userToken))
      .send({ tipo_vehiculo_id: 'auto', placa: `ACT-${suffixB}`, modelo: 'B' });

    const res = await request(app)
      .patch(`/api/usuarios/me/vehiculos/${idA}/activar`)
      .set(authCookie(userToken));
    expect(res.status).toBe(200);

    const lista = await request(app)
      .get('/api/usuarios/me/vehiculos')
      .set(authCookie(userToken));
    const activo = lista.body.find(v => v.activo === true);
    expect(activo).toBeDefined();
    expect(activo.id).toBe(idA);
  });
});

// ────────────────────────────────────────────────────────────
// RF03 — Cambio de contrasena
// ────────────────────────────────────────────────────────────
describe('RF03 - Cambio de contrasena', () => {
  let token, usuario;

  beforeAll(async () => {
    const data = await createTestUser();
    token = data.token;
    usuario = data.usuario;
  });

  // Cambio exitoso
  test('cambiar contrasena exitosamente', async () => {
    const res = await request(app)
      .put('/api/usuarios/me/password')
      .set(authCookie(token))
      .send({
        actual: 'password123',
        nueva: 'nuevaClave456',
        confirmar: 'nuevaClave456'
      });
    expect(res.status).toBe(200);
    expect(res.body.mensaje).toMatch(/actualizada/i);
  });

  // Contrasena actual incorrecta
  test('rechaza cambio con contrasena actual incorrecta', async () => {
    const res = await request(app)
      .put('/api/usuarios/me/password')
      .set(authCookie(token))
      .send({
        actual: 'incorrecta',
        nueva: 'nuevaClave456',
        confirmar: 'nuevaClave456'
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/actual no es correcta/i);
  });

  // Nueva y confirmar no coinciden
  test('rechaza cambio si nueva y confirmar no coinciden', async () => {
    const res = await request(app)
      .put('/api/usuarios/me/password')
      .set(authCookie(token))
      .send({
        actual: 'password123',
        nueva: 'nuevaClave456',
        confirmar: 'distinta'
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/no coinciden/i);
  });

  // Campos requeridos faltantes
  test('rechaza cambio sin todos los campos', async () => {
    const res = await request(app)
      .put('/api/usuarios/me/password')
      .set(authCookie(token))
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/requeridos/i);
  });
});
