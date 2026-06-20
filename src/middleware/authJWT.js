const jwt = require('jsonwebtoken');

function authJWT(req, res, next) {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Su sesión ha expirado. Debe iniciar sesión nuevamente.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.usuario = decoded;

    next();
  } catch (err) {
    return res.status(403).json({
      error: 'Su sesión ha expirado. Debe iniciar sesión nuevamente.',
    });
  }
}

module.exports = {
  authJWT,
};
