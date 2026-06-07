const express = require('express');
const controller = require('../controllers/infraccion.controller');
const { authJWT } = require('../middleware/authJWT');
const { requireRole } = require('../middleware/roles');

const router = express.Router();

router.get('/tipos', authJWT, requireRole('supervisor', 'administrador'), controller.obtenerTipos);
router.post('/', authJWT, requireRole('supervisor', 'administrador'), controller.registrar);
router.get('/', authJWT, requireRole('supervisor', 'administrador'), controller.listar);
router.get('/:id', authJWT, requireRole('supervisor', 'administrador'), controller.obtenerPorId);

module.exports = router;
