// ============================================================
// 06-infraccion.test.js — RF14
// Registro de infracciones
//
// CUS14: El supervisor puede registrar una infraccion
//        asociada a una placa/vehiculo existente.
// ============================================================

const request = require('supertest');
const app = require('../app');
const pool = require('../../db');
const { createTestUser, createTestVehicle, authCookie } = require('./helpers');

describe('RF14 - Registro de infracciones [CUS14]', () => {
  let supervisorToken, supervisor;
  let otroSupervisorToken, otroSupervisor;
  let estudiante, vehiculo, vehiculoPlaca;
  let vehiculoOtro, placaOtro;
  let tipoInfraccionId;

  beforeAll(async () => {
    const sup = await createTestUser({ rol: 'supervisor' });
    supervisor = sup.usuario;
    supervisorToken = sup.token;

    const sup2 = await createTestUser({ rol: 'supervisor' });
    otroSupervisor = sup2.usuario;
    otroSupervisorToken = sup2.token;

    const est = await createTestUser();
    estudiante = est.usuario;
    vehiculo = await createTestVehicle(estudiante.id);
    vehiculoPlaca = vehiculo.placa;

    const otroEst = await createTestUser();
    vehiculoOtro = await createTestVehicle(otroEst.usuario.id);
    placaOtro = vehiculoOtro.placa;

    tipoInfraccionId = 1;
  });

  afterAll(async () => {
    await pool.end();
  });

  // ──────────────────────────────────────────────────────────
  // GET /api/infracciones/tipos
  // ──────────────────────────────────────────────────────────
  describe('GET /api/infracciones/tipos', () => {
    // Escenario exitoso: listar tipos de infraccion disponibles
    test('obtener tipos de infraccion exitosamente', async () => {
      const res = await request(app)
        .get('/api/infracciones/tipos')
        .set(authCookie(supervisorToken));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('id');
      expect(res.body[0]).toHaveProperty('codigo');
      expect(res.body[0]).toHaveProperty('descripcion');
    });

    // Escenario de excepcion (E1): sin token de autenticacion
    test('E1: devuelve 401 sin autenticacion', async () => {
      const res = await request(app)
        .get('/api/infracciones/tipos');

      expect(res.status).toBe(401);
    });

    // Escenario de excepcion (E2): rol estudiante no autorizado
    test('E2: devuelve 403 con rol estudiante', async () => {
      const est = await createTestUser();
      const res = await request(app)
        .get('/api/infracciones/tipos')
        .set(authCookie(est.token));

      expect(res.status).toBe(403);
    });
  });

  // ──────────────────────────────────────────────────────────
  // POST /api/infracciones/
  // ──────────────────────────────────────────────────────────
  describe('POST /api/infracciones/', () => {
    // Escenario exitoso: registrar infraccion con todos los campos
    test('registrar infraccion exitosamente', async () => {
      const res = await request(app)
        .post('/api/infracciones/')
        .set(authCookie(supervisorToken))
        .send({
          placa: vehiculoPlaca,
          tipo_infraccion_id: tipoInfraccionId,
          descripcion: 'Estacionado en zona prohibida'
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.tipo_infraccion_id).toBe(tipoInfraccionId);
      expect(res.body.supervisor_id).toBe(supervisor.id);
      expect(res.body.descripcion).toBe('Estacionado en zona prohibida');
    });

    // Escenario exitoso: registrar infraccion sin descripcion (campo opcional)
    test('registrar infraccion sin descripcion', async () => {
      const res = await request(app)
        .post('/api/infracciones/')
        .set(authCookie(supervisorToken))
        .send({
          placa: vehiculoPlaca,
          tipo_infraccion_id: tipoInfraccionId
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
    });

    // Escenario de excepcion (E1): placa no existe en el sistema
    test('E1: rechaza placa no registrada', async () => {
      const res = await request(app)
        .post('/api/infracciones/')
        .set(authCookie(supervisorToken))
        .send({
          placa: 'XYZ-999',
          tipo_infraccion_id: tipoInfraccionId,
          descripcion: 'Test'
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('Vehículo no encontrado');
    });

    // Escenario de excepcion (E1): omitir campo placa obligatorio
    test('E1: rechaza sin placa', async () => {
      const res = await request(app)
        .post('/api/infracciones/')
        .set(authCookie(supervisorToken))
        .send({
          tipo_infraccion_id: tipoInfraccionId,
          descripcion: 'Test'
        });

      expect(res.status).toBe(400);
    });

    // Escenario de excepcion (E1): omitir tipo de infraccion obligatorio
    test('E1: rechaza sin tipo_infraccion_id', async () => {
      const res = await request(app)
        .post('/api/infracciones/')
        .set(authCookie(supervisorToken))
        .send({
          placa: vehiculoPlaca,
          descripcion: 'Test'
        });

      expect(res.status).toBe(400);
    });

    // Escenario de excepcion (E2): sin token de autenticacion en POST
    test('E2: devuelve 401 sin autenticacion', async () => {
      const res = await request(app)
        .post('/api/infracciones/')
        .send({
          placa: vehiculoPlaca,
          tipo_infraccion_id: tipoInfraccionId
        });

      expect(res.status).toBe(401);
    });

    // Escenario de excepcion (E2): rol estudiante no autorizado en POST
    test('E2: devuelve 403 con rol estudiante', async () => {
      const est = await createTestUser();
      const res = await request(app)
        .post('/api/infracciones/')
        .set(authCookie(est.token))
        .send({
          placa: vehiculoPlaca,
          tipo_infraccion_id: tipoInfraccionId
        });

      expect(res.status).toBe(403);
    });
  });

  // ──────────────────────────────────────────────────────────
  // GET /api/infracciones/
  // ──────────────────────────────────────────────────────────
  describe('GET /api/infracciones/', () => {
    let infraccion1Id, infraccion2Id;

    beforeAll(async () => {
      const r1 = await request(app)
        .post('/api/infracciones/')
        .set(authCookie(supervisorToken))
        .send({
          placa: vehiculoPlaca,
          tipo_infraccion_id: tipoInfraccionId
        });
      infraccion1Id = r1.body.id;

      const r2 = await request(app)
        .post('/api/infracciones/')
        .set(authCookie(otroSupervisorToken))
        .send({
          placa: placaOtro,
          tipo_infraccion_id: tipoInfraccionId
        });
      infraccion2Id = r2.body.id;
    });

    // Escenario exitoso: listar todas las infracciones registradas
    test('listar todas las infracciones', async () => {
      const res = await request(app)
        .get('/api/infracciones/')
        .set(authCookie(supervisorToken));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
    });

    // Escenario exitoso: filtrar infracciones del supervisor autenticado
    test('listar solo mis infracciones con ?mias=true', async () => {
      const res = await request(app)
        .get('/api/infracciones/?mias=true')
        .set(authCookie(supervisorToken));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      res.body.forEach(inf => {
        expect(inf.supervisor_nombre).toBe(supervisor.nombre);
      });
    });

    // Escenario de excepcion (E1): sin token de autenticacion al listar
    test('E1: devuelve 401 sin autenticacion', async () => {
      const res = await request(app)
        .get('/api/infracciones/');

      expect(res.status).toBe(401);
    });

    // Escenario de excepcion (E1): rol estudiante no autorizado al listar
    test('E1: devuelve 403 con rol estudiante', async () => {
      const est = await createTestUser();
      const res = await request(app)
        .get('/api/infracciones/')
        .set(authCookie(est.token));

      expect(res.status).toBe(403);
    });
  });

  // ──────────────────────────────────────────────────────────
  // GET /api/infracciones/:id
  // ──────────────────────────────────────────────────────────
  describe('GET /api/infracciones/:id', () => {
    let infraccionId;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/infracciones/')
        .set(authCookie(supervisorToken))
        .send({
          placa: vehiculoPlaca,
          tipo_infraccion_id: tipoInfraccionId,
          descripcion: 'Infraccion de prueba'
        });
      infraccionId = res.body.id;
    });

    // Escenario exitoso: obtener detalle de infraccion por ID
    test('obtener infraccion por ID', async () => {
      const res = await request(app)
        .get(`/api/infracciones/${infraccionId}`)
        .set(authCookie(supervisorToken));

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(infraccionId);
      expect(res.body).toHaveProperty('tipo_codigo');
      expect(res.body).toHaveProperty('usuario_nombre');
      expect(res.body).toHaveProperty('placa');
      expect(res.body).toHaveProperty('supervisor_nombre');
      expect(res.body.descripcion).toBe('Infraccion de prueba');
    });

    // Escenario de excepcion (E1): infraccion con ID que no existe
    test('E1: devuelve 404 para ID inexistente', async () => {
      const res = await request(app)
        .get('/api/infracciones/999999')
        .set(authCookie(supervisorToken));

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('no encontrada');
    });

    // Escenario de excepcion (E2): sin token de autenticacion al obtener por ID
    test('E2: devuelve 401 sin autenticacion', async () => {
      const res = await request(app)
        .get(`/api/infracciones/${infraccionId}`);

      expect(res.status).toBe(401);
    });

    // Escenario de excepcion (E2): rol estudiante no autorizado al obtener por ID
    test('E2: devuelve 403 con rol estudiante', async () => {
      const est = await createTestUser();
      const res = await request(app)
        .get(`/api/infracciones/${infraccionId}`)
        .set(authCookie(est.token));

      expect(res.status).toBe(403);
    });
  });
});
