const express = require('express');
const controller = require('../controllers/reporte.controller');
const { authJWT } = require('../middleware/authJWT');
const { requireRole } = require('../middleware/roles');

const router = express.Router();

router.get('/', authJWT, controller.listar);
router.get('/todos', authJWT, requireRole('supervisor', 'administrador'), controller.listarTodos);
router.put('/:id/en-revision', authJWT, requireRole('supervisor', 'administrador'), controller.marcarEnRevision);
router.get('/:id', authJWT, requireRole('supervisor', 'administrador'), controller.obtener);
router.post('/', authJWT, controller.crear);
router.put('/:id/responder', authJWT, requireRole('supervisor', 'administrador'), controller.responder);
router.put('/:id/prioritario', authJWT, requireRole('supervisor', 'administrador'), controller.marcarPrioritario);

module.exports = router;
