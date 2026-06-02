const express =
  require('express');

const controller =
  require('../controllers/auth.controller');

const router =
  express.Router();

/* LOGIN */

router.post(
  '/login',
  controller.login
);

/* REGISTER */

router.post(
  '/register',
  controller.register
);

module.exports =
  router;