const API_URL = '';

async function apiFetch(
  endpoint,
  options = {}
){

  const response =
    await fetch(
      API_URL + endpoint,
      {
        ...options,

        credentials:'include',

        headers:{
          'Content-Type':
            'application/json',

          ...(options.headers || {})
        }
      }
    );

  if(
    (response.status === 401 ||
     response.status === 403) &&
    !endpoint.startsWith(
      '/api/auth/'
    )
  ){

    localStorage.removeItem(
      'usuario'
    );

    localStorage.removeItem(
      'loggedIn'
    );

    window.location.href =
      '/auth/login.html';

    return response;

  }

  return response;
}