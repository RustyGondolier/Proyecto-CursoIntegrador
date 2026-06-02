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