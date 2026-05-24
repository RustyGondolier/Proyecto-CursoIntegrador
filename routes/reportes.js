const express = require('express');
const pool    = require('../db/index');
const { authJWT, soloSupervisor } = require('../middleware/authJWT');
const router  = express.Router();

/* =========================
   POST /api/reportes
   CREAR REPORTE
========================= */

router.post(
  '/',
  authJWT,
  async (req, res) => {

    const {
      plaza_id,
      descripcion,
      es_prioritario,
      razon_prioridad
    } = req.body;

    if(!descripcion){
      return res.status(400).json({
        error:'La descripción es obligatoria'
      });
    }

    try{

      /* ESTADO EN_REVISION */

      const estado =
        await pool.query(
          `
          SELECT id
          FROM estados_reporte
          WHERE codigo = 'en_revision'
          LIMIT 1
          `
        );

      if(
        estado.rows.length === 0
      ){

        return res.status(500).json({
          error:'Estado en revision no configurado'
        });

      }

      const estadoId =
        estado.rows[0].id;

      /* CREAR REPORTE */

      const reporte =
        await pool.query(
          `
          INSERT INTO reportes_incidencias
          (
            usuario_id,
            plaza_id,
            descripcion,
            es_prioritario,
            razon_prioridad,
            estado_id,
            creado_en,
            actualizado_en
          )
          VALUES
          (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            NOW(),
            NOW()
          )
          RETURNING *
          `,
          [
            req.usuario.id,
            plaza_id || null,
            descripcion,
            es_prioritario || false,
            razon_prioridad || null,
            estadoId
          ]
        );

      /* NOTIFICACION */

      await pool.query(
        `
        INSERT INTO notificaciones
        (
          usuario_id,
          tipo_id,
          titulo,
          mensaje
        )
        VALUES
        (
          $1,
          (
            SELECT id
            FROM tipos_notificacion
            WHERE codigo = 'reporte'
            LIMIT 1
          ),
          $2,
          $3
        )
        `,
        [
          req.usuario.id,
          'Reporte enviado',
          'Tu reporte fue registrado correctamente.'
        ]
      );

      res.status(201).json({
        mensaje:
          'Reporte enviado correctamente',
        reporte:
          reporte.rows[0]
      });

    }catch(err){
      console.error(err);
      res.status(500).json({
        error:'Error interno del servidor'
      });
    }
  }
);

/* =========================
   GET /api/reportes
========================= */

router.get(
  '/',
  authJWT,
  async (req, res) => {

    try{
      let query = `
        SELECT
          r.id,
          r.descripcion,
          r.es_prioritario,
          r.razon_prioridad,
          r.respuesta_supervisor,
          r.valoracion,
          r.creado_en,
          r.actualizado_en,

          er.codigo AS estado,
          er.label  AS estado_label,

          u.nombre  AS usuario_nombre,
          u.codigo_universitario,

          p.codigo  AS plaza_codigo

        FROM reportes_incidencias r

        JOIN estados_reporte er
          ON er.id = r.estado_id

        JOIN usuarios u
          ON u.id = r.usuario_id

        LEFT JOIN plazas p
          ON p.id = r.plaza_id

        WHERE 1=1
      `;

      const params = [];

      /* USUARIO SOLO VE LOS SUYOS */

      if(
        req.usuario.rol !==
        'supervisor'
      ){
        query += `
          AND r.usuario_id = $1
        `;
        params.push(
          req.usuario.id
        );
      }

      query += `
        ORDER BY
        r.es_prioritario DESC,
        r.creado_en DESC
      `;

      const resultado =
        await pool.query(
          query,
          params
        );

      res.json(
        resultado.rows
      );

    }catch(err){
      console.error(err);
      res.status(500).json({
        error:'Error interno del servidor'
      });
    }
  }
);

/* =========================
   PATCH RESPONDER REPORTE
========================= */

