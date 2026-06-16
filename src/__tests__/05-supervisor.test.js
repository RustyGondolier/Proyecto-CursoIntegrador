// ============================================================
// 05-supervisor.test.js
// Cobertura: RF10 (Registro ingreso), RF11 (Registro salida),
//            RF12 (Busqueda por placa)
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
// RF10 — Registro oficial de ingreso del vehiculo
// CUS10: El supervisor confirma el ingreso fisico. La solicitud
//        pasa de "pendiente" a "ingresado". La plaza se marca
//        como ocupada. No modifica el contador.
// ────────────────────────────────────────────────────────────
describe('RF10 - Registro de ingreso [CUS10]', () => {
  let supToken, supervisor;
  let userToken, usuario, vehiculo;

  beforeAll(async () => {
    const sup = await createTestUser({
      rol: 'supervisor',
      codigo_universitario: `U${Date.now()}SUP`,
    });
    supToken = sup.token;
    supervisor = sup.usuario;

    const user = await createTestUser({
      verificado: true,
      codigo_universitario: `U${Date.now()}USR`,
    });
    userToken = user.token;
    usuario = user.usuario;
    vehiculo = await createTestVehicle(usuario.id);
  });

  // Escenario exitoso: supervisor confirma ingreso de solicitud pendiente
  test('confirmar ingreso exitosamente', async () => {
    const solicitud = await createTestSolicitud(usuario.id, vehiculo.id);

    const plaza = await pool.query(`SELECT id FROM plazas WHERE estado = 'disponible' LIMIT 1`);

    const res = await request(app)
      .post('/api/supervisor/confirmar-ingreso')
      .set(authCookie(supToken))
      .send({
        solicitud_id: solicitud.id,
        plaza_id: plaza.rows[0].id,
      });
    expect(res.status).toBe(200);
    expect(res.body.mensaje).toMatch(/confirmado/i);
  });

  // Escenario de excepcion (E1): confirmar ingreso de solicitud ya ingresada
  test('E1: rechaza ingreso de solicitud ya confirmada', async () => {
    const otroUser = await createTestUser({
      verificado: true,
      codigo_universitario: `U${Date.now()}OTRO`,
    });
    const otroVh = await createTestVehicle(otroUser.usuario.id);
    const solicitud = await createTestSolicitud(otroUser.usuario.id, otroVh.id);
    const plaza = await pool.query(`SELECT id FROM plazas WHERE estado = 'disponible' LIMIT 1`);

    await request(app)
      .post('/api/supervisor/confirmar-ingreso')
      .set(authCookie(supToken))
      .send({ solicitud_id: solicitud.id, plaza_id: plaza.rows[0].id });

    const otraPlaza = await pool.query(`SELECT id FROM plazas WHERE estado = 'disponible' LIMIT 1`);
    const res = await request(app)
      .post('/api/supervisor/confirmar-ingreso')
      .set(authCookie(supToken))
      .send({ solicitud_id: solicitud.id, plaza_id: otraPlaza.rows[0].id });
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/no encontrada|pendiente/i);
  });

  // Escenario de excepcion (E2): confirmar ingreso sin autenticacion
  test('E2: rechaza con supervisor sin autenticacion', async () => {
    const res = await request(app)
      .post('/api/supervisor/confirmar-ingreso')
      .send({ solicitud_id: 1, plaza_id: 1 });
    expect(res.status).toBe(401);
  });
});

