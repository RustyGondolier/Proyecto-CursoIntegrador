require('dotenv').config();
const pool = require('./index');

async function testConexion() {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM plazas');
    console.log('Conexión exitosa.');
    console.log('Total de plazas:', result.rows[0].count);
    process.exit(0);
  } catch (err) {
    console.error('Error de conexión:', err.message);
    process.exit(1);
  }
}

testConexion();