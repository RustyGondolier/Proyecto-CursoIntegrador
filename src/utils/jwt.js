const jwt = require('jsonwebtoken');

const { DURACION_SESION } = require('../config/constants');

function generateToken(usuario) {
  return jwt.sign(
    {
      id: usuario.id,
      rol: usuario.rol,
      codigo_universitario: usuario.codigo_universitario,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: DURACION_SESION[usuario.rol] || '8h',
    },
  );
}

module.exports = {
  generateToken,
};
