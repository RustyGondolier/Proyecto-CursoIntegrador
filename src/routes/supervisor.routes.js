const express = require('express');
const controller = require('../controllers/supervisor.controller');
const { authJWT } = require('../middleware/authJWT');
const { requireRole } = require('../middleware/roles');

const router = express.Router();

router.post('/asignar-plaza', authJWT, requireRole('supervisor', 'administrador'), controller.asignarPlaza);
router.get('/dashboard', authJWT, requireRole('supervisor', 'administrador'), controller.dashboard);

module.exports = router;
