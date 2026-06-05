const express = require('express');
const controller = require('../controllers/reporte.controller');
const { authJWT } = require('../middleware/authJWT');

const router = express.Router();

router.get('/', authJWT, controller.listar);
router.post('/', authJWT, controller.crear);

module.exports = router;
