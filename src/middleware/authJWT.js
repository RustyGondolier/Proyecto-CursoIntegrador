const jwt = require('jsonwebtoken');

function authJWT(
  req,
  res,
  next
){

  const token =
    req.cookies?.token || req.headers.authorization?.split(' ')[1];

  if(!token){

    return res.status(401).json({
      error:'Token requerido'
    });

  }

  try{

    const decoded =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      );

    req.usuario =
      decoded;

    next();

  }catch(err){

    return res.status(403).json({
      error:'Token inválido'
    });

  }

}

module.exports = {
  authJWT
};