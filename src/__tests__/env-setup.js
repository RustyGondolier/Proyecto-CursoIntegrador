// ============================================================
// env-setup.js — Carga .env.test antes de cualquier test
// Se ejecuta via "setupFiles" en jest.config.js
// Esto asegura que process.env tenga los valores de test
// antes de que se importe cualquier modulo (app, db, etc.)
// ============================================================

const path = require('path');
const dotenv = require('dotenv');

// Cargar .env.test desde la raiz del proyecto
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });
