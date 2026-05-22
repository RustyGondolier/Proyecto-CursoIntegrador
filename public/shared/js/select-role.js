document.addEventListener('DOMContentLoaded', () => {
  const roleGridContainer = document.getElementById('roleGridContainer');

  // 1. Obtener la información del usuario
  const userData = JSON.parse(sessionStorage.getItem('usuario')) || JSON.parse(localStorage.getItem('userData'));

  if (!userData || !userData.rol) {
    window.location.href = '/login.html';
    return;
  }

  // 2. Diccionario base con la configuración de todas las vistas
  const rolesConfig = {
    usuario: {
      title: 'Usuario Normal',
      desc: 'Reservas y estacionamiento propio',
      url: '/user/dashboard.html'
    },
    administrativo: {
      title: 'Administrativo',
      desc: 'Gestión y validaciones del campus',
      url: '/admin/dashboard.html'
    },
    supervisor: {
      title: 'Supervisor',
      desc: 'Monitoreo, paneles e infracciones',
      url: '/supervisor/dashboard.html'
    },
    directora: {
      title: 'Directora',
      desc: 'Analíticas, métricas y reportes',
      url: '/director/dashboard.html'
    }
  };

  const userRole = userData.rol.toLowerCase();

  // Función auxiliar para construir y renderizar una tarjeta en el contenedor
  function renderCard(roleKey) {
    const config = rolesConfig[roleKey];
    if (!config) return;

    const card = document.createElement('div');
    card.className = 'role-card';
    card.setAttribute('data-role', roleKey);

    card.innerHTML = `
      <h2>${config.title}</h2>
      <p>${config.desc}</p>
    `;

    card.addEventListener('click', () => {
      sessionStorage.setItem('modoAcceso', roleKey);
      window.location.href = config.url;
    });

    roleGridContainer.appendChild(card);
  }

  // 3. Lógica de renderizado según los privilegios del usuario
  if (rolesConfig[userRole]) {
    
    // PRIMERA TARJETA: Renderizamos el rol avanzado que posee (ej: supervisor)
    renderCard(userRole);

    // SEGUNDA TARJETA: Si el rol es avanzado, le agregamos también la opción de ingresar como usuario normal
    if (userRole !== 'usuario') {
      renderCard('usuario');
    }

  } else {
    // Si por algún motivo llegó aquí un rol desconocido o estudiante
    roleGridContainer.innerHTML = `<p class="error-msg">Rol no autorizado o redirigiendo...</p>`;
    window.location.href = '/user/dashboard.html';
  }
});