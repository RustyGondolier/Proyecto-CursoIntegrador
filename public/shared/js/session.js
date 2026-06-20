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

async function logout(){

  try {

    const res = await fetch(
      '/api/auth/logout',
      {
        method:'POST',
        credentials:'include'
      }
    );

    if(!res.ok) throw new Error();

    localStorage.removeItem('usuario');
    localStorage.removeItem('loggedIn');
    location.href = '/auth/login.html';

  } catch {

    alert(
      'Ocurrió un error al cerrar sesión. Intente nuevamente.'
    );

  }

}