const express = require('express');
const controller = require('../controllers/direccion.controller');
const { authJWT } = require('../middleware/authJWT');
const { requireRole } = require('../middleware/roles');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.get(
  '/dashboard',
  authJWT,
  requireRole(ROLES.DIRECCION, ROLES.ADMINISTRADOR),
  controller.dashboard,
);
router.get(
  '/exportar',
  authJWT,
  requireRole(ROLES.DIRECCION, ROLES.ADMINISTRADOR),
  controller.exportarDashboard,
);

module.exports = router;
