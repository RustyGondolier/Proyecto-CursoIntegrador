function saveSession(data){

  localStorage.setItem(
    'usuario',
    JSON.stringify(
      data.usuario
    )
  );

  localStorage.setItem(
    'loggedIn',
    'true'
  );

}

function getToken(){

  return null;

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

  fetch(
    '/api/auth/logout',
    {
      method:'POST',
      credentials:'include'
    }
  ).finally(
    () => {

      localStorage.removeItem(
        'usuario'
      );

      localStorage.removeItem(
        'loggedIn'
      );

      location.href =
        '/auth/login.html';

    }
  );

}