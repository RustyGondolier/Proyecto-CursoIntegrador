require('dotenv').config();
const express    = require('express');
const http       = require('http');
const cors       = require('cors');
const path       = require('path');
const { Server } = require('socket.io');

const authRoutes     = require('./routes/auth');
const plazasRoutes   = require('./routes/plazas');
const reservasRoutes = require('./routes/reservas');
const qrRoutes       = require('./routes/qr');
const initSockets    = require('./sockets');

const usuariosRoutes      = require('./routes/usuarios');
const infraccionesRoutes  = require('./routes/infracciones');
const reportesRoutes      = require('./routes/reportes');
const notificacionesRoutes = require('./routes/notificaciones');

const analyticsRoutes  = require('./routes/analytics');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: '*' }
});

app.set('io', io);

app.use(cors());
app.use(express.json());

app.use('/api/auth',     authRoutes);
app.use('/api/plazas',   plazasRoutes);
app.use('/api/reservas', reservasRoutes);
app.use('/api/qr',       qrRoutes);

app.use('/api/usuarios',       usuariosRoutes);
app.use('/api/infracciones',   infraccionesRoutes);
app.use('/api/reportes',       reportesRoutes);
app.use('/api/notificaciones', notificacionesRoutes);

app.use('/api/analytics', analyticsRoutes);

app.use(express.static(path.join(__dirname, 'public')));

initSockets(io);

app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});