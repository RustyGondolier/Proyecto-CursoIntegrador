async function loadLayout(){

  const headerResponse =
    await fetch(
      '/shared/components/header.html'
    );

  document
    .getElementById(
      'headerContainer'
    )
    .innerHTML =
      await headerResponse.text();

  const sidebarResponse =
    await fetch(
      '/shared/components/sidebar.html'
    );

  document
    .getElementById(
      'sidebarContainer'
    )
    .innerHTML =
      await sidebarResponse.text();

  loadUserInfo();

  bindSidebar();

}

function loadUserInfo(){

  const usuario =
    JSON.parse(
      localStorage.getItem(
        'usuario'
      )
    );

  if(!usuario){
    return;
  }

  const name =
    document.getElementById(
      'sidebarUserName'
    );

  if(name){

    name.textContent =
      usuario.nombre;

  }

  const email =
    document.getElementById(
      'sidebarUserEmail'
    );

  if(email){

    email.textContent =
      usuario.codigo_universitario;

  }

}

window.loadLayout =
  loadLayout;