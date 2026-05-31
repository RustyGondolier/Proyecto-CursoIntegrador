require('dotenv').config();

const path = require('path');
const http = require('http');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const rateLimit = require('express-rate-limit');

const { Server } = require('socket.io');

/* =====================================================
   APP
===================================================== */

const app = express();

const server = http.createServer(app);

/* =====================================================
   SOCKET.IO
===================================================== */

const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

app.set('io', io);

/* =====================================================
   SEGURIDAD
===================================================== */

app.use(helmet());

app.use(cors());

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true
  })
);

/* =====================================================
   RATE LIMIT
===================================================== */

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false
});

app.use(limiter);

/* =====================================================
   ARCHIVOS PÚBLICOS
===================================================== */

app.use(
  express.static(
    path.join(__dirname, 'public')
  )
);

/* =====================================================
   RUTAS API
===================================================== */

app.use(
  '/api/auth',
  require('./routes/auth')
);

app.use(
  '/api/solicitudes',
  require('./routes/solicitudes')
);

app.use(
  '/api/usuarios',
  require('./routes/usuarios')
);

app.use(
  '/api/infracciones',
  require('./routes/infracciones')
);

app.use(
  '/api/reportes',
  require('./routes/reportes')
);

app.use(
  '/api/notificaciones',
  require('./routes/notificaciones')
);

app.use(
  '/api/soporte',
  require('./routes/soporte')
);

app.use(
  '/api/faq',
  require('./routes/faq')
);

app.use(
  '/api/analytics',
  require('./routes/analytics')
);

/* =====================================================
   HEALTH CHECK
===================================================== */

app.get(
  '/api/health',
  (req, res) => {

    res.json({
      status: 'ok',
      timestamp: new Date()
    });

  }
);

/* =====================================================
   SOCKETS
===================================================== */

io.on(
  'connection',
  socket => {

    console.log(
      'Cliente conectado:',
      socket.id
    );

    socket.on(
      'disconnect',
      () => {

        console.log(
          'Cliente desconectado:',
          socket.id
        );

      }
    );

  }
);

/* =====================================================
   404 API
===================================================== */

app.use(
  '/api/*splat',
  (req, res) => {

    res.status(404).json({
      error: 'Endpoint no encontrado'
    });

  }
);

/* =====================================================
   ERROR GLOBAL
===================================================== */

app.use(
  (err, req, res, next) => {

    console.error(err);

    res.status(500).json({
      error: 'Error interno del servidor'
    });

  }
);

/* =====================================================
   START SERVER
===================================================== */

const PORT =
  process.env.PORT || 3000;

server.listen(
  PORT,
  () => {

    console.log(`
===================================
 UTP PARKING API
 Puerto: ${PORT}
===================================
`);

  }
);