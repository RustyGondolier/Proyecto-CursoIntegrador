const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const crypto   = require('crypto');
const pool     = require('../db/index');
const router   = express.Router();


// POST /api/auth/register
router.post('/register', async (req, res) => {
  const {
    codigo_universitario,
    nombre,
    password,
    telefono,
    placa,
    modelo,
    tipo_vehiculo_id
  } = req.body;

  if (!codigo_universitario || !nombre || !password || !placa) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    const codigoExiste = await pool.query(
      'SELECT id FROM usuarios WHERE codigo_universitario = $1',
      [codigo_universitario]
    );
    if (codigoExiste.rows.length > 0) {
      return res.status(409).json({ error: 'El código universitario ya está registrado' });
    }

    const placaExiste = await pool.query(
      'SELECT id FROM vehiculos WHERE placa = $1',
      [placa]
    );
    if (placaExiste.rows.length > 0) {
      return res.status(409).json({ error: 'La placa ya está registrada' });
    }

    const hash    = await bcrypt.hash(password, 10);
    const qrToken = crypto.randomBytes(32).toString('hex');

    const nuevoUsuario = await pool.query(
      `INSERT INTO usuarios
        (codigo_universitario, nombre, password_hash, telefono, rol, qr_token)
       VALUES ($1, $2, $3, $4, 'user', $5)
       RETURNING id`,
      [codigo_universitario, nombre, hash, telefono || null, qrToken]
    );

    await pool.query(
      `INSERT INTO vehiculos (usuario_id, tipo_vehiculo_id, placa, modelo)
       VALUES ($1, $2, $3, $4)`,
      [nuevoUsuario.rows[0].id, tipo_vehiculo_id || 1, placa, modelo || null]
    );

    res.status(201).json({ mensaje: 'Usuario registrado correctamente' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});


// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { codigo_universitario, password } = req.body;

  if (!codigo_universitario || !password) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    const resultado = await pool.query(
      `SELECT u.*, v.placa, v.modelo, v.tipo_vehiculo_id,
              tv.codigo AS tipo_vehiculo
       FROM usuarios u
       LEFT JOIN vehiculos v
         ON v.usuario_id = u.id AND v.activo = true
       LEFT JOIN tipos_vehiculo tv
         ON tv.id = v.tipo_vehiculo_id
       WHERE u.codigo_universitario = $1
       LIMIT 1`,
      [codigo_universitario]
    );

    if (resultado.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const usuario = resultado.rows[0];

    if (usuario.estado_cuenta !== 'activa') {
      return res.status(403).json({
        error: 'Cuenta suspendida',
        motivo: usuario.motivo_suspension
      });
    }

    const passwordValida = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValida) {
      await pool.query(
        `INSERT INTO historial_accesos (usuario_id, estado, ip_origen)
         VALUES ($1, 'fallido', $2)`,
        [usuario.id, req.ip]
      );
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    await pool.query(
      `INSERT INTO historial_accesos (usuario_id, estado, ip_origen)
       VALUES ($1, 'exitoso', $2)`,
      [usuario.id, req.ip]
    );

    const token = jwt.sign(
      {
        id:                   usuario.id,
        codigo_universitario: usuario.codigo_universitario,
        nombre:               usuario.nombre,
        rol:                  usuario.rol
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      usuario: {
        id:                   usuario.id,
        codigo_universitario: usuario.codigo_universitario,
        nombre:               usuario.nombre,
        rol:                  usuario.rol,
        placa:                usuario.placa,
        modelo:               usuario.modelo,
        tipo_vehiculo:        usuario.tipo_vehiculo
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;