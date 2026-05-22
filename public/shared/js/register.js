const registerForm =
  document.getElementById('registerForm');

registerForm.addEventListener(
  'submit',
  async e => {

    e.preventDefault();

    try{

      const password =
        document
          .getElementById('password')
          .value;

      if(password.length < 6){

        return alert(
          'La contraseña debe tener mínimo 6 caracteres'
        );
      }

			const hasConadis = document.getElementById('hasConadis').value;
			const conadisValue = document.getElementById('codigo_conadis').value.trim();

      const payload = {

        codigo_universitario:
          document
            .getElementById('codigo')
            .value
            .trim(),

        nombre:
          document
            .getElementById('nombre')
            .value
            .trim(),

        correo_institucional:
          document
            .getElementById('correo')
            .value
            .trim(),

        telefono:
          document
            .getElementById('telefono')
            .value
            .trim(),

        dni:
          document
            .getElementById('dni')
            .value
            .trim(),

        fecha_nacimiento:
          document
            .getElementById('fechaNacimiento')
            .value,

        placa:
          document
            .getElementById('placa')
            .value
            .toUpperCase()
            .trim(),

        modelo:
          document
            .getElementById('modelo')
            .value
            .trim(),

        tipo_vehiculo_id:
          Number(
            document.getElementById('tipoVehiculo').value
          ),

        password,

				codigo_conadis: hasConadis === 'si' ? conadisValue : null
      };

      await apiFetch(
        '/auth/register',
        {
          method:'POST',

          body:JSON.stringify(payload)
        }
      );

      alert(
        'Cuenta creada correctamente'
      );

      window.location.href =
        '/login.html';

    }catch(err){

      alert(err.message);
    }

});