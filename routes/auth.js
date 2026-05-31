const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const pool = require('../db/index');
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
      placa,
      modelo,
      tipo_vehiculo_id
    } = req.body;

    if (
      !codigo_universitario ||
      !nombre ||
      !password ||
      !placa
    ) {
      return res.status(400).json({
        error: 'Faltan campos obligatorios'
      });
    }

    const codigo =
      codigo_universitario
        .trim()
        .toUpperCase();

    let rolFinal = 'estudiante';

    if (codigo.startsWith('C')) {
      rolFinal = 'docente';
    }

    if (
      !codigo.startsWith('U') &&
      !codigo.startsWith('C')
    ) {
      return res.status(400).json({
        error: 'Código universitario inválido'
      });
    }

    const usuarioExiste =
      await pool.query(
        `
        SELECT id
        FROM usuarios
        WHERE codigo_universitario = $1
        `,
        [codigo]
      );

    if (usuarioExiste.rows.length > 0) {
      return res.status(409).json({
        error: 'El usuario ya existe'
      });
    }

    const placaExiste =
      await pool.query(
        `
        SELECT id
        FROM vehiculos
        WHERE placa = $1
        `,
        [placa.toUpperCase()]
      );

    if (placaExiste.rows.length > 0) {
      return res.status(409).json({
        error: 'La placa ya está registrada'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'La contraseña debe tener mínimo 6 caracteres'
      });
    }

    const nacimiento =
      new Date(fecha_nacimiento);

    const hoy =
      new Date();

    let edad =
      hoy.getFullYear() -
      nacimiento.getFullYear();

    const mes =
      hoy.getMonth() -
      nacimiento.getMonth();

    if (
      mes < 0 ||
      (
        mes === 0 &&
        hoy.getDate() <
        nacimiento.getDate()
      )
    ) {
      edad--;
    }

    if (edad < 18) {
      return res.status(400).json({
        error: 'Debe ser mayor de edad'
      });
    }

    const hash =
      await bcrypt.hash(
        password,
        10
      );

    const usuario =
      await pool.query(
        `
        INSERT INTO usuarios (
          codigo_universitario,
          nombre,
          password_hash,
          telefono,
          dni,
          fecha_nacimiento,
          correo_institucional,
          nro_licencia,
          licencia_fecha_vencimiento,
          codigo_conadis,
          rol
        )
        VALUES (
          $1,$2,$3,$4,$5,
          $6,$7,$8,$9,$10,$11
        )
        RETURNING id
        `,
        [
          codigo,
          nombre,
          hash,
          telefono || null,
          dni || null,
          fecha_nacimiento || null,
          correo_institucional || null,
          nro_licencia || null,
          licencia_fecha_vencimiento || null,
          codigo_conadis || null,
          rolFinal
        ]
      );

    await pool.query(
      `
      INSERT INTO vehiculos (
        usuario_id,
        tipo_vehiculo_id,
        placa,
        modelo
      )
      VALUES ($1,$2,$3,$4)
      `,
      [
        usuario.rows[0].id,
        tipo_vehiculo_id || 1,
        placa.toUpperCase(),
        modelo || null
      ]
    );

    res.status(201).json({
      mensaje: 'Usuario registrado correctamente'
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
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

    const resultado =
      await pool.query(
        `
        SELECT *
        FROM usuarios
        WHERE codigo_universitario = $1
        `,
        [
          codigo_universitario
            .trim()
            .toUpperCase()
        ]
      );

    if (resultado.rows.length === 0) {
      return res.status(401).json({
        error: 'Credenciales incorrectas'
      });
    }

    const usuario =
      resultado.rows[0];

    const passwordValida =
      await bcrypt.compare(
        password,
        usuario.password_hash
      );

    if (!passwordValida) {

      await pool.query(
        `
        INSERT INTO historial_accesos(
          usuario_id,
          estado,
          ip_origen,
          user_agent
        )
        VALUES($1,$2,$3,$4)
        `,
        [
          usuario.id,
          'fallido',
          req.ip,
          req.headers['user-agent']
        ]
      );

      return res.status(401).json({
        error: 'Credenciales incorrectas'
      });
    }

    await pool.query(
      `
      INSERT INTO historial_accesos(
        usuario_id,
        estado,
        ip_origen,
        user_agent
      )
      VALUES($1,$2,$3,$4)
      `,
      [
        usuario.id,
        'exitoso',
        req.ip,
        req.headers['user-agent']
      ]
    );

    const token =
      jwt.sign(
        {
          id: usuario.id,
          rol: usuario.rol,
          codigo_universitario:
            usuario.codigo_universitario
        },
        process.env.JWT_SECRET,
        {
          expiresIn: '8h'
        }
      );

    res.json({
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        rol: usuario.rol,
        codigo_universitario:
          usuario.codigo_universitario
      }
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
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