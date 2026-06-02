require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  // Configura la zona horaria nativamente en Postgres para cada conexión
  options: "-c timezone=America/Lima" 
});

pool.on('connect', () => {
  console.log('PostgreSQL conectado en America/Lima (UTC-5)');
});

pool.on('error', (err) => {
  console.error('Error PostgreSQL:', err);
});

module.exports = pool;