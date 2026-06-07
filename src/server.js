require('dotenv').config();

const express =
  require('express');

const cors =
  require('cors');

const helmet =
  require('helmet');

const path =
  require('path');

const app =
  express();

app.use(helmet());

app.use(cors({
  origin: process.env.FRONTEND_URL || '*'
}));

app.use(express.json());

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

const { initSocket } =
  require('./config/socket');

const PORT =
  process.env.PORT || 3000;

const server =
  app.listen(
    PORT,
    () => {

      console.log(
        `Servidor iniciado en puerto ${PORT}`
      );

    }
  );

initSocket(server);