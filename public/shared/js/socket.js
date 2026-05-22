const socket = io(SOCKET_URL, {
  transports:['websocket']
});

const usuario = JSON.parse(
  sessionStorage.getItem('usuario')
);

if(usuario){

  socket.emit(
    'join:role',
    usuario.rol
  );
}


//			<script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>