router.patch(
  '/:id',
  authJWT,
  soloSupervisor,
  async (req, res) => {

    const {
      respuesta,
      estado
    } = req.body;

    if(
      !respuesta ||
      !estado
    ){

      return res.status(400).json({
        error:'Faltan respuesta y estado'
      });
    }

    try{
      const estadoRow =
        await pool.query(
          `
          SELECT id
          FROM estados_reporte
          WHERE codigo = $1
          `,
          [estado]
        );

      if(
        estadoRow.rows.length === 0
      ){
        return res.status(400).json({
          error:'Estado no válido'
        });
      }

      const reporte =
        await pool.query(
          `
          UPDATE reportes_incidencias
          SET
            respuesta_supervisor = $1,
            estado_id            = $2,
            supervisor_id        = $3,
            actualizado_en       = NOW()

          WHERE id = $4

          RETURNING *
          `,
          [
            respuesta,
            estadoRow.rows[0].id,
            req.usuario.id,
            req.params.id
          ]
        );

      if(
        reporte.rows.length === 0
      ){

        return res.status(404).json({
          error:'Reporte no encontrado'
        });

      }

      /* NOTIFICAR USUARIO */

      await pool.query(
        `
        INSERT INTO notificaciones
        (
          usuario_id,
          tipo_id,
          titulo,
          mensaje
        )
        VALUES
        (
          $1,

          (
            SELECT id
            FROM tipos_notificacion
            WHERE codigo = 'reporte'
            LIMIT 1
          ),
          'Tu reporte fue respondido',
          $2
        )
        `,
        [
          reporte.rows[0].usuario_id,
          respuesta
        ]
      );

      res.json({
        mensaje:
          'Reporte respondido correctamente',
        reporte:
          reporte.rows[0]
      });
    }catch(err){

      console.error(err);
      res.status(500).json({
        error:'Error interno del servidor'
      });
    }
  }
);

/* =========================
   PATCH VALORAR REPORTE
========================= */

router.patch(
  '/:id/valorar',
  authJWT,
  async (req, res) => {

    const {
      valoracion
    } = req.body;

    if(
      !valoracion ||
      valoracion < 1 ||
      valoracion > 5
    ){
      return res.status(400).json({
        error:'La valoración debe ser entre 1 y 5'
      });
    }

    try{
      const reporte =
        await pool.query(
          `
          SELECT
            r.id,
            r.valoracion,
            er.codigo AS estado

          FROM reportes_incidencias r

          JOIN estados_reporte er
            ON er.id = r.estado_id

          WHERE
            r.id = $1
            AND r.usuario_id = $2
          `,
          [
            req.params.id,
            req.usuario.id
          ]
        );

      if(
        reporte.rows.length === 0
      ){
        return res.status(404).json({
          error:'Reporte no encontrado'
        });
      }

      if(
        reporte.rows[0].estado !==
        'resuelto'
      ){
        return res.status(409).json({
          error:'Solo puedes valorar reportes resueltos'
        });
      }

      if(
        reporte.rows[0].valoracion !== null
      ){
        return res.status(409).json({
          error:'Este reporte ya fue valorado'
        });
      }

      await pool.query(
        `
        UPDATE reportes_incidencias
        SET
          valoracion = $1,
          actualizado_en = NOW()

        WHERE id = $2
        `,
        [
          valoracion,
          req.params.id
        ]
      );

      res.json({
        mensaje:
          'Valoración registrada correctamente'
      });

    }catch(err){
      console.error(err);
      res.status(500).json({
        error:'Error interno del servidor'
      });
    }
  }
);

module.exports = router;





