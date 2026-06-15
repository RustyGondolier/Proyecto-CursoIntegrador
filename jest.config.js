// ============================================================
// jest.config.js — Configuracion de Jest
// ============================================================

module.exports = {
  // Entorno: Node (no jsdom, no hay DOM que probar)
  testEnvironment: 'node',

  // Setup que corre ANTES de cada suite de test
  // Carga .env.test para que process.env tenga los valores
  // correctos antes de importar cualquier modulo
  setupFiles: [
    './src/__tests__/env-setup.js'
  ],

  // Setup global: se ejecuta una vez antes de TODOS los tests
  globalSetup: './src/__tests__/setup.js',

  // Teardown global: se ejecuta una vez despues de TODOS los tests
  globalTeardown: './src/__tests__/teardown.js',

  // Timeout: 20 segundos (las consultas a BD pueden demorar)
  testTimeout: 20000,

  // Patron de busqueda de archivos de test
  testMatch: [
    '**/src/__tests__/**/*.test.js'
  ],

  // Verbosidad
  verbose: true,

  // Forzar salida despues de todos los tests (evita hangs)
  forceExit: true,

  // Detectar handles abiertos (ayuda a debuggear fugas)
  detectOpenHandles: true
};
