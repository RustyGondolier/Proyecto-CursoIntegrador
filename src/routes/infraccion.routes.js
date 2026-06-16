const express = require('express');
const controller = require('../controllers/infraccion.controller');
const { authJWT } = require('../middleware/authJWT');
const { requireRole } = require('../middleware/roles');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.get(
  '/tipos',
  authJWT,
  requireRole(ROLES.SUPERVISOR, ROLES.ADMINISTRADOR),
  controller.obtenerTipos,
);
router.post('/', authJWT, requireRole(ROLES.SUPERVISOR, ROLES.ADMINISTRADOR), controller.registrar);
router.get('/', authJWT, requireRole(ROLES.SUPERVISOR, ROLES.ADMINISTRADOR), controller.listar);
router.get(
  '/:id',
  authJWT,
  requireRole(ROLES.SUPERVISOR, ROLES.ADMINISTRADOR),
  controller.obtenerPorId,
);

module.exports = router;
