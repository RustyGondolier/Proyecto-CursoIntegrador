const usuario =
  JSON.parse(
    localStorage.getItem(
      'usuario'
    )
  );

const roleList =
  document.getElementById(
    'roleList'
  );

const opciones = [

  {
    codigo:'usuario',
    titulo:'Usuario',
    descripcion:
      'Utilizar el sistema de estacionamiento.'
  },

  {
    codigo:usuario.rol,
    titulo:
      usuario.rol
        .charAt(0)
        .toUpperCase()
      +
      usuario.rol
        .slice(1),
    descripcion:
      'Ingresar utilizando tu cargo institucional.'
  }

];

opciones.forEach(
  opcion => {

    const card =
      document.createElement(
        'div'
      );

    card.className =
      'role-card';

    card.innerHTML = `
      <h3>
        ${opcion.titulo}
      </h3>

      <p>
        ${opcion.descripcion}
      </p>
    `;

    card.addEventListener(
      'click',
      () => {

        localStorage.setItem(
          'modoIngreso',
          JSON.stringify({
            rol:
              opcion.codigo
          })
        );

        redirectByRole(
          opcion.codigo
        );

      }
    );

    roleList.appendChild(
      card
    );

  }
);

function redirectByRole(
  rol
){

  switch(rol){

    case 'administrador':

      window.location.href =
        '/administrador/dashboard/index.html';

      break;

    case 'supervisor':

      window.location.href =
        '/supervisor/dashboard/index.html';

      break;

    case 'direccion':

      window.location.href =
        '/direccion/dashboard/index.html';

      break;

    default:

      window.location.href =
        '/usuario/dashboard/index.html';

  }

}