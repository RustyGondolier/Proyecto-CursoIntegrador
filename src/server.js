// ============================================================
// server.js — Punto de entrada del servidor
// Importa app de app.js e inicia el listener HTTP + Socket.IO
// ============================================================

const logger = require('./config/logger');

const app = require('./app');

const { initSocket } = require('./config/socket');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  logger.info(`Servidor iniciado en puerto ${PORT}`);
});

initSocket(server);
