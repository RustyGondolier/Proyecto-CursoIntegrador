function saveSession(data){

  sessionStorage.setItem(
    'token',
    data.token
  );

  sessionStorage.setItem(
    'usuario',
    JSON.stringify(data.usuario)
  );
}

function getUser(){

  return JSON.parse(
    sessionStorage.getItem('usuario')
  );
}

function logout(){

  sessionStorage.clear();

  window.location.href = '/login.html';
}