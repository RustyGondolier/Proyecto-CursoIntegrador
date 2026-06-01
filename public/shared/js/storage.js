function saveSession(data){

  localStorage.setItem(
    'token',
    data.token
  );

  localStorage.setItem(
    'usuario',
    JSON.stringify(data.usuario)
  );
}

function getUser(){

  return JSON.parse(
    localStorage.getItem('usuario')
  );
}

function logout(){

  localStorage.clear();

  window.location.href = '/login.html';
}