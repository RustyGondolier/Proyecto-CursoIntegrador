const express = require('express');
const pool = require('../db');
const {
  authJWT,
  rolesGestion
} = require('../middleware/authJWT');

const router = express.Router();

/* =====================================================
   LISTAR USUARIOS
===================================================== */

router.get(
  '/',
  authJWT,
  rolesGestion,
  async (req, res) => {

    try {

      const resultado = await pool.query(`
        SELECT
          id,
          codigo_universitario,
          nombre,
          rol,
          estado_cuenta,
          verificado,
          conadis_verificado,
          puntos_infraccion,
          creado_en
        FROM usuarios
        ORDER BY creado_en DESC
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
   DETALLE USUARIO
===================================================== */

router.get(
  '/:id',
  authJWT,
  rolesGestion,
  async (req, res) => {

    try {

      const usuario = await pool.query(
        `
        SELECT *
        FROM usuarios
        WHERE id = $1
        `,
        [req.params.id]
      );

      if (usuario.rows.length === 0) {
        return res.status(404).json({
          error: 'Usuario no encontrado'
        });
      }

      res.json(usuario.rows[0]);

    } catch (err) {

      console.error(err);

      res.status(500).json({
        error: 'Error interno'
      });

    }

  }
);

/* =====================================================
   VERIFICAR USUARIO
===================================================== */

router.patch(
  '/:id/verificar',
  authJWT,
  rolesGestion,
  async (req, res) => {

    try {

      await pool.query(
        `
        UPDATE usuarios
        SET
          verificado = true,
          requiere_reverificacion = false,
          verificado_por = $1,
          verificado_en = NOW()
        WHERE id = $2
        `,
        [
          req.usuario.id,
          req.params.id
        ]
      );

      await pool.query(
        `
        INSERT INTO acciones_administrativas(
          administrador_id,
          usuario_afectado_id,
          tipo,
          descripcion
        )
        VALUES($1,$2,'verificacion',$3)
        `,
        [
          req.usuario.id,
          req.params.id,
          'Usuario verificado'
        ]
      );

      res.json({
        mensaje: 'Usuario verificado'
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
   APROBAR CONADIS
===================================================== */

router.patch(
  '/:id/conadis',
  authJWT,
  rolesGestion,
  async (req, res) => {

    const {
      aprobado
    } = req.body;

    try {

      await pool.query(
        `
        UPDATE usuarios
        SET conadis_verificado = $1
        WHERE id = $2
        `,
        [
          aprobado,
          req.params.id
        ]
      );

      res.json({
        mensaje: aprobado
          ? 'CONADIS aprobado'
          : 'CONADIS rechazado'
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
   SUSPENDER USUARIO
===================================================== */

router.patch(
  '/:id/suspender',
  authJWT,
  rolesGestion,
  async (req, res) => {

    const {
      motivo
    } = req.body;

    try {

      await pool.query(
        `
        UPDATE usuarios
        SET
          estado_cuenta = 'suspendida',
          motivo_suspension = $1
        WHERE id = $2
        `,
        [
          motivo,
          req.params.id
        ]
      );

      res.json({
        mensaje: 'Cuenta suspendida'
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
   REACTIVAR USUARIO
===================================================== */

router.patch(
  '/:id/reactivar',
  authJWT,
  rolesGestion,
  async (req, res) => {

    try {

      await pool.query(
        `
        UPDATE usuarios
        SET
          estado_cuenta='activa',
          motivo_suspension=NULL
        WHERE id=$1
        `,
        [req.params.id]
      );

      res.json({
        mensaje:'Cuenta reactivada'
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        error:'Error interno'
      });

    }

  }
);

/* =====================================================
   HISTORIAL ACCESOS
===================================================== */

router.get(
  '/:id/accesos',
  authJWT,
  rolesGestion,
  async (req,res) => {

    try {

      const resultado = await pool.query(
        `
        SELECT *
        FROM historial_accesos
        WHERE usuario_id = $1
        ORDER BY creado_en DESC
        `,
        [req.params.id]
      );

      res.json(resultado.rows);

    } catch(err){

      console.error(err);

      res.status(500).json({
        error:'Error interno'
      });

    }

  }
);

/* =====================================================
   INFRACCIONES USUARIO
===================================================== */

router.get(
  '/:id/infracciones',
  authJWT,
  rolesGestion,
  async (req,res) => {

    try {

      const resultado = await pool.query(
        `
        SELECT *
        FROM infracciones
        WHERE usuario_id = $1
        ORDER BY creado_en DESC
        `,
        [req.params.id]
      );

      res.json(resultado.rows);

    } catch(err){

      console.error(err);

      res.status(500).json({
        error:'Error interno'
      });

    }

  }
);

module.exports = router;