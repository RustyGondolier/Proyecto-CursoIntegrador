const usuarioService =
  require('../services/usuario.service');

/* =====================================================
   PERFIL
   ===================================================== */

async function getProfile(
  req,
  res
){

  try{

    const perfil =
      await usuarioService
        .getProfile(
          req.usuario.id
        );

    res.json(perfil);

  }catch(err){

    res.status(404).json({
      error: err.message
    });

  }

}

async function updateProfile(
  req,
  res
){

  try{

    const perfil =
      await usuarioService
        .updateProfile(
          req.usuario.id,
          req.body
        );

    res.json(perfil);

  }catch(err){

    res.status(400).json({
      error: err.message
    });

  }

}

/* =====================================================
   VEHÍCULOS
   ===================================================== */

async function getVehicles(
  req,
  res
){

  try{

    const vehiculos =
      await usuarioService
        .getVehicles(
          req.usuario.id
        );

    res.json(vehiculos);

  }catch(err){

    res.status(400).json({
      error: err.message
    });

  }

}

async function createVehicle(
  req,
  res
){

  try{

    const vehiculos =
      await usuarioService
        .createVehicle(
          req.usuario.id,
          req.body
        );

    res.status(201)
      .json(vehiculos);

  }catch(err){

    res.status(400).json({
      error: err.message
    });

  }

}

async function updateVehicle(
  req,
  res
){

  try{

    const vehiculos =
      await usuarioService
        .updateVehicle(
          req.usuario.id,
          req.params.id,
          req.body
        );

    res.json(vehiculos);

  }catch(err){

    res.status(400).json({
      error: err.message
    });

  }

}

async function deleteVehicle(
  req,
  res
){

  try{

    const vehiculos =
      await usuarioService
        .deleteVehicle(
          req.usuario.id,
          req.params.id
        );

    res.json(vehiculos);

  }catch(err){

    res.status(400).json({
      error: err.message
    });

  }

}

async function setActiveVehicle(
  req,
  res
){

  try{

    const vehiculos =
      await usuarioService
        .setActiveVehicle(
          req.usuario.id,
          req.params.id
        );

    res.json(vehiculos);

  }catch(err){

    res.status(400).json({
      error: err.message
    });

  }

}

async function changePassword(
  req,
  res
){

  try{

    const data =
      await usuarioService
        .changePassword(
          req.usuario.id,
          req.body
        );

    res.json(data);

  }catch(err){

    res.status(400).json({
      error: err.message
    });

  }

}

module.exports = {
  getProfile,
  updateProfile,
  getVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  setActiveVehicle,
  changePassword
};
