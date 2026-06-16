// ============================================================
// 08-admin.test.js
// Cobertura: RF15 (Verificacion datos usuario),
//            RF16 (Suspension y reactivacion),
//            RF17 (Gestion infracciones),
//            RF18 (Reportes prioritarios)
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
// RF15 — Verificacion de datos de usuario
// CUS15: El administrador verifica la informacion del usuario.
// ────────────────────────────────────────────────────────────
describe('RF15 - Verificacion de datos [CUS15]', () => {
  let adminToken, userPendiente;

  beforeAll(async () => {
    await pool.query(
      `UPDATE solicitudes_estacionamiento SET estado = 'finalizado' WHERE estado IN ('pendiente', 'ingresado')`,
    );
    await pool.query(`UPDATE plazas SET estado = 'disponible'`);

    const admin = await createTestUser({
      rol: 'administrador',
      codigo_universitario: `U${Date.now()}ADM`,
    });
    adminToken = admin.token;

    userPendiente = await createTestUser({
      verificado: false,
      requiere_reverificacion: true,
      codigo_universitario: `U${Date.now()}PEND`,
    });
  });

  // Escenario exitoso: listar usuarios con requiere_reverificacion=true
  test('listar usuarios pendientes de verificacion', async () => {
    const res = await request(app)
      .get('/api/administrador/usuarios/pendientes')
      .set(authCookie(adminToken));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  // Escenario exitoso: obtener datos completos de un usuario por ID
  test('obtener detalle de usuario', async () => {
    const res = await request(app)
      .get(`/api/administrador/usuarios/${userPendiente.usuario.id}`)
      .set(authCookie(adminToken));
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('nombre');
    expect(res.body).toHaveProperty('codigo_universitario');
  });

  // Escenario exitoso: aprobar perfil de usuario pendiente de verificacion
  test('aprobar perfil de usuario pendiente', async () => {
    const res = await request(app)
      .put(`/api/administrador/usuarios/${userPendiente.usuario.id}/aprobar`)
      .set(authCookie(adminToken));
    expect(res.status).toBe(200);
    expect(res.body.mensaje).toMatch(/aprobado|verificad/i);
  });

  // Escenario de excepcion (E1): aprobar usuario ya verificado
  test('E1: 400 al aprobar perfil ya verificado', async () => {
    const res = await request(app)
      .put(`/api/administrador/usuarios/${userPendiente.usuario.id}/aprobar`)
      .set(authCookie(adminToken));
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/verificad/i);
  });

  // Escenario de excepcion (E1): usuario con id inexistente
  test('E1: 404 al obtener usuario inexistente', async () => {
    const res = await request(app)
      .get('/api/administrador/usuarios/99999')
      .set(authCookie(adminToken));
    expect(res.status).toBe(404);
  });

  // Escenario de excepcion (E1): sin token de autenticacion
  test('E1: 401 sin autenticacion', async () => {
    const res = await request(app).get('/api/administrador/usuarios/pendientes');
    expect(res.status).toBe(401);
  });
});

// ────────────────────────────────────────────────────────────
// RF16 — Suspension y reactivacion de cuenta
// CUS16: El administrador suspende y reactiva cuentas.
// ────────────────────────────────────────────────────────────
describe('RF16 - Suspension y reactivacion [CUS16]', () => {
  let adminToken, userActivo, userSuspendido;

  beforeAll(async () => {
    await pool.query(
      `UPDATE solicitudes_estacionamiento SET estado = 'finalizado' WHERE estado IN ('pendiente', 'ingresado')`,
    );

    const admin = await createTestUser({
      rol: 'administrador',
      codigo_universitario: `U${Date.now()}ADM2`,
    });
    adminToken = admin.token;

    userActivo = await createTestUser({
      verificado: true,
      codigo_universitario: `U${Date.now()}ACT`,
    });

    userSuspendido = await createTestUser({
      verificado: false,
      estado_cuenta: 'suspendida',
      motivo_suspension: 'Documentacion incorrecta',
      codigo_universitario: `U${Date.now()}SUS`,
    });
  });

  // Escenario exitoso: suspender cuenta activa con motivo valido
  test('suspender cuenta con motivo valido', async () => {
    const res = await request(app)
      .put(`/api/administrador/usuarios/${userActivo.usuario.id}/suspender`)
      .set(authCookie(adminToken))
      .send({ motivo: 'Documentacion incompleta y datos incorrectos' });
    expect(res.status).toBe(200);
    expect(res.body.mensaje).toMatch(/suspendid/i);
  });

  // Escenario de excepcion (E1): suspender sin proporcionar motivo
  test('E1: 400 al suspender sin motivo', async () => {
    const res = await request(app)
      .put(`/api/administrador/usuarios/${userActivo.usuario.id}/suspender`)
      .set(authCookie(adminToken))
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/motivo/i);
  });

  // Escenario de excepcion (E1): suspender con motivo menor a 5 caracteres
  test('E1: 400 al suspender con motivo muy corto', async () => {
    const res = await request(app)
      .put(`/api/administrador/usuarios/${userActivo.usuario.id}/suspender`)
      .set(authCookie(adminToken))
      .send({ motivo: 'No' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/5 caracteres/i);
  });

  // Escenario de excepcion (E1): suspender cuenta ya suspendida
  test('E1: 400 al suspender cuenta ya suspendida', async () => {
    const res = await request(app)
      .put(`/api/administrador/usuarios/${userSuspendido.usuario.id}/suspender`)
      .set(authCookie(adminToken))
      .send({ motivo: 'Duplicado de suspension' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/suspendid/i);
  });

  // Escenario exitoso: reactivar cuenta previamente suspendida
  test('reactivar cuenta suspendida', async () => {
    const res = await request(app)
      .put(`/api/administrador/usuarios/${userSuspendido.usuario.id}/reactivar`)
      .set(authCookie(adminToken));
    expect(res.status).toBe(200);
    expect(res.body.mensaje).toMatch(/reactivad/i);
  });

  // Escenario de excepcion (E1): reactivar cuenta que no esta suspendida
  test('E1: 400 al reactivar cuenta no suspendida', async () => {
    const userNormal = await createTestUser({
      codigo_universitario: `U${Date.now()}NORM`,
    });
    const res = await request(app)
      .put(`/api/administrador/usuarios/${userNormal.usuario.id}/reactivar`)
      .set(authCookie(adminToken));
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/suspendid/i);
  });
});

// ────────────────────────────────────────────────────────────
// RF17 — Gestion de infracciones (administrador)
// CUS17: El administrador revisa el historial de infracciones.
// ────────────────────────────────────────────────────────────
describe('RF17 - Gestion de infracciones [CUS17]', () => {
  let adminToken, supToken, userToken, usuario, vehiculo;
  let infraccionId;

  beforeAll(async () => {
    await pool.query(
      `UPDATE solicitudes_estacionamiento SET estado = 'finalizado' WHERE estado IN ('pendiente', 'ingresado')`,
    );
    await pool.query(`UPDATE plazas SET estado = 'disponible'`);

    const admin = await createTestUser({
      rol: 'administrador',
      codigo_universitario: `U${Date.now()}ADM3`,
    });
    adminToken = admin.token;

    const sup = await createTestUser({
      rol: 'supervisor',
      codigo_universitario: `U${Date.now()}SUP3`,
    });
    supToken = sup.token;

    const user = await createTestUser({
      verificado: true,
      codigo_universitario: `U${Date.now()}USR3`,
    });
    userToken = user.token;
    usuario = user.usuario;
    vehiculo = await createTestVehicle(usuario.id);

    // Crear infraccion como supervisor
    const infraccion = await request(app)
      .post('/api/infracciones/')
      .set(authCookie(supToken))
      .send({
        placa: vehiculo.placa,
        tipo_infraccion_id: 1,
        descripcion: 'Vehiculo estacionado en zona prohibida',
      });
    infraccionId = infraccion.body.id;
  });

  // Escenario exitoso: listar historial de infracciones como admin
  test('listar infracciones como administrador', async () => {
    const res = await request(app)
      .get('/api/administrador/infracciones')
      .set(authCookie(adminToken));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  // Escenario exitoso: ver detalle completo de una infraccion
  test('obtener detalle de infraccion', async () => {
    const res = await request(app)
      .get(`/api/administrador/infracciones/${infraccionId}`)
      .set(authCookie(adminToken));
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('placa');
  });

  // Escenario de excepcion (E1): infraccion con id inexistente
  test('E1: 404 al obtener infraccion inexistente', async () => {
    const res = await request(app)
      .get('/api/administrador/infracciones/99999')
      .set(authCookie(adminToken));
    expect(res.status).toBe(404);
  });

  // Escenario exitoso: dashboard panel con metricas consolidadas
  test('dashboard panel con metricas', async () => {
    const res = await request(app).get('/api/administrador/dashboard').set(authCookie(adminToken));
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('pendientes_count');
    expect(res.body).toHaveProperty('suspendidas_count');
    expect(res.body).toHaveProperty('prioritarios_count');
    expect(res.body).toHaveProperty('infracciones_mes');
    expect(res.body).toHaveProperty('acciones_recientes');
    expect(res.body).toHaveProperty('pendientes_recientes');
  });
});

// ────────────────────────────────────────────────────────────
// RF18 — Revision de reportes prioritarios
// CUS18: El administrador gestiona reportes marcados como
//        prioritarios por el supervisor.
// ────────────────────────────────────────────────────────────
describe('RF18 - Reportes prioritarios [CUS18]', () => {
  let adminToken, supToken, reporteId;

  beforeAll(async () => {
    await pool.query(
      `UPDATE solicitudes_estacionamiento SET estado = 'finalizado' WHERE estado IN ('pendiente', 'ingresado')`,
    );
    await pool.query(`UPDATE plazas SET estado = 'disponible'`);

    const admin = await createTestUser({
      rol: 'administrador',
      codigo_universitario: `U${Date.now()}ADM4`,
    });
    adminToken = admin.token;

    const sup = await createTestUser({
      rol: 'supervisor',
      codigo_universitario: `U${Date.now()}SUP4`,
    });
    supToken = sup.token;

    // Crear usuario con reporte prioritario
    const user = await createTestUser({
      verificado: true,
      codigo_universitario: `U${Date.now()}USR4`,
    });
    const vh = await createTestVehicle(user.usuario.id);
    await createTestSolicitud(user.usuario.id, vh.id);

    // Crear reporte como usuario
    const reporte = await request(app)
      .post('/api/reportes/')
      .set(authCookie(user.token))
      .send({ descripcion: 'Acceso bloqueado por obras en la entrada de la cochera' });
    reporteId = reporte.body.id;

    // Supervisor lo marca como prioritario
    await request(app)
      .put(`/api/reportes/${reporteId}/prioritario`)
      .set(authCookie(supToken))
      .send({ razon: 'Requiere intervencion de obras y autorizacion administrativa' });
  });

  // Escenario exitoso: listar reportes marcados como prioritarios
  test('listar reportes prioritarios', async () => {
    const res = await request(app)
      .get('/api/administrador/reportes/prioritarios')
      .set(authCookie(adminToken));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  // Escenario exitoso: administrador resuelve reporte prioritario
  test('resolver reporte prioritario', async () => {
    const res = await request(app)
      .put(`/api/administrador/reportes/${reporteId}/resolver`)
      .set(authCookie(adminToken));
    expect(res.status).toBe(200);
  });

  // Escenario de excepcion (E1): reporte prioritario con id inexistente
  test('E1: 404 al resolver reporte inexistente', async () => {
    const res = await request(app)
      .put('/api/administrador/reportes/99999/resolver')
      .set(authCookie(adminToken));
    expect(res.status).toBe(404);
  });

  // Escenario exitoso: listar historial de acciones del administrador
  test('listar acciones administrativas', async () => {
    const res = await request(app).get('/api/administrador/acciones').set(authCookie(adminToken));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

afterAll(async () => {
  await pool.end();
});
