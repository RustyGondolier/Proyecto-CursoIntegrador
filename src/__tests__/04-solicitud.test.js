// ============================================================
// 04-solicitud.test.js
// Cobertura: RF07 (Solicitar plaza), RF08 (Cancelar),
//            RF20 (Historial de accesos)
// ============================================================

const request = require('supertest');
const app = require('../app');
const pool = require('../../db');
const {
  createTestUser,
  createTestVehicle,
  createTestSolicitud,
  createTestIngreso,
  authCookie,
} = require('./helpers');

// ────────────────────────────────────────────────────────────
// RF07 — Solicitud de acceso a estacionamiento
// CUS07: El usuario solicita una plaza cuando esta dentro
//        del radio de la sede. Reserva la plaza e incrementa
//        el contador. Si no ingresa en 30 min, se cancela.
// ────────────────────────────────────────────────────────────
describe('RF07 - Solicitud de acceso [CUS07]', () => {
  let token, usuario, vehiculo;

  beforeAll(async () => {
    const data = await createTestUser({ verificado: true });
    token = data.token;
    usuario = data.usuario;
    vehiculo = await createTestVehicle(usuario.id);
  });

  // Escenario exitoso: crear solicitud con ubicacion dentro del campus
  test('crear solicitud exitosa dentro del radio 2.5 km', async () => {
    const res = await request(app).post('/api/solicitudes/crear').set(authCookie(token)).send({
      estacionamiento_id: 1,
      lat: -12.1939,
      lng: -76.9715,
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.estado).toBe('pendiente');
  });

  // Escenario de excepcion (E1): ubicacion fuera del radio del campus
  test('E1: rechaza solicitud fuera del radio de la sede', async () => {
    await request(app).post('/api/solicitudes/cancelar').set(authCookie(token));

    const res = await request(app).post('/api/solicitudes/crear').set(authCookie(token)).send({
      estacionamiento_id: 1,
      lat: -12.1,
      lng: -77.0,
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/campus/i);
  });

  // Escenario de excepcion (E2): solicitud duplicada mientras una esta activa
  test('E2: rechaza solicitud si ya hay una activa', async () => {
    await request(app)
      .post('/api/solicitudes/crear')
      .set(authCookie(token))
      .send({ estacionamiento_id: 1, lat: -12.1939, lng: -76.9715 });

    const res = await request(app)
      .post('/api/solicitudes/crear')
      .set(authCookie(token))
      .send({ estacionamiento_id: 1, lat: -12.1939, lng: -76.9715 });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/activa/i);
  });

  // Escenario de excepcion: usuario sin vehiculos registrados
  test('rechaza solicitud sin vehiculo registrado', async () => {
    const userNoVh = await createTestUser({
      verificado: true,
      codigo_universitario: `U${Date.now()}NV`,
    });

    const res = await request(app)
      .post('/api/solicitudes/crear')
      .set(authCookie(userNoVh.token))
      .send({
        estacionamiento_id: 1,
        lat: -12.1939,
        lng: -76.9715,
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/veh[ií]culo/i);
  });

  // Escenario de excepcion: perfil del usuario no verificado
  test('rechaza solicitud con perfil no verificado', async () => {
    const userNoVer = await createTestUser({
      verificado: false,
      codigo_universitario: `U${Date.now()}NVER`,
    });
    await createTestVehicle(userNoVer.usuario.id);

    const res = await request(app)
      .post('/api/solicitudes/crear')
      .set(authCookie(userNoVer.token))
      .send({
        estacionamiento_id: 1,
        lat: -12.1939,
        lng: -76.9715,
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/verificad/i);
  });

  // Escenario de excepcion (E4): todas las plazas ocupadas
  test('E4: rechaza solicitud si estacionamiento esta lleno', async () => {
    await pool.query(
      `UPDATE plazas SET estado = 'ocupada'
       WHERE bloque_id IN (SELECT id FROM bloques WHERE estacionamiento_id = 1)`,
    );

    const userLleno = await createTestUser({
      verificado: true,
      codigo_universitario: `U${Date.now()}LLENO`,
    });
    await createTestVehicle(userLleno.usuario.id);

    const res = await request(app)
      .post('/api/solicitudes/crear')
      .set(authCookie(userLleno.token))
      .send({
        estacionamiento_id: 1,
        lat: -12.1939,
        lng: -76.9715,
      });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/disponible/i);

    await pool.query(`UPDATE plazas SET estado = 'disponible'`);
  });
});

// ────────────────────────────────────────────────────────────
// RF08 — Cancelacion de solicitud activa
// CUS08: El usuario cancela su solicitud antes del ingreso.
//        El contador disminuye en 1 y la plaza se libera.
// ────────────────────────────────────────────────────────────
describe('RF08 - Cancelacion de solicitud [CUS08]', () => {
  let token, usuario, vehiculo;

  beforeAll(async () => {
    const data = await createTestUser({ verificado: true });
    token = data.token;
    usuario = data.usuario;
    vehiculo = await createTestVehicle(usuario.id);
  });

  // Escenario exitoso: cancelar solicitud en estado pendiente
  test('cancelar solicitud activa exitosamente', async () => {
    await request(app)
      .post('/api/solicitudes/crear')
      .set(authCookie(token))
      .send({ estacionamiento_id: 1, lat: -12.1939, lng: -76.9715 });

    const res = await request(app).post('/api/solicitudes/cancelar').set(authCookie(token));
    expect(res.status).toBe(200);
    expect(res.body.mensaje).toMatch(/cancelada/i);
  });

  // Escenario de excepcion (E1): cancelar solicitud con ingreso confirmado
  test('E1: no permite cancelar si supervisor ya confirmo ingreso', async () => {
    const sup = await createTestUser({
      rol: 'supervisor',
      codigo_universitario: `U${Date.now()}SUP`,
    });
    const user = await createTestUser({
      verificado: true,
      codigo_universitario: `U${Date.now()}USER`,
    });
    const vh = await createTestVehicle(user.usuario.id);

    await createTestIngreso(user.usuario.id, vh.id, sup.usuario.id);

    const res = await request(app).post('/api/solicitudes/cancelar').set(authCookie(user.token));
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/supervisor/i);
  });

  // Escenario de excepcion: cancelar sin tener una solicitud activa
  test('rechaza cancelar sin solicitud activa', async () => {
    const res = await request(app).post('/api/solicitudes/cancelar').set(authCookie(token));
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/activa/i);
  });
});

// ────────────────────────────────────────────────────────────
// RF20 — Historial de accesos del usuario
// CUS20: El usuario consulta su historial con hora de
//        solicitud, ingreso oficial y salida por visita.
// ────────────────────────────────────────────────────────────
describe('RF20 - Historial de accesos [CUS20]', () => {
  let token, usuario;

  beforeAll(async () => {
    const data = await createTestUser({ verificado: true });
    token = data.token;
    usuario = data.usuario;
  });

  // Escenario de excepcion (E1): historial vacio para usuario sin actividad
  test('E1: permite consultar historial sin registros', async () => {
    const res = await request(app).get('/api/solicitudes/historial').set(authCookie(token));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // Escenario exitoso: historial refleja solicitudes creadas y canceladas
  test('historial incluye solicitudes realizadas', async () => {
    const vh = await createTestVehicle(usuario.id);

    await request(app)
      .post('/api/solicitudes/crear')
      .set(authCookie(token))
      .send({ estacionamiento_id: 1, lat: -12.1939, lng: -76.9715 });

    await request(app).post('/api/solicitudes/cancelar').set(authCookie(token));

    const res = await request(app).get('/api/solicitudes/historial').set(authCookie(token));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });
});
