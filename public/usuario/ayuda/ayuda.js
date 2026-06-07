const CATEGORIAS = [
  { id: 1, nombre: 'General' },
  { id: 2, nombre: 'Solicitudes' },
  { id: 3, nombre: 'Incidencias' },
  { id: 4, nombre: 'Cuentas' }
];

let categoriaActiva = null;

async function init() {
  if (!isAuthenticated()) {
    window.location.href = '/auth/login.html';
    return;
  }

  await loadLayout();
  renderCategorias();
}

function renderCategorias() {
  const container = document.getElementById('categoriasContainer');
  container.innerHTML = CATEGORIAS.map(c => `
    <button class="categoria-btn${categoriaActiva === c.id ? ' active' : ''}"
            data-id="${c.id}">
      ${c.nombre}
    </button>
  `).join('');

  container.querySelectorAll('.categoria-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.id);
      categoriaActiva = id;
      document.querySelectorAll('.categoria-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderPreguntas(id);
    });
  });

  if (!categoriaActiva && CATEGORIAS.length > 0) {
    document.querySelector('.categoria-btn').click();
  }
}

function renderPreguntas(categoriaId) {
  const container = document.getElementById('preguntasContainer');
  const categoria = CATEGORIAS.find(c => c.id === categoriaId);

  container.innerHTML = `
    <p class="empty-message">
      No hay preguntas disponibles para la categoría <strong>${categoria ? categoria.nombre : ''}</strong>.
    </p>
  `;
}

init();
