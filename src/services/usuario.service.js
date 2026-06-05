const bcrypt =
  require('bcryptjs');

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
    if(body.nombre.trim().length < 2){
      const error = new Error('El nombre debe tener al menos 2 caracteres');
      error.status = 400;
      throw error;
    }
    datos.nombre =
      body.nombre.trim();
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
    const emailRegex = /^[^\s@]+@utp\.edu\.pe$/i;
    if(!emailRegex.test(body.correo_institucional.trim())){
      const error = new Error('El correo debe ser institucional (@utp.edu.pe)');
      error.status = 400;
      throw error;
    }
    datos.correo_institucional =
      body.correo_institucional.trim();
  }

  if(
    body.dni !== undefined
  ){
    if(!/^\d{8}$/.test(body.dni.trim())){
      const error = new Error('El DNI debe tener 8 dígitos');
      error.status = 400;
      throw error;
    }
    datos.dni =
      body.dni.trim();
  }

  if(
    body.nro_licencia !== undefined
  ){
    if(body.nro_licencia.trim().length < 3){
      const error = new Error('El número de licencia no es válido');
      error.status = 400;
      throw error;
    }
    datos.nro_licencia =
      body.nro_licencia.trim();
  }

  if(
    body.licencia_fecha_vencimiento !== undefined
  ){
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaVence = new Date(body.licencia_fecha_vencimiento + 'T00:00:00');
    if(fechaVence < hoy){
      const error = new Error('La licencia está vencida');
      error.status = 400;
      throw error;
    }
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

/* =====================================================
   CONTRASEÑA
   ===================================================== */

async function changePassword(
  userId,
  body
){

  const { actual, nueva, confirmar } = body;

  if(!actual || !nueva || !confirmar){
    throw new Error(
      'Todos los campos son requeridos'
    );
  }

  if(nueva !== confirmar){
    throw new Error(
      'La nueva contraseña y la confirmación no coinciden'
    );
  }

  if(nueva.length < 6){
    throw new Error(
      'La nueva contraseña debe tener al menos 6 caracteres'
    );
  }

  const currentHash =
    await usuarioRepository
      .getPasswordHash(userId);

  if(!currentHash){
    throw new Error(
      'Usuario no encontrado'
    );
  }

  const valida =
    await bcrypt.compare(
      actual,
      currentHash
    );

  if(!valida){
    throw new Error(
      'La contraseña actual no es correcta'
    );
  }

  const newHash =
    await bcrypt.hash(nueva, 10);

  await usuarioRepository
    .updatePassword(
      userId,
      newHash
    );

  return {
    mensaje:
      'Contraseña actualizada correctamente'
  };

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
