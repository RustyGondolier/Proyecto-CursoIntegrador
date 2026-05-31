const express = require('express');
const pool = require('../db');

const {
  authJWT,
  rolesGestion
} = require('../middleware/authJWT');

const router = express.Router();

/* =====================================================
   CREAR MENSAJE DE SOPORTE
===================================================== */

router.post(
  '/',
  authJWT,
  async (req, res) => {

    const {
      asunto,
      descripcion
    } = req.body;

    if (!asunto || !descripcion) {
      return res.status(400).json({
        error: 'Asunto y descripción requeridos'
      });
    }

    try {

      const resultado = await pool.query(
        `
        INSERT INTO mensajes_soporte (
          usuario_id,
          asunto,
          descripcion
        )
        VALUES ($1,$2,$3)
        RETURNING *
        `,
        [
          req.usuario.id,
          asunto,
          descripcion
        ]
      );

      res.status(201).json(
        resultado.rows[0]
      );

    } catch (err) {

      console.error(err);

      res.status(500).json({
        error: 'Error interno'
      });

    }

  }
);

/* =====================================================
   MIS MENSAJES
===================================================== */

router.get(
  '/mis-mensajes',
  authJWT,
  async (req, res) => {

    try {

      const resultado = await pool.query(
        `
        SELECT *
        FROM mensajes_soporte
        WHERE usuario_id = $1
        ORDER BY creado_en DESC
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
   TODOS LOS MENSAJES
===================================================== */

router.get(
  '/',
  authJWT,
  rolesGestion,
  async (req, res) => {

    try {

      const resultado = await pool.query(
        `
        SELECT
          ms.*,
          u.nombre,
          u.codigo_universitario
        FROM mensajes_soporte ms
        JOIN usuarios u
          ON u.id = ms.usuario_id
        ORDER BY ms.creado_en DESC
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
   RESPONDER MENSAJE
===================================================== */

router.patch(
  '/:id/responder',
  authJWT,
  rolesGestion,
  async (req, res) => {

    const {
      respuesta
    } = req.body;

    if (!respuesta) {
      return res.status(400).json({
        error: 'Respuesta requerida'
      });
    }

    try {

      const ticket = await pool.query(
        `
        SELECT usuario_id
        FROM mensajes_soporte
        WHERE id = $1
        `,
        [req.params.id]
      );

      if (ticket.rows.length === 0) {
        return res.status(404).json({
          error: 'Mensaje no encontrado'
        });
      }

      await pool.query(
        `
        UPDATE mensajes_soporte
        SET
          respondido = true,
          respuesta = $1
        WHERE id = $2
        `,
        [
          respuesta,
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
            WHERE codigo='soporte'
          ),
          'Respuesta de soporte',
          'Tu solicitud de soporte fue respondida.'
        )
        `,
        [
          ticket.rows[0].usuario_id
        ]
      );

      res.json({
        mensaje: 'Respuesta enviada'
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