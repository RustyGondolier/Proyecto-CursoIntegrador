const express = require('express');
const controller = require('../controllers/direccion.controller');
const { authJWT } = require('../middleware/authJWT');
const { requireRole } = require('../middleware/roles');

const router = express.Router();

router.get('/dashboard', authJWT, requireRole('direccion', 'administrador'), controller.dashboard);

module.exports = router;
