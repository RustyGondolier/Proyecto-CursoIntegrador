document
.querySelectorAll(
  '.campus-card.active'
)
.forEach(btn => {

  btn.addEventListener(
    'click',
    () => {

      const sede = {

        id: Number(
          btn.dataset.id
        ),

        nombre:
          btn.dataset.nombre

      };

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

      /*
      =================================
      ESTUDIANTE Y DOCENTE
      =================================
      */

      if(
        usuario.rol === 'estudiante' ||
        usuario.rol === 'docente'
      ){

        localStorage.setItem(
          'modoIngreso',
          JSON.stringify({
            rol:'usuario'
          })
        );

        window.location.href =
          '/usuario/dashboard.html';

        return;

      }

      /*
      =================================
      SUPERVISOR / ADMIN / DIRECCIÓN
      =================================
      */

      window.location.href =
        '/select-role.html';

    }
  );

});