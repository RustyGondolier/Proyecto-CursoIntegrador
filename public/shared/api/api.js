const API_URL = '';

async function apiFetch(
  endpoint,
  options = {}
){

  const token =
    localStorage.getItem(
      'token'
    );

  const response =
    await fetch(
      API_URL + endpoint,
      {
        ...options,

        headers:{
          'Content-Type':
            'application/json',

          Authorization:
            token
            ? `Bearer ${token}`
            : '',

          ...(options.headers || {})
        }
      }
    );

  if(
    response.status === 401 ||
    response.status === 403
  ){

    if(
      !endpoint.includes(
        '/api/auth/login'
      )
    ){
      localStorage.clear();
      window.location.href =
        '/auth/login.html';
      return response;
    }

  }

  return response;
}