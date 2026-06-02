const jwt = require('jsonwebtoken');

function generateToken(usuario){

  return jwt.sign(
    {
      id: usuario.id,
      rol: usuario.rol,
      codigo_universitario:
        usuario.codigo_universitario
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '8h'
    }
  );

}

module.exports = {
  generateToken
};