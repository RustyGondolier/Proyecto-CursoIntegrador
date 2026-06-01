let socket = null;

function connectSocket(){

  if(socket){
    return socket;
  }

  socket = io();

  socket.on(
    'connect',
    () => {

      console.log(
        'Socket conectado'
      );

    }
  );

  socket.on(
    'disconnect',
    () => {

      console.log(
        'Socket desconectado'
      );

    }
  );

  return socket;

}

function getSocket(){

  return socket;

}