const usuarioRepository =
  require('../repositories/usuario.repository');

const vehiculoRepository =
  require('../repositories/vehiculo.repository');

/* =====================================================
   PERFIL
   ===================================================== */

async function getProfile(
  userId
){

  const perfil =
    await usuarioRepository
      .getProfileWithVehicles(
        userId
      );

  if(!perfil){
    throw new Error(
      'Usuario no encontrado'
    );
  }

  // Remover datos sensibles
  delete perfil.password_hash;

  return perfil;

}

async function updateProfile(
  userId,
  body
){

  const datos = {};

  if(
    body.nombre !== undefined
  ){
    datos.nombre =
      body.nombre;
  }

  if(
    body.telefono !== undefined
  ){
    datos.telefono =
      body.telefono;
  }

  if(
    body.correo_institucional !== undefined
  ){
    datos.correo_institucional =
      body.correo_institucional;
  }

  if(
    body.dni !== undefined
  ){
    datos.dni =
      body.dni;
  }

  if(
    body.nro_licencia !== undefined
  ){
    datos.nro_licencia =
      body.nro_licencia;
  }

  if(
    body.licencia_fecha_vencimiento !== undefined
  ){
    datos.licencia_fecha_vencimiento =
      body.licencia_fecha_vencimiento;
  }

  await usuarioRepository
    .updateProfile(
      userId,
      datos
    );

  return getProfile(userId);

}

/* =====================================================
   VEHÍCULOS
   ===================================================== */

async function getVehicles(
  userId
){

  return vehiculoRepository
    .getUserVehicles(userId);

}

async function createVehicle(
  userId,
  body
){

  const existente =
    await vehiculoRepository
      .existsByPlate(
        body.placa.toUpperCase()
      );

  if(existente){
    throw new Error(
      'La placa ya está registrada'
    );
  }

  const vehiculo =
    await vehiculoRepository
      .createVehicle({

        usuario_id: userId,

        tipo_vehiculo_id:
          body.tipo_vehiculo_id,

        placa:
          body.placa.toUpperCase(),

        modelo:
          body.modelo

      });

  // Primer vehículo → activo automático
  const total =
    await vehiculoRepository
      .getUserVehicles(userId);

  if(total.length === 1){

    await vehiculoRepository
      .setActive(vehiculo.id);

  }

  return getVehicles(userId);

}

async function updateVehicle(
  userId,
  vehicleId,
  body
){

  const vehiculos =
    await vehiculoRepository
      .getUserVehicles(userId);

  const pertenece =
    vehiculos.some(
      v => String(v.id) === String(vehicleId)
    );

  if(!pertenece){

    throw new Error(
      'El vehículo no pertenece al usuario'
    );

  }

  await vehiculoRepository
    .updateVehicle(
      vehicleId,
      {

        placa:
          body.placa?.toUpperCase(),

        modelo:
          body.modelo,

        tipo_vehiculo_id:
          body.tipo_vehiculo_id

      }
    );

  return getVehicles(userId);

}

async function deleteVehicle(
  userId,
  vehicleId
){

  const vehiculos =
    await vehiculoRepository
      .getUserVehicles(userId);

  const pertenece =
    vehiculos.some(
      v => String(v.id) === String(vehicleId)
    );

  if(!pertenece){

    throw new Error(
      'El vehículo no pertenece al usuario'
    );

  }

  await vehiculoRepository
    .deleteVehicle(vehicleId);

  return getVehicles(userId);

}

async function setActiveVehicle(
  userId,
  vehicleId
){

  const vehiculos =
    await vehiculoRepository
      .getUserVehicles(userId);

  const pertenece =
    vehiculos.some(
      v => String(v.id) === String(vehicleId)
    );

  if(!pertenece){

    throw new Error(
      'El vehículo no pertenece al usuario'
    );

  }

  await vehiculoRepository
    .deactivateAll(userId);

  await vehiculoRepository
    .setActive(vehicleId);

  return getVehicles(userId);

}

module.exports = {
  getProfile,
  updateProfile,
  getVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  setActiveVehicle
};
