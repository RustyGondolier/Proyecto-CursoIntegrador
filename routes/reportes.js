const express = require('express');
const pool = require('../db');
const {
  authJWT,
  soloSupervisor
} = require('../middleware/authJWT');

const router = express.Router();

/* =====================================================
   CREAR REPORTE
===================================================== */

router.post(
  '/',
  authJWT,
  async (req, res) => {

    const {
      solicitud_id,
      plaza_id,
      estacionamiento_id,
      descripcion
    } = req.body;

    if (!descripcion) {
      return res.status(400).json({
        error: 'Descripción requerida'
      });
    }

    try {

      const reporte = await pool.query(
        `
        INSERT INTO reportes_incidencias (
          usuario_id,
          solicitud_id,
          plaza_id,
          estacionamiento_id,
          descripcion
        )
        VALUES ($1,$2,$3,$4,$5)
        RETURNING *
        `,
        [
          req.usuario.id,
          solicitud_id || null,
          plaza_id || null,
          estacionamiento_id || null,
          descripcion
        ]
      );

      await pool.query(
        `
        INSERT INTO notificaciones (
          usuario_id,
          tipo_id,
          titulo,
          mensaje
        )
        VALUES (
          $1,
          (
            SELECT id
            FROM tipos_notificacion
            WHERE codigo='reporte'
          ),
          'Reporte enviado',
          'Tu incidencia fue registrada correctamente.'
        )
        `,
        [req.usuario.id]
      );

      res.status(201).json(reporte.rows[0]);

    } catch (err) {

      console.error(err);

      res.status(500).json({
        error: 'Error interno'
      });

    }

  }
);

/* =====================================================
   MIS REPORTES
===================================================== */

router.get(
  '/mis-reportes',
  authJWT,
  async (req, res) => {

    try {

      const resultado = await pool.query(
        `
        SELECT
          r.*,
          er.codigo estado_codigo,
          er.descripcion estado_descripcion
        FROM reportes_incidencias r
        JOIN estados_reporte er
          ON er.id = r.estado_id
        WHERE r.usuario_id = $1
        ORDER BY r.creado_en DESC
        `,
        [req.usuario.id]
      );

      res.json(resultado.rows);

    } catch (err) {

      console.error(err);

      res.status(500).json({
        error: 'Error interno'
      });

    }

  }
);

/* =====================================================
   TODOS LOS REPORTES
===================================================== */

router.get(
  '/',
  authJWT,
  soloSupervisor,
  async (req, res) => {

    try {

      const resultado = await pool.query(
        `
        SELECT
          r.id,
          r.descripcion,
          r.es_prioritario,
          r.razon_prioridad,
          r.respuesta_supervisor,
          r.creado_en,

          u.nombre usuario,

          er.codigo estado,

          e.nombre estacionamiento

        FROM reportes_incidencias r

        JOIN usuarios u
          ON u.id = r.usuario_id

        JOIN estados_reporte er
          ON er.id = r.estado_id

        LEFT JOIN estacionamientos e
          ON e.id = r.estacionamiento_id

        ORDER BY
          r.es_prioritario DESC,
          r.creado_en DESC
        `
      );

      res.json(resultado.rows);

    } catch (err) {

      console.error(err);

      res.status(500).json({
        error: 'Error interno'
      });

    }

  }
);

/* =====================================================
   RESPONDER REPORTE
===================================================== */

router.patch(
  '/:id/responder',
  authJWT,
  soloSupervisor,
  async (req, res) => {

    const {
      respuesta_supervisor,
      estado_id
    } = req.body;

    try {

      const reporte = await pool.query(
        `
        SELECT usuario_id
        FROM reportes_incidencias
        WHERE id = $1
        `,
        [req.params.id]
      );

      if (reporte.rows.length === 0) {
        return res.status(404).json({
          error: 'Reporte no encontrado'
        });
      }

      await pool.query(
        `
        UPDATE reportes_incidencias
        SET
          respuesta_supervisor = $1,
          supervisor_id = $2,
          estado_id = $3,
          actualizado_en = NOW()
        WHERE id = $4
        `,
        [
          respuesta_supervisor,
          req.usuario.id,
          estado_id || 3,
          req.params.id
        ]
      );

      await pool.query(
        `
        INSERT INTO notificaciones (
          usuario_id,
          tipo_id,
          titulo,
          mensaje
        )
        VALUES (
          $1,
          (
            SELECT id
            FROM tipos_notificacion
            WHERE codigo='reporte'
          ),
          'Respuesta a incidencia',
          'Tu incidencia fue atendida.'
        )
        `,
        [
          reporte.rows[0].usuario_id
        ]
      );

      res.json({
        mensaje: 'Reporte actualizado'
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        error: 'Error interno'
      });

    }

  }
);

/* =====================================================
   MARCAR PRIORITARIO
===================================================== */

router.patch(
  '/:id/prioridad',
  authJWT,
  soloSupervisor,
  async (req, res) => {

    const {
      razon_prioridad
    } = req.body;

    try {

      await pool.query(
        `
        UPDATE reportes_incidencias
        SET
          es_prioritario = true,
          razon_prioridad = $1,
          estado_id = (
            SELECT id
            FROM estados_reporte
            WHERE codigo='prioritario'
          )
        WHERE id = $2
        `,
        [
          razon_prioridad,
          req.params.id
        ]
      );

      res.json({
        mensaje: 'Reporte priorizado'
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        error: 'Error interno'
      });

    }

  }
);

module.exports = router;