const usuario =
  JSON.parse(
    localStorage.getItem(
      'usuario'
    )
  );

if(!usuario){

  window.location.href =
    '/login.html';

}

const container =
  document.getElementById(
    'rolesContainer'
  );

/*
=================================
SIEMPRE PUEDE ENTRAR COMO USUARIO
=================================
*/

crearBoton(
  '👤 Usuario',
  'usuario',
  '/usuario/dashboard.html'
);

/*
=================================
SUPERVISOR
=================================
*/

if(
  usuario.rol === 'supervisor'
){

  crearBoton(
    '🛠 Supervisor',
    'supervisor',
    '/supervisor/dashboard.html'
  );

}

/*
=================================
ADMINISTRADOR
=================================
*/

if(
  usuario.rol === 'administrador'
){

  crearBoton(
    '⚙ Administrador',
    'administrador',
    '/administrador/dashboard.html'
  );

}

/*
=================================
DIRECCIÓN
=================================
*/

if(
  usuario.rol === 'direccion'
){

  crearBoton(
    '📊 Dirección',
    'direccion',
    '/direccion/dashboard.html'
  );

}

function crearBoton(
  texto,
  rol,
  destino
){

  const btn =
    document.createElement(
      'button'
    );

  btn.className =
    'role-card';

  btn.textContent =
    texto;

  btn.addEventListener(
    'click',
    () => {

      localStorage.setItem(
        'modoIngreso',
        JSON.stringify({
          rol
        })
      );

      window.location.href =
        destino;

    }
  );

  container.appendChild(
    btn
  );

}