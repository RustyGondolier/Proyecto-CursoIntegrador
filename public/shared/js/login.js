const form =
  document.getElementById('loginForm');

form.addEventListener('submit', async e => {
  e.preventDefault();

  try{
    await login(
      document.getElementById('codigo').value,
      document.getElementById('password').value
    );

  }catch(err){
    alert(err.message);
  }
});
