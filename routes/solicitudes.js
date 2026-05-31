const express = require('express');

const pool = require('../db');
const {
  authJWT,
  soloSupervisor
} = require('../middleware/authJWT');

const router = express.Router();

/*
=================================
CREAR SOLICITUD
=================================
POST /api/solicitudes
*/
router.post(
  '/',
  authJWT,
  async (req, res) => {

    try {

      const {
        estacionamiento_id
      } = req.body;

      const usuario_id = req.usuario.id;

      // TODO:
      // validar usuario
      // validar vehículo
      // validar ubicación
      // buscar plaza disponible
      // crear solicitud

      return res.status(201).json({
        mensaje: 'Solicitud creada'
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
MIS SOLICITUDES
=================================
GET /api/solicitudes/mias
*/
router.get(
  '/mias',
  authJWT,
  async (req, res) => {

    try {

      const resultado = await pool.query(
        `
        SELECT
          s.*,
          e.nombre AS estacionamiento,
          p.codigo AS plaza_codigo
        FROM solicitudes_estacionamiento s
        JOIN estacionamientos e
          ON e.id = s.estacionamiento_id
        LEFT JOIN plazas p
          ON p.id = s.plaza_asignada_id
        WHERE s.usuario_id = $1
        ORDER BY s.creado_en DESC
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

/*
=================================
DETALLE SOLICITUD
=================================
GET /api/solicitudes/:id
*/
router.get(
  '/:id',
  authJWT,
  async (req, res) => {

    try {

      const resultado = await pool.query(
        `
        SELECT *
        FROM solicitudes_estacionamiento
        WHERE id = $1
        `,
        [req.params.id]
      );

      if (resultado.rows.length === 0) {
        return res.status(404).json({
          error: 'Solicitud no encontrada'
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
CANCELAR SOLICITUD
=================================
POST /api/solicitudes/:id/cancelar
*/
router.post(
  '/:id/cancelar',
  authJWT,
  async (req, res) => {

    try {

      // TODO:
      // cambiar estado a cancelado
      // liberar plaza

      return res.json({
        mensaje: 'Solicitud cancelada'
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
REGISTRAR INGRESO
=================================
POST /api/solicitudes/:id/ingresar
=================================
SUPERVISOR
*/
router.post(
  '/:id/ingresar',
  authJWT,
  soloSupervisor,
  async (req, res) => {

    try {

      // TODO:
      // validar solicitud
      // registrar ingreso

      return res.json({
        mensaje: 'Ingreso registrado'
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
REGISTRAR SALIDA
=================================
POST /api/solicitudes/:id/salir
=================================
SUPERVISOR
*/
router.post(
  '/:id/salir',
  authJWT,
  soloSupervisor,
  async (req, res) => {

    try {

      // TODO:
      // registrar salida
      // liberar plaza
      // crear historial

      return res.json({
        mensaje: 'Salida registrada'
      });

    } catch (err) {

      console.error(err);

      return res.status(500).json({
        error: 'Error interno del servidor'
      });

    }

  }
);

module.exports = router;