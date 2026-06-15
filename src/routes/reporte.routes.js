const express = require('express');
const controller = require('../controllers/reporte.controller');
const { authJWT } = require('../middleware/authJWT');
const { requireRole } = require('../middleware/roles');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.get('/', authJWT, controller.listar);
router.get('/todos', authJWT, requireRole(ROLES.SUPERVISOR, ROLES.ADMINISTRADOR), controller.listarTodos);
router.put('/:id/en-revision', authJWT, requireRole(ROLES.SUPERVISOR, ROLES.ADMINISTRADOR), controller.marcarEnRevision);
router.get('/:id', authJWT, requireRole(ROLES.SUPERVISOR, ROLES.ADMINISTRADOR), controller.obtener);
router.post('/', authJWT, controller.crear);
router.put('/:id/responder', authJWT, requireRole(ROLES.SUPERVISOR, ROLES.ADMINISTRADOR), controller.responder);
router.put('/:id/prioritario', authJWT, requireRole(ROLES.SUPERVISOR, ROLES.ADMINISTRADOR), controller.marcarPrioritario);

module.exports = router;
