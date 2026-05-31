const form = document.getElementById('loginForm');
const mensaje = document.getElementById('mensaje');

form.addEventListener('submit', async (e) => {

  e.preventDefault();

  mensaje.textContent = '';

  const codigo_universitario =
    document.getElementById('codigo').value.trim();

  const password =
    document.getElementById('password').value;

  try {

    const response = await fetch(
      '/api/auth/login',
      {
        method: 'POST',
        headers: {
          'Content-Type':'application/json'
        },
        body: JSON.stringify({
          codigo_universitario,
          password
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      mensaje.textContent =
        data.error || 'Error al iniciar sesión';
      return;
    }

    localStorage.setItem(
      'token',
      data.token
    );

    localStorage.setItem(
      'usuario',
      JSON.stringify(data.usuario)
    );

    window.location.href =
      '/select-campus.html';

  } catch (error) {

    console.error(error);

    mensaje.textContent =
      'Error de conexión con el servidor';
  }

});