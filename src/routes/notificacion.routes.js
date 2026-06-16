const { Router } = require('express');
const router = Router();
const { authJWT } = require('../middleware/authJWT');
const controller = require('../controllers/notificacion.controller');

router.get('/', authJWT, controller.listar);
router.get('/no-leidas', authJWT, controller.noLeidas);
router.patch('/:id/leer', authJWT, controller.marcarLeida);
router.patch('/leer-todas', authJWT, controller.marcarTodasLeidas);

module.exports = router;
