const express =
  require('express');

const controller =
  require('../controllers/auth.controller');

const { authJWT } =
  require('../middleware/authJWT');

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

/* LOGOUT (sin authJWT) */

router.post(
  '/logout',
  controller.logout
);

/* ME */

router.get(
  '/me',
  authJWT,
  controller.me
);

module.exports =
  router;