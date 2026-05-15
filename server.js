require('dotenv').config();
const express    = require('express');
const http       = require('http');
const cors       = require('cors');
const path       = require('path');
const { Server } = require('socket.io');

const authRoutes     = require('./routes/auth');
const plazasRoutes   = require('./routes/plazas');
const reservasRoutes = require('./routes/reservas');
const initSockets    = require('./sockets');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth',     authRoutes);
app.use('/api/plazas',   plazasRoutes);
app.use('/api/reservas', reservasRoutes);

initSockets(io);

app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});