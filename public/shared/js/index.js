const token =
  localStorage.getItem(
    'token'
  );

/* Redireccion cuando se detecta un token */

if(token){

  window.location.href =
    '/auth/select-campus.html';

}