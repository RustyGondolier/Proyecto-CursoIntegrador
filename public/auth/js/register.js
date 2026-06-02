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

form.addEventListener(
  'submit',
  async e => {

    e.preventDefault();

    mensaje.textContent = '';

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

              codigo_universitario:
                document
                  .getElementById(
                    'codigo'
                  )
                  .value,

              nombre:
                document
                  .getElementById(
                    'nombre'
                  )
                  .value,

              password:
                document
                  .getElementById(
                    'password'
                  )
                  .value,

              fecha_nacimiento:
                document
                  .getElementById(
                    'fechaNacimiento'
                  )
                  .value,

              correo_institucional:
                document
                  .getElementById(
                    'correo'
                  )
                  .value,

              telefono:
                document
                  .getElementById(
                    'telefono'
                  )
                  .value,

              dni:
                document
                  .getElementById(
                    'dni'
                  )
                  .value,

              codigo_conadis:
                document
                  .getElementById(
                    'conadis'
                  )
                  .value,

              nro_licencia:
                document
                  .getElementById(
                    'licencia'
                  )
                  .value,

              licencia_fecha_vencimiento:
                document
                  .getElementById(
                    'licenciaVence'
                  )
                  .value,

              placa:
                document
                  .getElementById(
                    'placa'
                  )
                  .value,

              modelo:
                document
                  .getElementById(
                    'modelo'
                  )
                  .value,

              tipo_vehiculo_id:
                Number(
                  document
                    .getElementById(
                      'tipoVehiculo'
                    )
                    .value
                )

            })

          }
        );

      const data =
        await response.json();

      if(!response.ok){

        mensaje.textContent =
          data.error;

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

    }

  }
);