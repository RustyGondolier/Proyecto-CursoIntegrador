const express = require('express');
const controller = require('../controllers/supervisor.controller');
const { authJWT } = require('../middleware/authJWT');
const { requireRole } = require('../middleware/roles');

const router = express.Router();

router.post('/asignar-plaza', authJWT, requireRole('supervisor', 'administrador'), controller.asignarPlaza);
router.get('/dashboard', authJWT, requireRole('supervisor', 'administrador'), controller.dashboard);
router.get('/buscar', authJWT, requireRole('supervisor', 'administrador'), controller.buscar);
router.get('/solicitud/:id', authJWT, requireRole('supervisor', 'administrador'), controller.buscarSolicitud);
router.get('/plazas-disponibles', authJWT, requireRole('supervisor', 'administrador'), controller.plazasDisponibles);
router.post('/confirmar-ingreso', authJWT, requireRole('supervisor', 'administrador'), controller.confirmarIngreso);

module.exports = router;
