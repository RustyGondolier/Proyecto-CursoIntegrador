// ============================================================
// RF07-solicitar-plaza.test.js
// Cobertura: RF07 (Solicitud de acceso a estacionamiento)
// CUS07: El usuario solicita una plaza cuando esta dentro
//        del radio de la sede. Reserva la plaza e incrementa
//        el contador. Si no ingresa en 30 min, se cancela.
// ============================================================

const request = require('supertest');
const app = require('../app');
const pool = require('../../db');
const { createTestUser, createTestVehicle, authCookie } = require('./helpers');

describe('RF07 - Solicitud de acceso [CUS07]', () => {
  let token, usuario, vehiculo;

  beforeAll(async () => {
    // ARRANGE
    const data = await createTestUser({ verificado: true });
    token = data.token;
    usuario = data.usuario;
    vehiculo = await createTestVehicle(usuario.id);
  });

  test('CP04: concurrencia sobre ultima plaza disponible (E3)', async () => {
    // ARRANGE
    const user1 = await createTestUser({ verificado: true, codigo_universitario: `U${Date.now().toString(36)}C1` });
    const vh1 = await createTestVehicle(user1.usuario.id);
    const user2 = await createTestUser({ verificado: true, codigo_universitario: `U${Date.now().toString(36)}C2` });
    const vh2 = await createTestVehicle(user2.usuario.id);

    const tipo = await pool.query(
      `SELECT tv.categoria_plaza FROM tipos_vehiculo tv WHERE tv.id = $1`,
      [vh1.tipo_vehiculo_id]
    );
    const categoria = tipo.rows[0].categoria_plaza;

    await pool.query(`UPDATE plazas SET estado = 'disponible' WHERE bloque_id IN (SELECT id FROM bloques WHERE estacionamiento_id = 1)`);

    await pool.query(
      `UPDATE plazas SET estado = 'ocupada'
       WHERE id IN (
         SELECT p.id FROM plazas p
         JOIN bloques b ON b.id = p.bloque_id
         WHERE b.estacionamiento_id = 1 AND b.tipo_vehiculo = $1
         ORDER BY p.id
         LIMIT (
           SELECT COUNT(*) - 1 FROM plazas p2
           JOIN bloques b2 ON b2.id = p2.bloque_id
           WHERE b2.estacionamiento_id = 1 AND b2.tipo_vehiculo = $1
         )
       )`,
      [categoria]
    );

    // ACT
    const res1 = await request(app).post('/api/solicitudes/crear').set(authCookie(user1.token)).send({ estacionamiento_id: 1, lat: -12.1939, lng: -76.9715 });

    // ASSERT - first user gets the last available plaza
    expect(res1.status).toBe(201);

    // ACT 2 - second user tries now that all plazas are occupied
    const res2 = await request(app).post('/api/solicitudes/crear').set(authCookie(user2.token)).send({ estacionamiento_id: 1, lat: -12.1939, lng: -76.9715 });

    // ASSERT - second user fails
    expect(res2.status).toBe(409);
    expect(res2.body.error).toMatch(/disponible/i);

    await pool.query(`UPDATE plazas SET estado = 'disponible' WHERE bloque_id IN (SELECT id FROM bloques WHERE estacionamiento_id = 1)`);
    await request(app).post('/api/solicitudes/cancelar').set(authCookie(user1.token));
  });

  test('crear solicitud exitosa dentro del radio 2.5 km', async () => {
    // ARRANGE
    const datos = { estacionamiento_id: 1, lat: -12.1939, lng: -76.9715 };

    // ACT
    const res = await request(app).post('/api/solicitudes/crear').set(authCookie(token)).send(datos);

    // ASSERT
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.estado).toBe('pendiente');
  });

  test('E1: rechaza solicitud fuera del radio de la sede', async () => {
    // ARRANGE
    await request(app).post('/api/solicitudes/cancelar').set(authCookie(token));
    const datos = { estacionamiento_id: 1, lat: -12.1, lng: -77.0 };

    // ACT
    const res = await request(app).post('/api/solicitudes/crear').set(authCookie(token)).send(datos);

    // ASSERT
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/campus/i);
  });

  test('E2: rechaza solicitud si ya hay una activa', async () => {
    // ARRANGE
    await request(app).post('/api/solicitudes/crear').set(authCookie(token)).send({ estacionamiento_id: 1, lat: -12.1939, lng: -76.9715 });

    // ACT
    const res = await request(app).post('/api/solicitudes/crear').set(authCookie(token)).send({ estacionamiento_id: 1, lat: -12.1939, lng: -76.9715 });

    // ASSERT
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/activa/i);
  });

  test('rechaza solicitud sin vehiculo registrado', async () => {
    // ARRANGE
    const userNoVh = await createTestUser({ verificado: true, codigo_universitario: `U${Date.now()}NV` });
    const datos = { estacionamiento_id: 1, lat: -12.1939, lng: -76.9715 };

    // ACT
    const res = await request(app).post('/api/solicitudes/crear').set(authCookie(userNoVh.token)).send(datos);

    // ASSERT
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/veh.u-lo|vehículo/i);
  });

  test('rechaza solicitud con perfil no verificado', async () => {
    // ARRANGE
    const userNoVer = await createTestUser({ verificado: false, codigo_universitario: `U${Date.now()}NVER` });
    await createTestVehicle(userNoVer.usuario.id);
    const datos = { estacionamiento_id: 1, lat: -12.1939, lng: -76.9715 };

    // ACT
    const res = await request(app).post('/api/solicitudes/crear').set(authCookie(userNoVer.token)).send(datos);

    // ASSERT
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/verificad/i);
  });

  test('E4: rechaza solicitud si estacionamiento esta lleno', async () => {
    // ARRANGE
    await pool.query(`UPDATE plazas SET estado = 'ocupada' WHERE bloque_id IN (SELECT id FROM bloques WHERE estacionamiento_id = 1)`);
    const userLleno = await createTestUser({ verificado: true, codigo_universitario: `U${Date.now()}LLENO` });
    await createTestVehicle(userLleno.usuario.id);
    const datos = { estacionamiento_id: 1, lat: -12.1939, lng: -76.9715 };

    // ACT
    const res = await request(app).post('/api/solicitudes/crear').set(authCookie(userLleno.token)).send(datos);

    // ASSERT
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/disponible/i);

    await pool.query(`UPDATE plazas SET estado = 'disponible'`);
  });
});

afterAll(async () => {
  await pool.end();
});
