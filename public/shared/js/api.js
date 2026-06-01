const API_BASE = '/api';

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
      API_BASE + endpoint,
      {
        headers: {
          'Content-Type':
            'application/json',

          Authorization:
            token
              ? `Bearer ${token}`
              : ''
        },

        ...options
      }
    );

  const data =
    await response.json();

  if(!response.ok){

    throw new Error(
      data.error ||
      'Error servidor'
    );

  }

  return data;

}