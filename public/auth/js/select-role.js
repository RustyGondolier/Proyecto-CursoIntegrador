const usuario =
  getUser();

const container =
  document.getElementById(
    'rolesContainer'
  );

crearBoton(
  'Usuario',
  'usuario'
);

if(
  usuario.rol === 'supervisor'
){

  crearBoton(
    'Supervisor',
    'supervisor'
  );

}

if(
  usuario.rol === 'administrador'
){

  crearBoton(
    'Administrador',
    'administrador'
  );

}

if(
  usuario.rol === 'direccion'
){

  crearBoton(
    'Dirección',
    'direccion'
  );

}

function crearBoton(
  texto,
  modo
){

  const btn =
    document.createElement(
      'button'
    );

  btn.textContent =
    texto;

  btn.addEventListener(
    'click',
    () => {

      saveMode(modo);

      switch(modo){

        case 'usuario':

          location.href =
            '/usuario/dashboard/';
          break;

        case 'supervisor':

          location.href =
            '/supervisor/dashboard/';
          break;

        case 'administrador':

          location.href =
            '/administrador/dashboard/';
          break;

        case 'direccion':

          location.href =
            '/direccion/dashboard/';
          break;

      }

    }
  );

  container.appendChild(btn);

}