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

  return localStorage.getItem(
    'loggedIn'
  ) === 'true';

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

        credentials:'include',

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

  if(data.usuario){

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

  window.location.href =
    '/auth/select-campus.html';

}

/*
=================================
LOGOUT
=================================
*/

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
    window.location.href = '/auth/login.html';

  } catch {

    alert(
      'Ocurrió un error al cerrar sesión. Intente nuevamente.'
    );

  }

}