const express = require('express');
const controller = require('../controllers/administrador.controller');
const { authJWT } = require('../middleware/authJWT');
const { requireRole } = require('../middleware/roles');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.get('/dashboard', authJWT, requireRole(ROLES.ADMINISTRADOR), controller.dashboard);
router.get('/usuarios/pendientes', authJWT, requireRole(ROLES.ADMINISTRADOR), controller.listarPendientes);
router.get('/usuarios', authJWT, requireRole(ROLES.ADMINISTRADOR), controller.listarUsuarios);
router.get('/usuarios/:id', authJWT, requireRole(ROLES.ADMINISTRADOR), controller.obtenerUsuario);
router.put('/usuarios/:id/aprobar', authJWT, requireRole(ROLES.ADMINISTRADOR), controller.aprobarPerfil);
router.put('/usuarios/:id/suspender', authJWT, requireRole(ROLES.ADMINISTRADOR), controller.suspenderCuenta);
router.put('/usuarios/:id/reactivar', authJWT, requireRole(ROLES.ADMINISTRADOR), controller.reactivarCuenta);
router.get('/infracciones', authJWT, requireRole(ROLES.ADMINISTRADOR), controller.listarInfracciones);
router.get('/infracciones/:id', authJWT, requireRole(ROLES.ADMINISTRADOR), controller.obtenerInfraccion);
router.get('/reportes/prioritarios', authJWT, requireRole(ROLES.ADMINISTRADOR), controller.listarReportesPrioritarios);
router.put('/reportes/:id/resolver', authJWT, requireRole(ROLES.ADMINISTRADOR), controller.resolverReporte);
router.get('/acciones', authJWT, requireRole(ROLES.ADMINISTRADOR), controller.listarAcciones);

module.exports = router;
