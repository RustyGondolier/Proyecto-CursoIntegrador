require('dotenv').config();

const logger =
  require('./config/logger');

const express =
  require('express');

const cors =
  require('cors');

const helmet =
  require('helmet');

const rateLimit =
  require('express-rate-limit');

const path =
  require('path');

const cookieParser =
  require('cookie-parser');

const app =
  express();

app.use(helmet());

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

app.use(cookieParser());

const windowMs =
  (parseInt(process.env.RATE_LIMIT_WINDOW_MIN) || 15) * 60 * 1000;

const limiterGlobal = rateLimit({
  windowMs,
  max: parseInt(process.env.RATE_LIMIT_GLOBAL_MAX) || 200,
  standardHeaders: true,
  message: { error: 'Demasiadas peticiones. Intenta de nuevo más tarde.' }
});

const limiterLogin = rateLimit({
  windowMs,
  max: parseInt(process.env.RATE_LIMIT_LOGIN_MAX) || 10,
  standardHeaders: true,
  message: { error: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos.' }
});

app.use(limiterGlobal);
app.use('/api/auth/login', limiterLogin);

app.use(
  express.static(
    path.join(
      __dirname,
      '../public'
    )
  )
);

app.use(
  '/socket.io',
  express.static(
    path.join(
      __dirname,
      '../node_modules/socket.io/client-dist'
    )
  )
);

app.use(
  '/chartjs',
  express.static(
    path.join(
      __dirname,
      '../node_modules/chart.js/dist'
    )
  )
);

app.use(
  '/api/auth',
  require('./routes/auth.routes')
);

app.use(
  '/api/estacionamientos',
  require(
    './routes/estacionamiento.routes'
  )
);

app.use(
  '/api/solicitudes',
  require(
    './routes/solicitud.routes'
  )
);

app.use(
  '/api/usuarios',
  require(
    './routes/usuario.routes'
  )
);

app.use(
  '/api/reportes',
  require(
    './routes/reporte.routes'
  )
);

app.use(
  '/api/supervisor',
  require(
    './routes/supervisor.routes'
  )
);

app.use(
  '/api/infracciones',
  require(
    './routes/infraccion.routes'
  )
);

app.use(
  '/api/administrador',
  require(
    './routes/administrador.routes'
  )
);

app.use(
  '/api/direccion',
  require(
    './routes/direccion.routes'
  )
);

app.use(
  '/api/notificaciones',
  require(
    './routes/notificacion.routes'
  )
);

app.use(
  '/api/faq',
  require(
    './routes/faq.routes'
  )
);

/* LANDING PAGE */

app.get(
  '/',
  (
    req,
    res
  ) => {

    res.sendFile(
      path.join(
        __dirname,
        '../public/index.html'
      )
    );

  }
);

/* HEALTH */

app.get(
  '/api/health',
  (
    req,
    res
  ) => {

    res.json({
      status:'ok'
    });

  }
);

/* ERROR HANDLER */

const errorHandler =
  require('./middleware/errorHandler');

app.use(errorHandler);

const { initSocket } =
  require('./config/socket');

const PORT =
  process.env.PORT || 3000;

const server =
  app.listen(
    PORT,
    () => {

      logger.info(
        `Servidor iniciado en puerto ${PORT}`
      );

    }
  );

initSocket(server);