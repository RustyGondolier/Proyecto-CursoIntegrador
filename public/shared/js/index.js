const loggedIn =
  localStorage.getItem(
    'loggedIn'
  ) === 'true';

if(loggedIn){

  window.location.href =
    '/auth/select-campus.html';

}