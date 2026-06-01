async function loadLayout(){

  await loadTopbar();

  await loadSidebar();

  await loadNotifications();

}

async function loadTopbar(){

  const response =
    await fetch(
      '/shared/components/topbar.html'
    );

  document.getElementById(
    'topbar-container'
  ).innerHTML =
    await response.text();

}

async function loadSidebar(){

  const response =
    await fetch(
      '/shared/components/sidebar.html'
    );

  document.getElementById(
    'sidebar-container'
  ).innerHTML =
    await response.text();

  fillSidebarData();

}

async function loadNotifications(){

  const response =
    await fetch(
      '/shared/components/notifications.html'
    );

  document.getElementById(
    'notifications-container'
  ).innerHTML =
    await response.text();

}

async function fillSidebarData(){

  try{

    const perfil =
      await apiFetch(
        '/auth/perfil'
      );

    document.getElementById(
      'sidebarNombre'
    ).textContent =
      perfil.nombre;

    document.getElementById(
      'sidebarCodigo'
    ).textContent =
      perfil.codigo_universitario;

    document.getElementById(
      'sidebarPlaca'
    ).textContent =
      perfil.placa || '-';

  }catch(err){

    console.error(err);

  }

}