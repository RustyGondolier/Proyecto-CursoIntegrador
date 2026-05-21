const helmet = require('helmet');

require('dotenv').config();
const express    = require('express');
const http       = require('http');
const cors       = require('cors');
const path       = require('path');

const rateLimit = require('express-rate-limit');

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

if(process.env.NODE_ENV === 'production'){
  app.set('trust proxy', 1);
}

const allowedOrigins = [

  'http://localhost:3000',
  'http://127.0.0.1:5500',

  'https://utp-parking.onrender.com'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Permitir peticiones sin origen (como apps móviles, Postman o el propio servidor)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por la política de CORS'));
    }
  },
  credentials: true
};

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});

app.set('io', io);

app.use(cors(corsOptions));
app.use(helmet());

app.use(express.json());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: {
    error: 'Demasiados intentos, intenta nuevamente más tarde.'
  }
});

app.use('/api/auth',      authLimiter, authRoutes);
app.use('/api/plazas',    plazasRoutes);
app.use('/api/reservas',  reservasRoutes);
app.use('/api/qr',        qrRoutes);

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

app.use((err, req, res, next) => {
  if (err.message === 'No permitido por la política de CORS') {
    res.status(403).json({ error: err.message });
  } else {
    next(err);
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});