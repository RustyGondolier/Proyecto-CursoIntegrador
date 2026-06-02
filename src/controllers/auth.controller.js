const authService =
  require('../services/auth.service');

/* LOGIN */

async function login(
  req,
  res
){

  try{

    const {
      codigo_universitario,
      password
    } = req.body;

    const data =
      await authService.login(
        codigo_universitario,
        password,
        req.ip,
        req.headers['user-agent']
      );

    res.json(data);

  }catch(err){

    res.status(401).json({
      error: err.message
    });

  }

}

/* REGISTER */

async function register(
  req,
  res
){

  try{

    const data =
      await authService.register(
        req.body
      );

    res.status(201).json(
      data
    );

  }catch(err){

    res.status(400).json({
      error: err.message
    });

  }

}

module.exports = {
  login,
  register
};