const usuario =
  JSON.parse(
    localStorage.getItem('usuario')
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
  '/user/dashboard.html'
);

/*
=================================
SUPERVISOR
=================================
*/

if(usuario.rol === 'supervisor'){

  crearBoton(
    '🛠 Supervisor',
    '/supervisor/dashboard.html'
  );

}

/*
=================================
ADMINISTRADOR
=================================
*/

if(usuario.rol === 'administrador'){

  crearBoton(
    '⚙ Administrador',
    '/administrador/dashboard.html'
  );

}

/*
=================================
DIRECCIÓN
=================================
*/

if(usuario.rol === 'direccion'){

  crearBoton(
    '📊 Dirección',
    '/direccion/dashboard.html'
  );

}

function crearBoton(
  texto,
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
        texto
      );

      window.location.href =
        destino;

    }
  );

  container.appendChild(
    btn
  );

}