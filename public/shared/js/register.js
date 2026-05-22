const registerForm = document.getElementById('registerForm');

const conadisRadios = document.querySelectorAll('input[name="hasConadis"]');
const wrapper = document.getElementById('conadisWrapper');
const inputConadis = document.getElementById('codigo_conadis');

conadisRadios.forEach(radio => {
    radio.addEventListener('change', () => {
        if (radio.value === 'si' && radio.checked) {
            wrapper.style.display = 'block';
            inputConadis.setAttribute('required', 'required');
        } else if (radio.value === 'no' && radio.checked) {
            wrapper.style.display = 'none';
            inputConadis.removeAttribute('required');
            inputConadis.value = ''; // Limpia el campo si cambian a "No"
        }
    });
});

registerForm.addEventListener(
  'submit',
  async e => {

    e.preventDefault();

    try{

      const password = document.getElementById('password').value;

      if(password.length < 6){
        return alert(
          'La contraseña debe tener mínimo 6 caracteres'
        );
      }

			const conadisRadioSelected = document.querySelector('input[name="hasConadis"]:checked');
      const hasConadis = conadisRadioSelected ? conadisRadioSelected.value : 'no';

      const conadisValue = inputConadis.value.trim();

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

      alert('Cuenta creada correctamente');
      window.location.href = '/login.html';

    }catch(err){
      alert(err.message);
    }

});