const jwt = require('jsonwebtoken');

function authJWT(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token      = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario   = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido o expirado' });
  }
}

function soloSupervisor(req, res, next) {
  if (req.usuario.rol !== 'supervisor') {
    return res.status(403).json({ error: 'Acceso solo para supervisores' });
  }
  next();
}

module.exports = { authJWT, soloSupervisor };