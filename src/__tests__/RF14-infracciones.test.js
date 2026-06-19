// ============================================================
// RF14-infracciones.test.js
// Cobertura: RF14 (Registro de infracciones)
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
    // ARRANGE
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

  describe('GET /api/infracciones/tipos', () => {
    test('obtener tipos de infraccion exitosamente', async () => {
      // ARRANGE
      // Tipos de infraccion sembrados en setup

      // ACT
      const res = await request(app).get('/api/infracciones/tipos').set(authCookie(supervisorToken));

      // ASSERT
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('id');
      expect(res.body[0]).toHaveProperty('codigo');
      expect(res.body[0]).toHaveProperty('descripcion');
    });

    test('E1: devuelve 401 sin autenticacion', async () => {
      // ARRANGE
      // No se envia token

      // ACT
      const res = await request(app).get('/api/infracciones/tipos');

      // ASSERT
      expect(res.status).toBe(401);
    });

    test('E2: devuelve 403 con rol estudiante', async () => {
      // ARRANGE
      const est = await createTestUser();

      // ACT
      const res = await request(app).get('/api/infracciones/tipos').set(authCookie(est.token));

      // ASSERT
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/infracciones/', () => {
    test('registrar infraccion exitosamente', async () => {
      // ARRANGE
      const datos = { placa: vehiculoPlaca, tipo_infraccion_id: tipoInfraccionId, descripcion: 'Estacionado en zona prohibida' };

      // ACT
      const res = await request(app).post('/api/infracciones/').set(authCookie(supervisorToken)).send(datos);

      // ASSERT
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.tipo_infraccion_id).toBe(tipoInfraccionId);
      expect(res.body.supervisor_id).toBe(supervisor.id);
      expect(res.body.descripcion).toBe('Estacionado en zona prohibida');
    });

    test('registrar infraccion sin descripcion', async () => {
      // ARRANGE
      const datos = { placa: vehiculoPlaca, tipo_infraccion_id: tipoInfraccionId };

      // ACT
      const res = await request(app).post('/api/infracciones/').set(authCookie(supervisorToken)).send(datos);

      // ASSERT
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
    });

    test('E1: rechaza placa no registrada', async () => {
      // ARRANGE
      const datos = { placa: 'XYZ-999', tipo_infraccion_id: tipoInfraccionId, descripcion: 'Test' };

      // ACT
      const res = await request(app).post('/api/infracciones/').set(authCookie(supervisorToken)).send(datos);

      // ASSERT
      expect(res.status).toBe(404);
      expect(res.body.error).toContain('Vehículo no encontrado');
    });

    test('E1: rechaza sin placa', async () => {
      // ARRANGE
      const datos = { tipo_infraccion_id: tipoInfraccionId, descripcion: 'Test' };

      // ACT
      const res = await request(app).post('/api/infracciones/').set(authCookie(supervisorToken)).send(datos);

      // ASSERT
      expect(res.status).toBe(400);
    });

    test('E1: rechaza sin tipo_infraccion_id', async () => {
      // ARRANGE
      const datos = { placa: vehiculoPlaca, descripcion: 'Test' };

      // ACT
      const res = await request(app).post('/api/infracciones/').set(authCookie(supervisorToken)).send(datos);

      // ASSERT
      expect(res.status).toBe(400);
    });

    test('CP03: cancelacion del registro no crea infraccion (E2)', async () => {
      // ARRANGE
      const datos = { placa: 'INVALIDA-999', tipo_infraccion_id: tipoInfraccionId };

      // ACT
      const res = await request(app).post('/api/infracciones/').set(authCookie(supervisorToken)).send(datos);

      // ASSERT
      expect(res.status).toBe(404);
      expect(res.body.error).toContain('no encontrado');
    });

    test('E2: devuelve 401 sin autenticacion', async () => {
      // ARRANGE
      const datos = { placa: vehiculoPlaca, tipo_infraccion_id: tipoInfraccionId };

      // ACT
      const res = await request(app).post('/api/infracciones/').send(datos);

      // ASSERT
      expect(res.status).toBe(401);
    });

    test('E2: devuelve 403 con rol estudiante', async () => {
      // ARRANGE
      const est = await createTestUser();
      const datos = { placa: vehiculoPlaca, tipo_infraccion_id: tipoInfraccionId };

      // ACT
      const res = await request(app).post('/api/infracciones/').set(authCookie(est.token)).send(datos);

      // ASSERT
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/infracciones/', () => {
    let infraccion1Id, infraccion2Id;

    beforeAll(async () => {
      // ARRANGE
      const r1 = await request(app).post('/api/infracciones/').set(authCookie(supervisorToken)).send({ placa: vehiculoPlaca, tipo_infraccion_id: tipoInfraccionId });
      infraccion1Id = r1.body.id;

      const r2 = await request(app).post('/api/infracciones/').set(authCookie(otroSupervisorToken)).send({ placa: placaOtro, tipo_infraccion_id: tipoInfraccionId });
      infraccion2Id = r2.body.id;
    });

    test('listar todas las infracciones', async () => {
      // ARRANGE
      // Infracciones creadas en beforeAll

      // ACT
      const res = await request(app).get('/api/infracciones/').set(authCookie(supervisorToken));

      // ASSERT
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
    });

    test('listar solo mis infracciones con ?mias=true', async () => {
      // ARRANGE
      // Supervisor autenticado con infracciones previas

      // ACT
      const res = await request(app).get('/api/infracciones/?mias=true').set(authCookie(supervisorToken));

      // ASSERT
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      res.body.forEach((inf) => {
        expect(inf.supervisor_nombre).toBe(supervisor.nombre);
      });
    });

    test('E1: devuelve 401 sin autenticacion', async () => {
      // ARRANGE
      // No se envia token

      // ACT
      const res = await request(app).get('/api/infracciones/');

      // ASSERT
      expect(res.status).toBe(401);
    });

    test('E1: devuelve 403 con rol estudiante', async () => {
      // ARRANGE
      const est = await createTestUser();

      // ACT
      const res = await request(app).get('/api/infracciones/').set(authCookie(est.token));

      // ASSERT
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/infracciones/:id', () => {
    let infraccionId;

    beforeAll(async () => {
      // ARRANGE
      const res = await request(app).post('/api/infracciones/').set(authCookie(supervisorToken)).send({ placa: vehiculoPlaca, tipo_infraccion_id: tipoInfraccionId, descripcion: 'Infraccion de prueba' });
      infraccionId = res.body.id;
    });

    test('obtener infraccion por ID', async () => {
      // ARRANGE
      const id = infraccionId;

      // ACT
      const res = await request(app).get(`/api/infracciones/${id}`).set(authCookie(supervisorToken));

      // ASSERT
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(infraccionId);
      expect(res.body).toHaveProperty('tipo_codigo');
      expect(res.body).toHaveProperty('usuario_nombre');
      expect(res.body).toHaveProperty('placa');
      expect(res.body).toHaveProperty('supervisor_nombre');
      expect(res.body.descripcion).toBe('Infraccion de prueba');
    });

    test('E1: devuelve 404 para ID inexistente', async () => {
      // ARRANGE
      const id = 999999;

      // ACT
      const res = await request(app).get(`/api/infracciones/${id}`).set(authCookie(supervisorToken));

      // ASSERT
      expect(res.status).toBe(404);
      expect(res.body.error).toContain('no encontrada');
    });

    test('E2: devuelve 401 sin autenticacion', async () => {
      // ARRANGE
      const id = infraccionId;

      // ACT
      const res = await request(app).get(`/api/infracciones/${id}`);

      // ASSERT
      expect(res.status).toBe(401);
    });

    test('E2: devuelve 403 con rol estudiante', async () => {
      // ARRANGE
      const est = await createTestUser();
      const id = infraccionId;

      // ACT
      const res = await request(app).get(`/api/infracciones/${id}`).set(authCookie(est.token));

      // ASSERT
      expect(res.status).toBe(403);
    });
  });
});
