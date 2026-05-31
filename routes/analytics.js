const express = require('express');
const pool = require('../db');

const {
  authJWT,
  rolesGestion
} = require('../middleware/authJWT');

const router = express.Router();

/* =====================================================
   DASHBOARD GENERAL
===================================================== */

router.get(
  '/dashboard',
  authJWT,
  rolesGestion,
  async (req, res) => {

    try {

      const [
        ocupacion,
        permanencia,
        reincidentes,
        reportes
      ] = await Promise.all([

        pool.query(`
          SELECT *
          FROM v_ocupacion_actual
        `),

        pool.query(`
          SELECT *
          FROM v_permanencia_promedio
        `),

        pool.query(`
          SELECT *
          FROM v_usuarios_reincidentes
          LIMIT 10
        `),

        pool.query(`
          SELECT *
          FROM v_reportes_por_estacionamiento
        `)

      ]);

      res.json({
        ocupacion: ocupacion.rows,
        permanencia: permanencia.rows[0],
        reincidentes: reincidentes.rows,
        reportes: reportes.rows
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
   OCUPACIÓN ACTUAL
===================================================== */

router.get(
  '/ocupacion',
  authJWT,
  rolesGestion,
  async (req, res) => {

    try {

      const resultado = await pool.query(`
        SELECT *
        FROM v_ocupacion_actual
      `);

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
   FLUJO POR HORA
===================================================== */

router.get(
  '/flujo-hora',
  authJWT,
  rolesGestion,
  async (req, res) => {

    try {

      const resultado = await pool.query(`
        SELECT *
        FROM v_flujo_por_hora
      `);

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
   PERMANENCIA PROMEDIO
===================================================== */

router.get(
  '/permanencia',
  authJWT,
  rolesGestion,
  async (req, res) => {

    try {

      const resultado = await pool.query(`
        SELECT *
        FROM v_permanencia_promedio
      `);

      res.json(resultado.rows[0]);

    } catch (err) {

      console.error(err);

      res.status(500).json({
        error: 'Error interno'
      });

    }

  }
);

/* =====================================================
   USUARIOS REINCIDENTES
===================================================== */

router.get(
  '/reincidentes',
  authJWT,
  rolesGestion,
  async (req, res) => {

    try {

      const resultado = await pool.query(`
        SELECT *
        FROM v_usuarios_reincidentes
      `);

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
   REPORTES POR ESTACIONAMIENTO
===================================================== */

router.get(
  '/reportes-estacionamiento',
  authJWT,
  rolesGestion,
  async (req, res) => {

    try {

      const resultado = await pool.query(`
        SELECT *
        FROM v_reportes_por_estacionamiento
      `);

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
   ESTADÍSTICAS DIARIAS
===================================================== */

router.get(
  '/estadisticas-diarias',
  authJWT,
  rolesGestion,
  async (req, res) => {

    try {

      const resultado = await pool.query(`
        SELECT *
        FROM estadisticas_diarias
        ORDER BY fecha DESC
        LIMIT 30
      `);

      res.json(resultado.rows);

    } catch (err) {

      console.error(err);

      res.status(500).json({
        error: 'Error interno'
      });

    }

  }
);

module.exports = router;