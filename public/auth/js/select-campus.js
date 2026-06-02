saveCampus({
  id:1,
  nombre:'Lima Sur'
});

const usuario =
  getUser();

if(
  usuario.rol === 'estudiante'
  ||
  usuario.rol === 'docente'
){

  saveMode('usuario');

  location.href =
    '/usuario/dashboard/';

}else{

  location.href =
    '/auth/select-role.html';

}