// ────────────────────────────────────────────────────────────
// RF11 — Registro de salida del vehiculo
// CUS11: El supervisor registra la salida fisica. La solicitud
//        pasa a "finalizado". La plaza se libera. El contador
//        decrementa.
// ────────────────────────────────────────────────────────────
describe('RF11 - Registro de salida [CUS11]', () => {
  let supToken, supervisor;
  let userToken, usuario, vehiculo;

  beforeAll(async () => {
    const sup = await createTestUser({
      rol: 'supervisor',
      codigo_universitario: `U${Date.now()}SUP2`,
    });
    supToken = sup.token;
    supervisor = sup.usuario;

    const user = await createTestUser({
      verificado: true,
      codigo_universitario: `U${Date.now()}USR2`,
    });
    userToken = user.token;
    usuario = user.usuario;
    vehiculo = await createTestVehicle(usuario.id);
  });

  // Escenario exitoso: registrar salida de solicitud con ingreso confirmado
  test('registrar salida exitosamente', async () => {
    const ingreso = await createTestIngreso(usuario.id, vehiculo.id, supervisor.id);

    const res = await request(app)
      .post('/api/supervisor/registrar-salida')
      .set(authCookie(supToken))
      .send({ solicitud_id: ingreso.id });
    expect(res.status).toBe(200);
    expect(res.body.mensaje).toMatch(/salida/i);

    const sol = await pool.query('SELECT estado FROM solicitudes_estacionamiento WHERE id = $1', [
      ingreso.id,
    ]);
    expect(sol.rows[0].estado).toBe('finalizado');
  });

  // Escenario de excepcion (E1): registrar salida sin identificador (placa)
  test('E1: permite salida sin identificador', async () => {
    const ingreso = await createTestIngreso(usuario.id, vehiculo.id, supervisor.id);

    const res = await request(app)
      .post('/api/supervisor/registrar-salida')
      .set(authCookie(supToken))
      .send({ solicitud_id: ingreso.id });
    expect(res.status).toBe(200);
  });

  // Escenario de excepcion: registrar salida de solicitud que no existe
  test('rechaza salida de solicitud inexistente', async () => {
    const res = await request(app)
      .post('/api/supervisor/registrar-salida')
      .set(authCookie(supToken))
      .send({ solicitud_id: 99999 });
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/no encontrada/i);
  });

  // Escenario de excepcion: registrar salida sin que el ingreso haya sido confirmado
  test('rechaza salida de solicitud sin ingreso confirmado', async () => {
    const solicitud = await createTestSolicitud(usuario.id, vehiculo.id);

    const res = await request(app)
      .post('/api/supervisor/registrar-salida')
      .set(authCookie(supToken))
      .send({ solicitud_id: solicitud.id });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/ingreso confirmado/i);
  });
});

// ────────────────────────────────────────────────────────────
// RF12 — Busqueda de usuario por placa
// CUS12: El supervisor busca un usuario ingresando la placa
//        para consultar su solicitud activa o datos.
// ────────────────────────────────────────────────────────────
describe('RF12 - Busqueda por placa [CUS12]', () => {
  let supToken;
  let usuario, vehiculo;

  beforeAll(async () => {
    const sup = await createTestUser({
      rol: 'supervisor',
      codigo_universitario: `U${Date.now()}SUP3`,
    });
    supToken = sup.token;

    const user = await createTestUser({
      verificado: true,
      codigo_universitario: `U${Date.now()}USR3`,
    });
    usuario = user.usuario;
    vehiculo = await createTestVehicle(usuario.id, {
      placa: `SUP-${String(Date.now()).slice(-3)}`,
    });
  });

  // Escenario exitoso: buscar usuario por placa registrada
  test('buscar por placa existente', async () => {
    const res = await request(app)
      .get(`/api/supervisor/buscar?placa=${vehiculo.placa}`)
      .set(authCookie(supToken));
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('usuario_nombre');
    expect(res.body).toHaveProperty('placa');
  });

  // Escenario de excepcion (E1): placa no registrada en el sistema
  test('E1: muestra error para placa no registrada', async () => {
    const res = await request(app)
      .get('/api/supervisor/buscar?placa=XXX-999')
      .set(authCookie(supToken));
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/no encontrado/i);
  });

  // Escenario de excepcion: buscar sin proporcionar placa en query
  test('rechaza busqueda sin parametro placa', async () => {
    const res = await request(app).get('/api/supervisor/buscar').set(authCookie(supToken));
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/placa/i);
  });
});
