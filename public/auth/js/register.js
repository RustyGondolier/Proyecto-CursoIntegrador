const form =
  document.getElementById(
    'registerForm'
  );

const mensaje =
  document.getElementById(
    'mensaje'
  );

const togglePassword =
  document.getElementById(
    'togglePassword'
  );

const passwordInput =
  document.getElementById(
    'password'
  );

togglePassword.addEventListener(
  'click',
  () => {

    passwordInput.type =
      passwordInput.type === 'password'
        ? 'text'
        : 'password';

  }
);

const PLACA_REGEX = {
  auto: /^[A-Za-z]{3}[-\s]?\d{3}$/,
  moto: /^[A-Za-z]{2}[-\s]?\d{4}$/,
  mototaxi: /^[A-Za-z]{2}[-\s]?\d{4}$/
};

form.addEventListener(
  'submit',
  async e => {

    e.preventDefault();

    mensaje.textContent = '';
    mensaje.className = 'mensaje';

    const codigo =
      document.getElementById('codigo').value;

    const nombre =
      document.getElementById('nombre').value;

    const password =
      document.getElementById('password').value;

    const fechaNacimiento =
      document.getElementById('fechaNacimiento').value;

    const correo =
      document.getElementById('correo').value;

    const telefono =
      document.getElementById('telefono').value;

    const dni =
      document.getElementById('dni').value;

    const conadis =
      document.getElementById('conadis').value;

    const licencia =
      document.getElementById('licencia').value;

    const licenciaVence =
      document.getElementById('licenciaVence').value;

    const placa =
      document.getElementById('placa').value;

    const modelo =
      document.getElementById('modelo').value;

    const tipoVehiculo =
      document.getElementById('tipoVehiculo').value;

    if (password.length < 6) {
      mensaje.textContent = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }

    const emailRegex = /^[^\s@]+@utp\.edu\.pe$/i;
    if (!emailRegex.test(correo.trim())) {
      mensaje.textContent = 'El correo debe ser institucional (@utp.edu.pe)';
      return;
    }

    const regex = PLACA_REGEX[tipoVehiculo];
    if (!regex.test(placa.trim())) {
      const formato = tipoVehiculo === 'auto' ? 'ABC-123' : 'AB-1234';
      mensaje.textContent = `La placa no tiene un formato válido (ej: ${formato})`;
      return;
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaVence = new Date(licenciaVence + 'T00:00:00');
    if (fechaVence < hoy) {
      const continuar = confirm('La licencia está vencida. ¿Deseas continuar con el registro de todas formas?');
      if (!continuar) return;
    }

    try {

      const response =
        await fetch(
          '/api/auth/register',
          {
            method:'POST',

            headers:{
              'Content-Type':
                'application/json'
            },

            body: JSON.stringify({
              codigo_universitario: codigo,
              nombre,
              password,
              fecha_nacimiento: fechaNacimiento,
              correo_institucional: correo,
              telefono,
              dni,
              codigo_conadis: conadis,
              nro_licencia: licencia,
              licencia_fecha_vencimiento: licenciaVence,
              placa,
              modelo,
              tipo_vehiculo_id: tipoVehiculo
            })

          }
        );

      const data =
        await response.json();

      if(!response.ok){

        mensaje.textContent =
          data.error;

        mensaje.className =
          'mensaje error';

        return;
      }

      alert(
        'Cuenta creada correctamente'
      );

      window.location.href =
        '/auth/login.html';

    } catch(error){

      mensaje.textContent =
        'Error de conexión';

      mensaje.className =
        'mensaje error';

    }

  }
);