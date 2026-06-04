/*
=================================
GUARDAR SESIÓN
=================================
*/

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

/*
=================================
OBTENER TOKEN
=================================
*/

function getToken(){

  return localStorage.getItem(
    'token'
  );

}

/*
=================================
OBTENER USUARIO
=================================
*/

function getSessionUser(){

  const usuario =
    localStorage.getItem(
      'usuario'
    );

  return usuario
    ? JSON.parse(usuario)
    : null;

}

/*
=================================
SEDE
=================================
*/

function getSelectedCampus(){

  const sede =
    localStorage.getItem(
      'sedeSeleccionada'
    );

  return sede
    ? JSON.parse(sede)
    : null;

}

/*
=================================
ROL SELECCIONADO
=================================
*/

function getSelectedRole(){

  const rol =
    localStorage.getItem(
      'modoIngreso'
    );

  return rol
    ? JSON.parse(rol)
    : null;

}

/*
=================================
AUTENTICADO
=================================
*/

function isAuthenticated(){

  const token = getToken();

  if(!token){
    return false;
  }

  try{

    const payload =
      JSON.parse(
        atob(
          token.split('.')[1]
        )
      );

    if(
      payload.exp &&
      Date.now() >=
        payload.exp * 1000
    ){
      logout();
      return false;
    }

    return true;

  }catch(e){

    logout();
    return false;

  }

}

/*
=================================
REQUIERE LOGIN
=================================
*/

function requireAuth(){

  if(!isAuthenticated()){

    window.location.href =
      '/auth/login.html';

  }

}

/*
=================================
LOGIN
=================================
*/

async function login(
  codigo,
  password
){

  const response =
    await fetch(
      '/api/auth/login',
      {
        method:'POST',

        headers:{
          'Content-Type':
            'application/json'
        },

        body: JSON.stringify({
          codigo_universitario:
            codigo,

          password
        })
      }
    );

  const data =
    await response.json();

  if(!response.ok){

    throw new Error(
      data.error ||
      'Error al iniciar sesión'
    );

  }

  saveSession(data);

  window.location.href =
    '/auth/select-campus.html';

}

/*
=================================
LOGOUT
=================================
*/

function logout(){

  localStorage.clear();

  window.location.href =
    '/auth/login.html';

}