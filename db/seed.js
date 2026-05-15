require('dotenv').config();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const pool   = require('./index');

async function seed() {
  try {
    const existe = await pool.query(
      "SELECT id FROM usuarios WHERE rol = 'supervisor'"
    );

    if (existe.rows.length > 0) {
      console.log('Ya existe un supervisor, seed omitido.');
      process.exit(0);
    }

    const hash     = await bcrypt.hash(process.env.SUPERVISOR_PASSWORD, 10);
    const qrToken  = crypto.randomBytes(32).toString('hex');

    const supervisor = await pool.query(
      `INSERT INTO usuarios
        (codigo_universitario, nombre, password_hash, telefono, rol, qr_token)
       VALUES ($1, $2, $3, $4, 'supervisor', $5)
       RETURNING id`,
      [
        process.env.SUPERVISOR_CODIGO,
        process.env.SUPERVISOR_NOMBRE,
        hash,
        process.env.SUPERVISOR_TELEFONO,
        qrToken
      ]
    );

    await pool.query(
      `INSERT INTO vehiculos (usuario_id, tipo_vehiculo_id, placa, modelo)
       VALUES ($1, 1, $2, 'N/A')`,
      [supervisor.rows[0].id, process.env.SUPERVISOR_PLACA]
    );

    console.log('Supervisor creado correctamente.');
    process.exit(0);

  } catch (err) {
    console.error('Error en seed:', err.message);
    process.exit(1);
  }
}

seed();