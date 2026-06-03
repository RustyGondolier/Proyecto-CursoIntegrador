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

app.use(cors());

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
  '/api/auth',
  require('./routes/auth.routes')
);

app.use(
  '/api/estacionamientos',
  require(
    './routes/estacionamiento.routes'
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

const PORT =
  process.env.PORT || 3000;

app.listen(
  PORT,
  () => {

    console.log(
      `Servidor iniciado en puerto ${PORT}`
    );

  }
);