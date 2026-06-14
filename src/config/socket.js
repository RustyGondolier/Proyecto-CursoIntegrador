const logger = require('./logger');
const cookie = require('cookie');

let io = null;

function initSocket(server){

  const { Server } = require('socket.io');

  io = new Server(server,{
    cors:{
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true
    }
  });

  io.on(
    'connection',
    socket => {

      logger.info('Socket conectado: ' + socket.id);

      const cookies = cookie.parse(socket.handshake.headers.cookie || '');
      const token = cookies?.token || socket.handshake.auth?.token || socket.handshake.query?.token;
      if (token) {
        try {
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          socket.join(`user:${decoded.id}`);
          logger.info('Socket ' + socket.id + ' unido a sala user:' + decoded.id);
        } catch (err) {
          logger.warn('Error al autenticar socket por JWT', { error: err.message, socketId: socket.id });
        }
      }

      socket.on(
        'disconnect',
        () => {
          logger.info('Socket desconectado: ' + socket.id);
        }
      );

    }
  );

  return io;
}

function getIO(){

  if(!io){
    throw new Error(
      'Socket.io no inicializado'
    );
  }

  return io;
}

module.exports = {
  initSocket,
  getIO
};