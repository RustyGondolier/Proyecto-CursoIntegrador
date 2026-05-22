document.addEventListener('DOMContentLoaded', () => {
  function selectCampus(id, nombre) {
    // 1. Guardamos la sede seleccionada
    sessionStorage.setItem(
      'sedeActiva',
      JSON.stringify({ id, nombre })
    );

    // 2. Recuperamos los datos del usuario logueado
    const userData = JSON.parse(sessionStorage.getItem('usuario')) || JSON.parse(localStorage.getItem('userData'));

    if (!userData || !userData.rol) {
      window.location.href = '/login.html';
      return;
    }

    const userRole = userData.rol.toLowerCase();

    // 3. Evaluar si necesita elegir rol o va directo al dashboard
    // Si es estudiante, docente o rol básico, se salta 'select-role'
    if (userRole === 'usuario' || userRole === 'estudiante' || userRole === 'docente') {
      sessionStorage.setItem('modoAcceso', 'usuario');
      window.location.href = '/user/dashboard.html';
    } else {
      // Si es un cargo administrativo (supervisor, etc.), va a seleccionar con qué rol entrar
      window.location.href = '/select-role.html';
    }
  }

  // Asignamos los eventos click de forma segura
  document.querySelectorAll('.campus-grid .campus-card').forEach(card => {
    card.addEventListener('click', () => {
      selectCampus(
        card.dataset.id,
        card.dataset.name
      );
    });
  });
});