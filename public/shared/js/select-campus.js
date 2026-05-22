function selectCampus(id,nombre){

  sessionStorage.setItem(
    'sedeActiva',
    JSON.stringify({
      id,
      nombre
    })
  );

  const usuario = JSON.parse(
    sessionStorage.getItem('usuario')
  );

  switch(usuario.rol){

    case 'supervisor':
      window.location.href =
        '/supervisor/dashboard.html';
    break;

    case 'administrativo':
      window.location.href =
        '/admin/dashboard.html';
    break;

    case 'directora':
      window.location.href =
        '/director/dashboard.html';
    break;

    default:
      window.location.href =
        '/user/dashboard.html';
  }
}

document
  .querySelectorAll('.campus-card')
  .forEach(card => {

    card.addEventListener('click', () => {

      selectCampus(
        card.dataset.id,
        card.dataset.name
      );

    });

});