const { Router } = require('express');
const router = Router();
const { authJWT } = require('../middleware/authJWT');
const controller = require('../controllers/faq.controller');

router.get('/', authJWT, controller.listar);
router.get('/:id/preguntas', authJWT, controller.preguntas);

module.exports = router;
