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

  const modo =
    JSON.parse(
      localStorage.getItem(
        'modoIngreso'
      ) || '{}'
    );

  const rol =
    modo.rol || 'usuario';

  const logoLink =
    document.querySelector(
      '.header-logo'
    );

  if(logoLink){

    const dashboards = {
      usuario: '/usuario/dashboard/dashboard.html',
      supervisor: '/supervisor/dashboard/dashboard.html',
      administrador: '/administrador/dashboard/dashboard.html',
      direccion: '/direccion/dashboard/dashboard.html'
    };

    logoLink.href =
      dashboards[rol] || dashboards.usuario;

  }

  const sidebarFile =
    rol === 'usuario'
      ? 'sidebar.html'
      : `sidebar-${rol}.html`;

  const sidebarResponse =
    await fetch(
      `/shared/components/${sidebarFile}`
    );

  document
    .getElementById(
      'sidebarContainer'
    )
    .innerHTML =
      await sidebarResponse.text();

  loadUserInfo();

  bindSidebar();

  cargarNotificaciones();

}

async function cargarNotificaciones() {
  try {
    const panelResponse = await fetch('/shared/components/notification-panel.html');
    document.getElementById('notificationPanelContainer').innerHTML = await panelResponse.text();

    if (typeof io === 'undefined') {
      await new Promise(function(resolve, reject) {
        var s = document.createElement('script');
        s.src = '/socket.io/socket.io.min.js';
        s.onload = resolve;
        s.onerror = resolve;
        document.head.appendChild(s);
      });
    }

    if (!window.listarNotificaciones) {
      await new Promise(function(resolve, reject) {
        var s = document.createElement('script');
        s.src = '/shared/api/notificacion.api.js';
        s.onload = resolve;
        s.onerror = resolve;
        document.head.appendChild(s);
      });
    }

    await new Promise(function(resolve, reject) {
      var s = document.createElement('script');
      s.src = '/shared/js/notification.js';
      s.onload = function() {
        if (typeof initNotifications === 'function') {
          initNotifications();
        }
        resolve();
      };
      s.onerror = resolve;
      document.head.appendChild(s);
    });
  } catch (_) {}
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