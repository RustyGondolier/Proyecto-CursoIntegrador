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

// Solo supervisor (gestión operativa)
function soloSupervisor(req, res, next) {
  if (req.usuario.rol !== 'supervisor') {
    return res.status(403).json({ error: 'Acceso solo para supervisores' });
  }
  next();
}

// Supervisor o directora (gestión + analytics)
function supervisorODirectora(req, res, next) {
  if (!['supervisor','directora'].includes(req.usuario.rol)) {
    return res.status(403).json({ error: 'Acceso restringido' });
  }
  next();
}

// Roles con privilegios (supervisor, directora, administrativo)
function rolesPrivilegiados(req, res, next) {
  if (!['supervisor','directora','administrativo'].includes(req.usuario.rol)) {
    return res.status(403).json({ error: 'Acceso restringido' });
  }
  next();
}

module.exports = { authJWT, soloSupervisor, supervisorODirectora, rolesPrivilegiados };