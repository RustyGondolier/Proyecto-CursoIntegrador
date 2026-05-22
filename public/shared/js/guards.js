function requireAuth(){

  const token =
    sessionStorage.getItem('token');

  if(!token){

    window.location.href =
      '/login.html';
  }
}

function requireCampus(){

  const sede =
    sessionStorage.getItem('sedeActiva');

  if(!sede){

    window.location.href =
      '/select-campus.html';
  }
}