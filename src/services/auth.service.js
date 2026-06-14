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

  if(usuario.estado_cuenta === 'suspendida'){

    throw new Error(
      'Tu cuenta ha sido suspendida. Revisa tu correo institucional para más información.'
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

const REQUIRED_FIELDS = [
  { key: 'codigo_universitario', label: 'Código universitario' },
  { key: 'nombre', label: 'Nombre' },
  { key: 'password', label: 'Contraseña' },
  { key: 'fecha_nacimiento', label: 'Fecha de nacimiento' },
  { key: 'correo_institucional', label: 'Correo institucional' },
  { key: 'nro_licencia', label: 'Número de licencia' },
  { key: 'licencia_fecha_vencimiento', label: 'Vencimiento de licencia' },
  { key: 'placa', label: 'Placa' },
  { key: 'modelo', label: 'Modelo' },
  { key: 'tipo_vehiculo_id', label: 'Tipo de vehículo' }
];

const PLACA_REGEX = {
  auto: /^[A-Za-z]{3}[-\s]?\d{3}$/,
  moto: /^[A-Za-z]{2}[-\s]?\d{4}$/,
  mototaxi: /^[A-Za-z]{2}[-\s]?\d{4}$/
};

function normalizarPlaca(tipo, placa) {
  const limpia = placa.trim().toUpperCase().replace(/[\s-]/g, '');
  if (tipo === 'auto') {
    return limpia.replace(/^([A-Z]{3})(\d{3})$/, '$1-$2');
  }
  return limpia.replace(/^([A-Z]{2})(\d{4})$/, '$1-$2');
}

async function register(
  body
){

  for (const { key, label } of REQUIRED_FIELDS) {
    if (!body[key] || (typeof body[key] === 'string' && body[key].trim() === '')) {
      throw new Error(`El campo "${label}" es obligatorio`);
    }
  }

  if (body.password.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres');
  }

  if (body.dni !== undefined && body.dni !== null && body.dni !== '') {
    if (!/^\d{8}$/.test(body.dni.trim())) {
      throw new Error('El DNI debe tener 8 dígitos');
    }
  }

  const emailRegex = /^[^\s@]+@utp\.edu\.pe$/i;
  if (!emailRegex.test(body.correo_institucional.trim())) {
    throw new Error('El correo debe ser institucional (@utp.edu.pe)');
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fechaVence = new Date(body.licencia_fecha_vencimiento + 'T00:00:00');
  if (fechaVence < hoy) {
    throw new Error('La licencia está vencida');
  }

  const tipoVehiculo = body.tipo_vehiculo_id;
  const regex = PLACA_REGEX[tipoVehiculo];
  if (!regex) {
    throw new Error('Tipo de vehículo no válido');
  }
  if (!regex.test(body.placa.trim())) {
    const formato = tipoVehiculo === 'auto' ? 'ABC-123' : 'AB-1234';
    throw new Error(`La placa no tiene un formato válido (ej: ${formato})`);
  }

  const placaNormalizada = normalizarPlaca(tipoVehiculo, body.placa);

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

  const correoExiste =
    await usuarioRepository
      .findByEmail(
        body.correo_institucional.trim()
      );

  if (correoExiste) {
    throw new Error('El correo ya está registrado');
  }

  const licenciaExiste =
    await usuarioRepository
      .findByLicense(
        body.nro_licencia.trim()
      );

  if (licenciaExiste) {
    throw new Error('La licencia ya está registrada');
  }

  const vehiculoExiste =
    await vehiculoRepository
      .findByPlaca(
        placaNormalizada
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
          body.nombre.trim(),

        password_hash:
          hash,

        telefono:
          body.telefono || null,

        dni:
          body.dni || null,

        fecha_nacimiento:
          body.fecha_nacimiento,

        correo_institucional:
          body.correo_institucional.trim(),

        nro_licencia:
          body.nro_licencia.trim(),

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
        placaNormalizada,

      modelo:
        body.modelo.trim()

    });

  return {
    mensaje:
      'Usuario registrado'
  };

}

async function obtenerUsuario(id) {
  const usuario = await usuarioRepository.findById(id);
  if (!usuario) throw new Error('Usuario no encontrado');
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    rol: usuario.rol,
    codigo_universitario: usuario.codigo_universitario
  };
}

module.exports = {
  login,
  register,
  obtenerUsuario
};