const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const crypto   = require('crypto');
const pool     = require('../db/index');
const { authJWT } = require('../middleware/authJWT');
const router   = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
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

  if (!codigo_universitario || !nombre || !password || !placa || !fecha_nacimiento) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  // Validar mayoría de edad
  const nacimiento = new Date(fecha_nacimiento);
  const hoy        = new Date();
  let   edad       = hoy.getFullYear() - nacimiento.getFullYear();
  const mes        = hoy.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
  if (edad < 18) {
    return res.status(400).json({ error: 'Debes ser mayor de edad para registrarte' });
  }

  // Validar formato de placa peruana (ABC-123 o ABC-1234)
  const formatoPlaca = /^[A-Z0-9]{3}-\d{3,4}$/;
  if (!formatoPlaca.test(placa.toUpperCase())) {
    return res.status(400).json({ error: 'Formato de placa inválido (ej: ABC-1234)' });
  }

  if(password.length < 6){
    return res.status(400).json({
      error:'La contraseña debe tener mínimo 6 caracteres'
    });
  }

  // Validar rol permitido para registro público
  const rolesPermitidos = ['estudiante', 'docente', 'administrativo'];
  const rolFinal = rolesPermitidos.includes(rol) ? rol : 'estudiante';

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
      [placa.toUpperCase()]
    );
    if (placaExiste.rows.length > 0) {
      return res.status(409).json({ error: 'La placa ya está registrada' });
    }

    const hash    = await bcrypt.hash(password, 10);
    const qrToken = crypto.randomBytes(32).toString('hex');

    const nuevoUsuario = await pool.query(
      `INSERT INTO usuarios (
        codigo_universitario, nombre, password_hash, telefono,
        dni, fecha_nacimiento, correo_institucional,
        nro_licencia, licencia_fecha_vencimiento,
        codigo_conadis, rol, qr_token
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING id`,
      [
        codigo_universitario,
        nombre,
        hash,
        telefono                  || null,
        dni                       || null,
        fecha_nacimiento,
        correo_institucional      || null,
        nro_licencia              || null,
        licencia_fecha_vencimiento|| null,
        codigo_conadis            || null,
        rolFinal,
        qrToken
      ]
    );

    await pool.query(
      `INSERT INTO vehiculos (usuario_id, tipo_vehiculo_id, placa, modelo)
       VALUES ($1, $2, $3, $4)`,
      [
        nuevoUsuario.rows[0].id,
        tipo_vehiculo_id || 1,
        placa.toUpperCase(),
        modelo || null
      ]
    );

    // Registrar evento analytics
    await pool.query(
      `INSERT INTO eventos_sistema (tipo, usuario_id, sede_id, metadata)
       VALUES ('usuario_registrado', $1, 1, $2)`,
      [nuevoUsuario.rows[0].id, JSON.stringify({ rol: rolFinal })]
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
      `SELECT u.*, v.id AS vehiculo_id, v.placa, v.modelo,
              v.tipo_vehiculo_id, tv.codigo AS tipo_vehiculo
       FROM usuarios u
       LEFT JOIN vehiculos      v  ON v.usuario_id = u.id AND v.activo = true
       LEFT JOIN tipos_vehiculo tv ON tv.id = v.tipo_vehiculo_id
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
        error:  'Cuenta suspendida',
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
        correo_institucional: usuario.correo_institucional,
        rol:                  usuario.rol,
        conadis_verificado:   usuario.conadis_verificado,
        vehiculo_id:          usuario.vehiculo_id,
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

// GET /api/auth/perfil
router.get('/perfil', authJWT, async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT
        u.id, u.codigo_universitario, u.nombre, u.telefono,
        u.dni, u.fecha_nacimiento, u.correo_institucional,
        u.nro_licencia, u.licencia_fecha_vencimiento,
        u.codigo_conadis, u.conadis_verificado,
        u.rol, u.estado_cuenta, u.puntos_infraccion, u.creado_en,
        v.id    AS vehiculo_id,
        v.placa, v.modelo,
        tv.codigo AS tipo_vehiculo
       FROM usuarios u
       LEFT JOIN vehiculos      v  ON v.usuario_id = u.id AND v.activo = true
       LEFT JOIN tipos_vehiculo tv ON tv.id = v.tipo_vehiculo_id
       WHERE u.id = $1`,
      [req.usuario.id]
    );
    res.json(resultado.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/auth/perfil
router.put(
  '/perfil',
  authJWT,
  async (req, res) => {

    const {
      nombre,
      telefono,
      correo_institucional,
      licencia_fecha_vencimiento
    } = req.body;

    try{

      await pool.query(
        `
        UPDATE usuarios
        SET
          nombre = $1,
          telefono = $2,
          correo_institucional = $3,
          licencia_fecha_vencimiento = $4
        WHERE id = $5
        `,
        [
          nombre,
          telefono,
          correo_institucional,
          licencia_fecha_vencimiento,
          req.usuario.id
        ]
      );

      res.json({
        mensaje:'Perfil actualizado'
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