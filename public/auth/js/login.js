const form =
  document.getElementById(
    'loginForm'
  );

const mensaje =
  document.getElementById(
    'mensaje'
  );

const passwordInput =
  document.getElementById(
    'password'
  );

const togglePassword =
  document.getElementById(
    'togglePassword'
  );

/*
=========================
VER PASSWORD
=========================
*/

togglePassword.addEventListener(
  'click',
  () => {

    passwordInput.type =
      passwordInput.type === 'password'
        ? 'text'
        : 'password';

  }
);

/*
=========================
LOGIN
=========================
*/

form.addEventListener(
  'submit',
  async e => {

    e.preventDefault();

    mensaje.textContent = '';

    try {

      await login(
        document
          .getElementById('codigo')
          .value,

        document
          .getElementById('password')
          .value
      );

    } catch(error){

      mensaje.textContent =
        error.message;

    }

  }
);