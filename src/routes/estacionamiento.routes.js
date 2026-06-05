const express =
  require('express');

const controller =
  require(
    '../controllers/estacionamiento.controller'
  );

const {
  authJWT
} = require(
  '../middleware/authJWT'
);

const router =
  express.Router();

router.get(
  '/',
  authJWT,
  controller.listar
);

router.get(
  '/ocupacion',
  authJWT,
  controller.ocupacion
);

module.exports =
  router;