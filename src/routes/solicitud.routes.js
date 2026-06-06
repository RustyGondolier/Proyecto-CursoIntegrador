const express = require('express');
const controller = require('../controllers/solicitud.controller');
const { authJWT } = require('../middleware/authJWT');

const router = express.Router();

router.post('/crear', authJWT, controller.crear);
router.get('/activa', authJWT, controller.activa);
router.post('/cancelar', authJWT, controller.cancelar);
router.get('/historial', authJWT, controller.getHistorial);

module.exports = router;
