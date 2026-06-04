const socket = io(window.location.origin, {
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('[WS] WebSocket conectado a', window.location.origin);
});

socket.on('connect_error', (err) => {
  console.warn('[WS] Error de conexión:', err.message);
});

socket.on('ocupacion:updated', () => {
  console.log('[WS] Evento ocupacion:updated recibido');
  if (typeof window.refreshParkingGrid === 'function') {
    window.refreshParkingGrid();
  }
});
