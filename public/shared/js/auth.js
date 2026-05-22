async function login(codigo, password) {
  const data = await apiFetch(
    '/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({
        codigo_universitario: codigo,
        password
      })
    }
  );

  // Guardamos la sesión y los datos del usuario
  saveSession(data);

  // IMPORTANTE: TODOS van primero a la selección de sede
  window.location.href = '/select-campus.html';
}

/*
async function login(codigo, password){

  const data = await apiFetch(
    '/auth/login',
    {
      method:'POST',
      body:JSON.stringify({
        codigo_universitario:codigo,
        password
      })
    }
  );

  saveSession(data);

  const role = data.usuario.rol;

  if([
    'supervisor',
    'administrativo',
    'directora'
  ].includes(role)){

    window.location.href =
      '/select-role.html';

  }else{

    window.location.href =
      '/select-campus.html';
  }
}
*/