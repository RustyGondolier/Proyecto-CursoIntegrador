const bcrypt =
  require('bcryptjs');

const usuarioRepository =
  require('../repositories/usuario.repository');

const vehiculoRepository =
  require('../repositories/vehiculo.repository');

  const historialRepository =
  require(
    '../repositories/historial.repository'
  );

const {
  generateToken
} = require('../utils/jwt');

/* Login */

async function login(
  codigo,
  password,
  ip,
  userAgent
){

  const usuario =
    await usuarioRepository.findByCodigo(
      codigo
        .trim()
        .toUpperCase()
    );

  if(!usuario){

    throw new Error(
      'Credenciales incorrectas'
    );

  }

  const valido =
    await bcrypt.compare(
      password,
      usuario.password_hash
    );

  if(!valido){

    await historialRepository
      .registrarAcceso(
        usuario.id,
        'fallido',
        ip,
        userAgent
      );

    throw new Error(
      'Credenciales incorrectas'
    );

  }

  const token =
    generateToken(usuario);

    await historialRepository
  .registrarAcceso(
    usuario.id,
    'exitoso',
    ip,
    userAgent
  );

  return {

    token,

    usuario:{
      id: usuario.id,
      nombre: usuario.nombre,
      rol: usuario.rol,
      codigo_universitario:
        usuario.codigo_universitario
    }

  };

}

/* Register */

async function register(
  body
){

  const codigo =
    body.codigo_universitario
      .trim()
      .toUpperCase();

  let rol =
    'estudiante';

  if(
    codigo.startsWith('C')
  ){

    rol =
      'docente';

  }

  const usuarioExiste =
    await usuarioRepository
      .findByCodigo(
        codigo
      );

  if(usuarioExiste){

    throw new Error(
      'El usuario ya existe'
    );

  }

  const vehiculoExiste =
    await vehiculoRepository
      .findByPlaca(
        body.placa
          .toUpperCase()
      );

  if(vehiculoExiste){

    throw new Error(
      'La placa ya existe'
    );

  }

  const hash =
    await bcrypt.hash(
      body.password,
      10
    );

  const usuario =
    await usuarioRepository
      .create({

        codigo_universitario:
          codigo,

        nombre:
          body.nombre,

        password_hash:
          hash,

        telefono:
          body.telefono || null,

        dni:
          body.dni || null,

        fecha_nacimiento:
          body.fecha_nacimiento,

        correo_institucional:
          body.correo_institucional,

        nro_licencia:
          body.nro_licencia,

        licencia_fecha_vencimiento:
          body.licencia_fecha_vencimiento,

        codigo_conadis:
          body.codigo_conadis || null,

        rol

      });

  await vehiculoRepository
    .createVehicle({

      usuario_id:
        usuario.id,

      tipo_vehiculo_id:
        body.tipo_vehiculo_id,

      placa:
        body.placa
          .toUpperCase(),

      modelo:
        body.modelo

    });

  return {
    mensaje:
      'Usuario registrado'
  };

}

module.exports = {
  login,
  register
};