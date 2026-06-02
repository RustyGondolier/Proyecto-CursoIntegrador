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

  return response;
}