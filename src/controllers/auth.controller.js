const authService = require('../services/auth.service');

/* LOGIN */

async function login(req, res) {
  try {
    const { codigo_universitario, password } = req.body;

    const data = await authService.login(
      codigo_universitario,
      password,
      req.ip,
      req.headers['user-agent'],
    );

    res.cookie('token', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000,
    });

    res.json({ usuario: data.usuario });
  } catch (err) {
    res.status(401).json({
      error: err.message,
    });
  }
}

/* REGISTER */

async function register(req, res) {
  try {
    const data = await authService.register(req.body);

    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({
      error: err.message,
    });
  }
}

/* LOGOUT */

async function logout(req, res) {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  res.json({ mensaje: 'Sesión cerrada' });
}

/* ME */

async function me(req, res) {
  const usuario = await authService.obtenerUsuario(req.usuario.id);
  res.json({ usuario });
}

module.exports = {
  login,
  register,
  logout,
  me,
};
