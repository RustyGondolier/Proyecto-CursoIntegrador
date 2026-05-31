const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const pool = require('../db');
const { authJWT } = require('../middleware/authJWT');

const router = express.Router();

/*
=================================
REGISTER
=================================
*/
router.post('/register', async (req, res) => {
  try {

    const {
      codigo_universitario,
      nombre,
      password,
      telefono,
      dni,
      fecha_nacimiento,
      correo_institucional,
      nro_licencia,
      licencia_fecha_vencimiento,
      codigo_conadis,
      rol,
      placa,
      modelo,
      tipo_vehiculo_id
    } = req.body;

    // TODO:
    // Validaciones
    // Crear usuario
    // Crear vehículo
    // Registrar evento

    return res.status(201).json({
      mensaje: 'Usuario registrado'
    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      error: 'Error interno del servidor'
    });

  }
});

/*
=================================
LOGIN
=================================
*/
router.post('/login', async (req, res) => {
  try {

    const {
      codigo_universitario,
      password
    } = req.body;

    // TODO:
    // Buscar usuario
    // Verificar password
    // Registrar historial acceso
    // Generar JWT

    return res.json({
      token: 'pendiente'
    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      error: 'Error interno del servidor'
    });

  }
});

/*
=================================
OBTENER PERFIL
=================================
*/
router.get(
  '/perfil',
  authJWT,
  async (req, res) => {

    try {

      const resultado = await pool.query(
        `
        SELECT
          u.*,
          v.id AS vehiculo_id,
          v.placa,
          v.modelo,
          tv.codigo AS tipo_vehiculo
        FROM usuarios u
        LEFT JOIN vehiculos v
          ON v.usuario_id = u.id
          AND v.activo = true
        LEFT JOIN tipos_vehiculo tv
          ON tv.id = v.tipo_vehiculo_id
        WHERE u.id = $1
        `,
        [req.usuario.id]
      );

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
ACTUALIZAR PERFIL
=================================
*/
router.put(
  '/perfil',
  authJWT,
  async (req, res) => {

    try {

      const {
        nombre,
        telefono,
        correo_institucional,
        licencia_fecha_vencimiento,
        preferencia_tema
      } = req.body;

      await pool.query(
        `
        UPDATE usuarios
        SET
          nombre = $1,
          telefono = $2,
          correo_institucional = $3,
          licencia_fecha_vencimiento = $4,
          preferencia_tema = $5
        WHERE id = $6
        `,
        [
          nombre,
          telefono,
          correo_institucional,
          licencia_fecha_vencimiento,
          preferencia_tema,
          req.usuario.id
        ]
      );

      return res.json({
        mensaje: 'Perfil actualizado'
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
CAMBIAR PASSWORD
=================================
*/
router.post(
  '/cambiar-password',
  authJWT,
  async (req, res) => {

    try {

      const {
        password_actual,
        password_nueva
      } = req.body;

      // TODO:
      // Buscar usuario
      // Comparar password actual
      // Actualizar hash

      return res.json({
        mensaje: 'Contraseña actualizada'
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