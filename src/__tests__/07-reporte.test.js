// ============================================================
// 07-reporte.test.js
// Cobertura: RF13 (Gestion reportes supervisor),
//            RF19 (Reporte de incidencias usuario)
// ============================================================

const request = require('supertest');
const app = require('../app');
const pool = require('../../db');
const {
  createTestUser, createTestVehicle, createTestSolicitud,
  authCookie
} = require('./helpers');

// ────────────────────────────────────────────────────────────
// RF19 — Reporte de incidencias (usuario)
// CUS19: El usuario reporta un problema en su plaza asignada.
// ────────────────────────────────────────────────────────────
describe('RF19 - Reporte de incidencias [CUS19]', () => {
  let userToken, usuario, vehiculo, solicitud;

  beforeAll(async () => {
    await pool.query(`UPDATE solicitudes_estacionamiento SET estado = 'finalizado' WHERE estado IN ('pendiente', 'ingresado')`);
    const data = await createTestUser({ verificado: true });
    userToken = data.token;
    usuario = data.usuario;
    vehiculo = await createTestVehicle(usuario.id);
    solicitud = await createTestSolicitud(usuario.id, vehiculo.id);
  });

  // Escenario exitoso
  test('crear reporte exitosamente con solicitud activa', async () => {
    const res = await request(app)
      .post('/api/reportes/')
      .set(authCookie(userToken))
      .send({ descripcion: 'Hay un vehiculo mal estacionado en mi plaza' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('descripcion');
    expect(res.body).toHaveProperty('estado_id');
    expect(res.body.estado_id).toBe(1); // 'enviado'
  });

  // Escenario de excepcion (E1): descripcion vacia
  test('E1: rechaza reporte sin descripcion', async () => {
    const res = await request(app)
      .post('/api/reportes/')
      .set(authCookie(userToken))
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/descripcion/i);
  });

  // Escenario de excepcion (E1): descripcion menor a 10 caracteres
  test('E1: rechaza reporte con descripcion demasiado corta', async () => {
    const res = await request(app)
      .post('/api/reportes/')
      .set(authCookie(userToken))
      .send({ descripcion: 'Corto' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/10 caracteres/i);
  });

  // Escenario de excepcion (E1): usuario sin solicitud activa
  test('rechaza reporte sin solicitud activa', async () => {
    const userSinSol = await createTestUser({
      verificado: true,
      codigo_universitario: `U${Date.now()}SIN`
    });
    await createTestVehicle(userSinSol.usuario.id);

    const res = await request(app)
      .post('/api/reportes/')
      .set(authCookie(userSinSol.token))
      .send({ descripcion: 'Problema con la plaza asignada' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/solicitud activa/i);
  });

  // Escenario de excepcion (E1): sin autenticacion
  test('401 sin autenticacion al crear reporte', async () => {
    const res = await request(app)
      .post('/api/reportes/')
      .send({ descripcion: 'Test' });
    expect(res.status).toBe(401);
  });

  // Escenario exitoso: listar reportes del usuario autenticado
  test('listar mis reportes', async () => {
    const res = await request(app)
      .get('/api/reportes/')
      .set(authCookie(userToken));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });
});

// ────────────────────────────────────────────────────────────
// RF13 — Gestion de reportes de incidencias (supervisor)
// CUS13: El supervisor revisa, responde y escala reportes.
// ────────────────────────────────────────────────────────────
describe('RF13 - Gestion de reportes [CUS13]', () => {
  let supToken, supervisor;
  let userToken, usuario, vehiculo, reporteId;

  beforeAll(async () => {
    await pool.query(`UPDATE solicitudes_estacionamiento SET estado = 'finalizado' WHERE estado IN ('pendiente', 'ingresado')`);

    const sup = await createTestUser({
      rol: 'supervisor',
      codigo_universitario: `U${Date.now()}SUP`
    });
    supToken = sup.token;
    supervisor = sup.usuario;

    // Crear usuario con solicitud activa + reporte
    const user = await createTestUser({
      verificado: true,
      codigo_universitario: `U${Date.now()}USR`
    });
    userToken = user.token;
    usuario = user.usuario;
    vehiculo = await createTestVehicle(usuario.id);
    await createTestSolicitud(usuario.id, vehiculo.id);

    // Crear un reporte
    const crear = await request(app)
      .post('/api/reportes/')
      .set(authCookie(userToken))
      .send({ descripcion: 'Plaza obstruida por otro vehiculo en la cochera' });
    reporteId = crear.body.id;
  });

  // Escenario exitoso: supervisor lista todos los reportes
  test('listar todos los reportes como supervisor', async () => {
    const res = await request(app)
      .get('/api/reportes/todos')
      .set(authCookie(supToken));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  // Escenario exitoso: ver detalle completo de un reporte
  test('obtener detalle de reporte', async () => {
    const res = await request(app)
      .get(`/api/reportes/${reporteId}`)
      .set(authCookie(supToken));
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('usuario_nombre');
    expect(res.body).toHaveProperty('descripcion');
    expect(res.body).toHaveProperty('estado');
  });

  // Escenario exitoso: supervisor marca reporte como "en revision"
  test('marcar reporte en revision', async () => {
    const res = await request(app)
      .put(`/api/reportes/${reporteId}/en-revision`)
      .set(authCookie(supToken));
    expect(res.status).toBe(200);
    expect(res.body.estado_id).toBe(2); // en_revision
  });

  // Escenario de excepcion (E1): reporte con id inexistente
  test('E1: 404 al obtener reporte inexistente', async () => {
    const res = await request(app)
      .get('/api/reportes/99999')
      .set(authCookie(supToken));
    expect(res.status).toBe(404);
  });

  // Escenario exitoso: supervisor responde y resuelve el reporte
  test('responder y resolver reporte exitosamente', async () => {
    const res = await request(app)
      .put(`/api/reportes/${reporteId}/responder`)
      .set(authCookie(supToken))
      .send({ respuesta: 'Se ha solucionado el problema. La plaza esta libre.' });
    expect(res.status).toBe(200);
    expect(res.body.estado_id).toBe(3); // resuelto
  });

  // Escenario de excepcion (E1): responder sin cuerpo de respuesta
  test('E1: rechaza responder sin respuesta', async () => {
    const res = await request(app)
      .put(`/api/reportes/${reporteId}/responder`)
      .set(authCookie(supToken))
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/respuesta/i);
  });

  // Escenario exitoso: supervisor marca reporte como prioritario
  test('marcar reporte como prioritario', async () => {
    const userPri = await createTestUser({
      verificado: true,
      codigo_universitario: `U${Date.now()}PRI`
    });
    const vhPri = await createTestVehicle(userPri.usuario.id);
    await createTestSolicitud(userPri.usuario.id, vhPri.id);

    const crear = await request(app)
      .post('/api/reportes/')
      .set(authCookie(userPri.token))
      .send({ descripcion: 'Problema grave que requiere atencion urgente del administrador' });
    const nuevoId = crear.body.id;

    const res = await request(app)
      .put(`/api/reportes/${nuevoId}/prioritario`)
      .set(authCookie(supToken))
      .send({ razon: 'El problema afecta a varios usuarios y requiere intervencion administrativa' });
    expect(res.status).toBe(200);
    expect(res.body.estado_id).toBe(4); // prioritario
    expect(res.body.es_prioritario).toBe(true);
  });

  // Escenario de excepcion (E1): marcar prioritario sin razon
  test('E1: rechaza marcar prioritario sin razon', async () => {
    const res = await request(app)
      .put(`/api/reportes/${reporteId}/prioritario`)
      .set(authCookie(supToken))
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/razon/i);
  });

  // Escenario de excepcion (E1): estudiante no accede a ruta de supervisor
  test('403: estudiante no accede a listar todos los reportes', async () => {
    const res = await request(app)
      .get('/api/reportes/todos')
      .set(authCookie(userToken));
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/denegado/i);
  });
});

afterAll(async () => {
  await pool.end();
});
