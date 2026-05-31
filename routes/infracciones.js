const express = require('express');

const pool = require('../db');

const {
  authJWT,
  soloSupervisor
} = require('../middleware/authJWT');

const router = express.Router();

/*
=================================
LISTAR TIPOS
=================================
GET /api/infracciones/tipos
*/
router.get(
  '/tipos',
  authJWT,
  soloSupervisor,
  async (req, res) => {

    try {

      const resultado = await pool.query(
        `
        SELECT
          id,
          codigo,
          descripcion
        FROM tipos_infraccion
        ORDER BY id
        `
      );

      return res.json(
        resultado.rows
      );

    } catch (err) {

      console.error(err);

      return res.status(500).json({
        error: 'Error interno del servidor'
      });

    }

  }
);

/*
=================================
REGISTRAR INFRACCIÓN
=================================
POST /api/infracciones
*/
router.post(
  '/',
  authJWT,
  soloSupervisor,
  async (req, res) => {

    try {

      const {
        usuario_id,
        vehiculo_id,
        plaza_id,
        solicitud_id,
        tipo_infraccion_id,
        descripcion
      } = req.body;

      if (
        !usuario_id ||
        !tipo_infraccion_id
      ) {
        return res.status(400).json({
          error: 'Datos incompletos'
        });
      }

      const resultado = await pool.query(
        `
        INSERT INTO infracciones (
          usuario_id,
          vehiculo_id,
          plaza_id,
          solicitud_id,
          supervisor_id,
          tipo_infraccion_id,
          descripcion
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7
        )
        RETURNING *
        `,
        [
          usuario_id,
          vehiculo_id || null,
          plaza_id || null,
          solicitud_id || null,
          req.usuario.id,
          tipo_infraccion_id,
          descripcion || null
        ]
      );

      await pool.query(
        `
        UPDATE usuarios
        SET puntos_infraccion =
            puntos_infraccion + 1
        WHERE id = $1
        `,
        [usuario_id]
      );

      return res.status(201).json({
        mensaje: 'Infracción registrada',
        infraccion: resultado.rows[0]
      });

    } catch (err) {

      console.error(err);

      return res.status(500).json({
        error: 'Error interno del servidor'
      });

    }

  }
);

/*
=================================
LISTAR INFRACCIONES
=================================
GET /api/infracciones
*/
router.get(
  '/',
  authJWT,
  soloSupervisor,
  async (req, res) => {

    try {

      const resultado = await pool.query(
        `
        SELECT

          i.id,
          i.descripcion,
          i.creado_en,

          ti.codigo,
          ti.descripcion AS tipo,

          u.nombre,
          u.codigo_universitario,

          v.placa

        FROM infracciones i

        JOIN usuarios u
          ON u.id = i.usuario_id

        LEFT JOIN vehiculos v
          ON v.id = i.vehiculo_id

        JOIN tipos_infraccion ti
          ON ti.id = i.tipo_infraccion_id

        ORDER BY i.creado_en DESC
        `
      );

      return res.json(
        resultado.rows
      );

    } catch (err) {

      console.error(err);

      return res.status(500).json({
        error: 'Error interno del servidor'
      });

    }

  }
);

/*
=================================
DETALLE
=================================
GET /api/infracciones/:id
*/
router.get(
  '/:id',
  authJWT,
  soloSupervisor,
  async (req, res) => {

    try {

      const resultado = await pool.query(
        `
        SELECT *
        FROM infracciones
        WHERE id = $1
        `,
        [req.params.id]
      );

      if (resultado.rows.length === 0) {
        return res.status(404).json({
          error: 'Infracción no encontrada'
        });
      }

      return res.json(
        resultado.rows[0]
      );

    } catch (err) {

      console.error(err);

      return res.status(500).json({
        error: 'Error interno del servidor'
      });

    }

  }
);

/*
=================================
MIS INFRACCIONES
=================================
GET /api/infracciones/mias
*/
router.get(
  '/mias',
  authJWT,
  async (req, res) => {

    try {

      const resultado = await pool.query(
        `
        SELECT

          i.id,
          i.descripcion,
          i.creado_en,

          ti.codigo,
          ti.descripcion AS tipo

        FROM infracciones i

        JOIN tipos_infraccion ti
          ON ti.id = i.tipo_infraccion_id

        WHERE i.usuario_id = $1

        ORDER BY i.creado_en DESC
        `,
        [req.usuario.id]
      );

      return res.json(
        resultado.rows
      );

    } catch (err) {

      console.error(err);

      return res.status(500).json({
        error: 'Error interno del servidor'
      });

    }

  }
);

module.exports = router;