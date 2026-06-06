let io = null;

function initSocket(server){

  const { Server } = require('socket.io');

  io = new Server(server,{
    cors:{
      origin:'*'
    }
  });

  io.on(
    'connection',
    socket => {

      console.log(
        'Socket conectado:',
        socket.id
      );

      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (token) {
        try {
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          socket.join(`user:${decoded.id}`);
          console.log(`Socket ${socket.id} unido a sala user:${decoded.id}`);
        } catch (_) {}
      }

      socket.on(
        'disconnect',
        () => {
          console.log(
            'Socket desconectado:',
            socket.id
          );
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