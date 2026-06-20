// ============================================================
// RF17-gestion-infracciones.test.js
// Cobertura: RF17 (Gestion de infracciones - administrador)
// CUS17: El administrador revisa el historial de infracciones.
// ============================================================

const request = require('supertest');
const app = require('../app');
const pool = require('../../db');
const { createTestUser, createTestVehicle, authCookie } = require('./helpers');

describe('RF17 - Gestion de infracciones [CUS17]', () => {
  let adminToken, supToken, usuario, vehiculo;
  let infraccionId;

  beforeAll(async () => {
    // ARRANGE
    await pool.query(`UPDATE solicitudes_estacionamiento SET estado = 'finalizado' WHERE estado IN ('pendiente', 'ingresado')`);
    await pool.query(`UPDATE plazas SET estado = 'disponible'`);

    const admin = await createTestUser({ rol: 'administrador', codigo_universitario: `U${Date.now()}ADM3` });
    adminToken = admin.token;

    const sup = await createTestUser({ rol: 'supervisor', codigo_universitario: `U${Date.now()}SUP3` });
    supToken = sup.token;

    const user = await createTestUser({ verificado: true, codigo_universitario: `U${Date.now()}USR3` });
    usuario = user.usuario;
    vehiculo = await createTestVehicle(usuario.id);

    const infraccion = await request(app).post('/api/infracciones/').set(authCookie(supToken)).send({ placa: vehiculo.placa, tipo_infraccion_id: 1, descripcion: 'Vehiculo estacionado en zona prohibida' });
    infraccionId = infraccion.body.id;
  });

  test('listar infracciones como administrador', async () => {
    // ARRANGE
    // Infracciones creadas en beforeAll

    // ACT
    const res = await request(app).get('/api/administrador/infracciones').set(authCookie(adminToken));

    // ASSERT
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  test('obtener detalle de infraccion', async () => {
    // ARRANGE
    const id = infraccionId;

    // ACT
    const res = await request(app).get(`/api/administrador/infracciones/${id}`).set(authCookie(adminToken));

    // ASSERT
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('placa');
  });

  test('E1: 404 al obtener infraccion inexistente', async () => {
    // ARRANGE
    const id = 99999;

    // ACT
    const res = await request(app).get(`/api/administrador/infracciones/${id}`).set(authCookie(adminToken));

    // ASSERT
    expect(res.status).toBe(404);
  });

  test('dashboard panel con metricas', async () => {
    // ARRANGE
    // Datos ya preparados en beforeAll

    // ACT
    const res = await request(app).get('/api/administrador/dashboard').set(authCookie(adminToken));

    // ASSERT
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('pendientes_count');
    expect(res.body).toHaveProperty('suspendidas_count');
    expect(res.body).toHaveProperty('prioritarios_count');
    expect(res.body).toHaveProperty('infracciones_mes');
    expect(res.body).toHaveProperty('acciones_recientes');
    expect(res.body).toHaveProperty('pendientes_recientes');
  });

  test('CP03a: E2 - error del servidor al listar infracciones', async () => {
    // ARRANGE
    // Forzar error de BD con un parámetro de fecha inválido

    // ACT
    const res = await request(app)
      .get('/api/administrador/infracciones?fecha_desde=fecha-invalida')
      .set(authCookie(adminToken));

    // ASSERT
    expect(res.status).toBe(500);
    expect(res.body.error).toBeDefined();
  });

  test('CP03b: E2 - error al cargar detalle de infraccion inexistente', async () => {
    // ARRANGE
    const id = 99999;

    // ACT
    const res = await request(app).get(`/api/administrador/infracciones/${id}`).set(authCookie(adminToken));

    // ASSERT
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});

afterAll(async () => {
  await pool.end();
});
