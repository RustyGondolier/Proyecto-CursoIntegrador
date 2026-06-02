function saveSession(data){

  localStorage.setItem(
    'token',
    data.token
  );

  localStorage.setItem(
    'usuario',
    JSON.stringify(
      data.usuario
    )
  );

}

function getToken(){

  return localStorage.getItem(
    'token'
  );

}

function getUser(){

  return JSON.parse(
    localStorage.getItem(
      'usuario'
    )
  );

}

function saveCampus(campus){

  localStorage.setItem(
    'campus',
    JSON.stringify(campus)
  );

}

function getCampus(){

  return JSON.parse(
    localStorage.getItem(
      'campus'
    )
  );

}

function saveMode(mode){

  localStorage.setItem(
    'mode',
    mode
  );

}

function getMode(){

  return localStorage.getItem(
    'mode'
  );

}

function logout(){

  localStorage.clear();

  location.href =
    '/auth/login.html';

}