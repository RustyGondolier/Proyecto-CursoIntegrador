const express =
  require('express');

const controller =
  require('../controllers/usuario.controller');

const { authJWT } =
  require('../middleware/authJWT');

const router =
  express.Router();

/* PERFIL */

router.get(
  '/me',
  authJWT,
  controller.getProfile
);

router.put(
  '/me',
  authJWT,
  controller.updateProfile
);

/* VEHÍCULOS */

router.get(
  '/me/vehiculos',
  authJWT,
  controller.getVehicles
);

router.post(
  '/me/vehiculos',
  authJWT,
  controller.createVehicle
);

router.put(
  '/me/vehiculos/:id',
  authJWT,
  controller.updateVehicle
);

router.delete(
  '/me/vehiculos/:id',
  authJWT,
  controller.deleteVehicle
);

router.patch(
  '/me/vehiculos/:id/activar',
  authJWT,
  controller.setActiveVehicle
);

/* CONTRASEÑA */

router.put(
  '/me/password',
  authJWT,
  controller.changePassword
);

module.exports =
  router;
