const express = require('express');
const controller = require('../controllers/administrador.controller');
const { authJWT } = require('../middleware/authJWT');
const { requireRole } = require('../middleware/roles');

const router = express.Router();

router.get('/dashboard', authJWT, requireRole('administrador'), controller.dashboard);
router.get('/usuarios/pendientes', authJWT, requireRole('administrador'), controller.listarPendientes);
router.get('/usuarios', authJWT, requireRole('administrador'), controller.listarUsuarios);
router.get('/usuarios/:id', authJWT, requireRole('administrador'), controller.obtenerUsuario);
router.put('/usuarios/:id/aprobar', authJWT, requireRole('administrador'), controller.aprobarPerfil);
router.put('/usuarios/:id/suspender', authJWT, requireRole('administrador'), controller.suspenderCuenta);
router.put('/usuarios/:id/reactivar', authJWT, requireRole('administrador'), controller.reactivarCuenta);
router.get('/infracciones', authJWT, requireRole('administrador'), controller.listarInfracciones);
router.get('/infracciones/:id', authJWT, requireRole('administrador'), controller.obtenerInfraccion);
router.get('/reportes/prioritarios', authJWT, requireRole('administrador'), controller.listarReportesPrioritarios);
router.put('/reportes/:id/resolver', authJWT, requireRole('administrador'), controller.resolverReporte);
router.get('/acciones', authJWT, requireRole('administrador'), controller.listarAcciones);

module.exports = router;
