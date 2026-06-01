function saveSession(data){

  localStorage.setItem('token', data.token);
  localStorage.setItem('usuario', JSON.stringify(data.usuario));

}

function getToken(){
  return localStorage.getItem('token');
}

function getSessionUser(){
  return JSON.parse(localStorage.getItem('usuario'));
}

function logout(){
  localStorage.clear();
  window.location.href = '/login.html';
}

function requireAuth(){
  if(!getToken()){
    window.location.href = '/login.html';
  }
}