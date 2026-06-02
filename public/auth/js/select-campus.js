const campus = [

  {
    id:1,
    nombre:'Lima Sur',
    descripcion:
      'Sede principal del sistema.',
    imagen:
      '/assets/images/sedes/lima-sur.jpg',
    disponible:true
  },

  {
    id:2,
    nombre:'Lima Centro',
    descripcion:
      'Próximamente',
    imagen:
      '/assets/images/sedes/lima-centro.jpg',
    disponible:false
  },

  {
    id:3,
    nombre:'Lima Norte',
    descripcion:
      'Próximamente',
    imagen:
      '/assets/images/sedes/lima-norte.jpg',
    disponible:false
  }

];

const container =
  document.getElementById(
    'campusList'
  );

campus.forEach(
  sede => {

    const card =
      document.createElement(
        'div'
      );

    card.className =
      `campus-card ${
        !sede.disponible
          ? 'disabled'
          : ''
      }`;

    card.innerHTML = `
      <img
        class="campus-image"
        src="${sede.imagen}"
      >

      <div class="campus-content">

        <h3>
          ${sede.nombre}
        </h3>

        <p>
          ${sede.descripcion}
        </p>

      </div>
    `;

    if(
      sede.disponible
    ){

      card.addEventListener(
        'click',
        () => {

          localStorage.setItem(
            'sedeSeleccionada',
            JSON.stringify(
              sede
            )
          );

          const usuario =
            JSON.parse(
              localStorage.getItem(
                'usuario'
              )
            );

          const rolesGestion = [
            'administrador',
            'supervisor',
            'direccion'
          ];

          if(
            rolesGestion.includes(
              usuario.rol
            )
          ){

            window.location.href =
              '/auth/select-role.html';

            return;
          }

          localStorage.setItem(
            'modoIngreso',
            JSON.stringify({
              rol:'usuario'
            })
          );

          window.location.href =
            '/usuario/dashboard/index.html';

        }
      );

    }

    container.appendChild(
      card
    );

  }
);