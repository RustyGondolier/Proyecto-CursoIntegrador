const jwt = require('jsonwebtoken');

/* =========================
   VALIDAR TOKEN
========================= */

function authJWT(req, res, next) {

  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Token requerido'
    });
  }

  try {

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.usuario = decoded;

    next();

  } catch (err) {

    return res.status(403).json({
      error: 'Token inválido o expirado'
    });

  }

}

/* =========================
   SUPERVISOR
========================= */

function soloSupervisor(req, res, next) {

  if (req.usuario.rol !== 'supervisor') {
    return res.status(403).json({
      error: 'Acceso solo para supervisores'
    });
  }

  next();

}

/* =========================
   ADMINISTRADOR
========================= */

function soloAdministrador(req, res, next) {

  if (req.usuario.rol !== 'administrador') {
    return res.status(403).json({
      error: 'Acceso solo para administradores'
    });
  }

  next();

}

/* =========================
   DIRECCIÓN
========================= */

function soloDireccion(req, res, next) {

  if (req.usuario.rol !== 'direccion') {
    return res.status(403).json({
      error: 'Acceso solo para dirección'
    });
  }

  next();

}

/* =========================
   SUPERVISOR O DIRECCIÓN
========================= */

function supervisorODireccion(req, res, next) {

  if (
    ![
      'supervisor',
      'direccion'
    ].includes(req.usuario.rol)
  ) {
    return res.status(403).json({
      error: 'Acceso restringido'
    });
  }

  next();

}

/* =========================
   ROLES DE GESTIÓN
========================= */

function rolesGestion(req, res, next) {

  if (
    ![
      'supervisor',
      'administrador',
      'direccion'
    ].includes(req.usuario.rol)
  ) {
    return res.status(403).json({
      error: 'Acceso restringido'
    });
  }

  next();

}

/* =========================
   EXPORTS
========================= */

module.exports = {
  authJWT,
  soloSupervisor,
  soloAdministrador,
  soloDireccion,
  supervisorODireccion,
  rolesGestion
};