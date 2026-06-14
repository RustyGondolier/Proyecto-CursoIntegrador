const socket = io(window.location.origin, {
  transports: ['websocket', 'polling'],
  withCredentials: true
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

socket.on('plaza:asignada', (data) => {
  console.log('[WS] Plaza asignada:', data);
  if (typeof window.onPlazaAsignada === 'function') {
    window.onPlazaAsignada(data);
  }
});

socket.on('salida:registrada', (data) => {
  console.log('[WS] Salida registrada:', data);
  if (typeof window.onSalidaRegistrada === 'function') {
    window.onSalidaRegistrada(data);
  }
});

socket.on('reporte:actualizado', (data) => {
  console.log('[WS] Reporte actualizado:', data);
  if (typeof window.onReporteActualizado === 'function') {
    window.onReporteActualizado(data);
  }
});
