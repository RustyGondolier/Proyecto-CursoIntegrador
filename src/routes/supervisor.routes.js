const express = require('express');
const controller = require('../controllers/supervisor.controller');
const { authJWT } = require('../middleware/authJWT');
const { requireRole } = require('../middleware/roles');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.post('/asignar-plaza', authJWT, requireRole(ROLES.SUPERVISOR, ROLES.ADMINISTRADOR), controller.asignarPlaza);
router.get('/dashboard', authJWT, requireRole(ROLES.SUPERVISOR, ROLES.ADMINISTRADOR), controller.dashboard);
router.get('/buscar', authJWT, requireRole(ROLES.SUPERVISOR, ROLES.ADMINISTRADOR), controller.buscar);
router.get('/solicitud/:id', authJWT, requireRole(ROLES.SUPERVISOR, ROLES.ADMINISTRADOR), controller.buscarSolicitud);
router.get('/plazas-disponibles', authJWT, requireRole(ROLES.SUPERVISOR, ROLES.ADMINISTRADOR), controller.plazasDisponibles);
router.post('/confirmar-ingreso', authJWT, requireRole(ROLES.SUPERVISOR, ROLES.ADMINISTRADOR), controller.confirmarIngreso);
router.post('/registrar-salida', authJWT, requireRole(ROLES.SUPERVISOR, ROLES.ADMINISTRADOR), controller.registrarSalida);
router.get('/buscar-identificador', authJWT, requireRole(ROLES.SUPERVISOR, ROLES.ADMINISTRADOR), controller.buscarIdentificador);

module.exports = router;