/*
// POST /api/reportes
// Crea un reporte de incidencia (usuario autenticado)
router.post('/', authJWT, async (req, res) => {
  const { plaza_id, descripcion, es_prioritario, razon_prioridad } = req.body;

  if (!descripcion) {
    return res.status(400).json({ error: 'La descripción es obligatoria' });
  }

  try {
    const reporte = await pool.query(
      `INSERT INTO reportes_incidencias
        (usuario_id, plaza_id, descripcion, es_prioritario, razon_prioridad)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        req.usuario.id,
        plaza_id || null,
        descripcion,
        es_prioritario || false,
        razon_prioridad || null
      ]
    );

    res.status(201).json({
      mensaje: 'Reporte enviado correctamente',
      reporte: reporte.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/reportes
// Lista reportes — supervisor ve todos, usuario ve los suyos
router.get('/', authJWT, async (req, res) => {
  try {
    let query = `
      SELECT
        r.id,
        r.descripcion,
        r.es_prioritario,
        r.razon_prioridad,
        r.respuesta_supervisor,
        r.valoracion,
        r.creado_en,
        r.actualizado_en,
        er.codigo  AS estado,
        er.label   AS estado_label,
        u.nombre   AS usuario_nombre,
        u.codigo_universitario,
        p.codigo   AS plaza_codigo
       FROM reportes_incidencias r
       JOIN estados_reporte er ON er.id = r.estado_id
       JOIN usuarios         u  ON u.id  = r.usuario_id
       LEFT JOIN plazas      p  ON p.id  = r.plaza_id
       WHERE 1=1
    `;

    const params = [];

    // Supervisor ve todos, usuario solo los suyos
    if (req.usuario.rol !== 'supervisor') {
      query += ` AND r.usuario_id = $1`;
      params.push(req.usuario.id);
    }

    query += ' ORDER BY r.es_prioritario DESC, r.creado_en DESC';

    const resultado = await pool.query(query, params);
    res.json(resultado.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PATCH /api/reportes/:id
// Responde un reporte (solo supervisor)
router.patch('/:id', authJWT, soloSupervisor, async (req, res) => {
  const { respuesta, estado } = req.body;

  if (!respuesta || !estado) {
    return res.status(400).json({ error: 'Faltan respuesta y estado' });
  }

  try {
    // Buscar el estado_id
    const estadoRow = await pool.query(
      `SELECT id FROM estados_reporte WHERE codigo = $1`,
      [estado]
    );
    if (estadoRow.rows.length === 0) {
      return res.status(400).json({ error: 'Estado no válido' });
    }

    const reporte = await pool.query(
      `UPDATE reportes_incidencias
       SET respuesta_supervisor = $1,
           estado_id            = $2,
           supervisor_id        = $3,
           actualizado_en       = NOW()
       WHERE id = $4
       RETURNING *`,
      [respuesta, estadoRow.rows[0].id, req.usuario.id, req.params.id]
    );

    if (reporte.rows.length === 0) {
      return res.status(404).json({ error: 'Reporte no encontrado' });
    }

    // Notificar al usuario que su reporte fue respondido
    await pool.query(
      `INSERT INTO notificaciones
        (usuario_id, tipo_id, titulo, mensaje)
       VALUES (
         $1,
         (SELECT id FROM tipos_notificacion WHERE codigo = 'reporte'),
         'Tu reporte fue respondido',
         $2
       )`,
      [reporte.rows[0].usuario_id, respuesta]
    );

    res.json({
      mensaje: 'Reporte respondido correctamente',
      reporte: reporte.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PATCH /api/reportes/:id/valorar
// El usuario valora la atención una vez el reporte está resuelto
router.patch('/:id/valorar', authJWT, async (req, res) => {
  const { valoracion } = req.body;

  if (!valoracion || valoracion < 1 || valoracion > 5) {
    return res.status(400).json({ error: 'La valoración debe ser un número entre 1 y 5' });
  }

  try {
    // Verificar que el reporte pertenece al usuario y está resuelto
    const reporte = await pool.query(
      `SELECT r.id, r.valoracion, er.codigo AS estado
       FROM reportes_incidencias r
       JOIN estados_reporte er ON er.id = r.estado_id
       WHERE r.id = $1 AND r.usuario_id = $2`,
      [req.params.id, req.usuario.id]
    );

    if (reporte.rows.length === 0) {
      return res.status(404).json({ error: 'Reporte no encontrado' });
    }

    if (reporte.rows[0].estado !== 'resuelto') {
      return res.status(409).json({ error: 'Solo puedes valorar reportes resueltos' });
    }

    if (reporte.rows[0].valoracion !== null) {
      return res.status(409).json({ error: 'Este reporte ya fue valorado' });
    }

    await pool.query(
      `UPDATE reportes_incidencias
       SET valoracion = $1, actualizado_en = NOW()
       WHERE id = $2`,
      [valoracion, req.params.id]
    );

    res.json({ mensaje: 'Valoración registrada correctamente' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
*/