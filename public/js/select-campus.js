const usuario =
  JSON.parse(
    localStorage.getItem('usuario')
  );

if(!usuario){

  window.location.href =
    '/login.html';

}

document
.querySelectorAll('.campus-card.active')
.forEach(card => {

  card.addEventListener(
    'click',
    () => {

      localStorage.setItem(
        'sede',
        JSON.stringify({
          id: card.dataset.id,
          nombre: card.dataset.nombre
        })
      );

      const rolesGestion = [
        'supervisor',
        'administrador',
        'direccion'
      ];

      if(
        rolesGestion.includes(
          usuario.rol
        )
      ){

        window.location.href =
          '/select-role.html';

      }else{

        window.location.href =
          '/user/dashboard.html';

      }

    }
  );

});