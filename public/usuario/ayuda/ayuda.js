async function init() {
  if (!isAuthenticated()) {
    window.location.href = '/auth/login.html';
    return;
  }

  await loadLayout();
  renderCategorias();
}

async function renderCategorias() {
  const container = document.getElementById('categoriasContainer');

  try {
    const resp = await apiFetch('/api/faq');
    if (!resp.ok) throw new Error();
    const categorias = await resp.json();

    container.innerHTML = categorias.map(c => `
      <button class="categoria-btn" data-id="${c.id}">
        ${escapeHtml(c.nombre)}
      </button>
    `).join('');

    container.querySelectorAll('.categoria-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.categoria-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        cargarPreguntas(Number(btn.dataset.id));
      });
    });

    if (categorias.length > 0) {
      container.querySelector('.categoria-btn').classList.add('active');
      cargarPreguntas(categorias[0].id);
    }
  } catch {
    container.innerHTML = '<p class="empty-message">No se pudieron cargar las categorías. Verifica tu conexión.</p>';
  }
}

async function cargarPreguntas(categoriaId) {
  const container = document.getElementById('preguntasContainer');
  container.innerHTML = '<p class="empty-message">Cargando preguntas...</p>';

  try {
    const resp = await apiFetch(`/api/faq/${categoriaId}/preguntas`);
    if (!resp.ok) throw new Error();
    const preguntas = await resp.json();

    if (preguntas.length === 0) {
      container.innerHTML = '<p class="empty-message">No hay preguntas disponibles para esta categoría.</p>';
      return;
    }

    container.innerHTML = preguntas.map((p, i) => `
      <div class="pregunta-item">
        <button class="pregunta-header" data-index="${i}">
          <span>${escapeHtml(p.pregunta)}</span>
        </button>
        <div class="pregunta-answer" id="answer-${i}">
          <p>${escapeHtml(p.respuesta)}</p>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.pregunta-header').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = btn.dataset.index;
        const answer = document.getElementById(`answer-${idx}`);
        answer.classList.toggle('open');
        btn.classList.toggle('open');
      });
    });
  } catch {
    container.innerHTML = '<p class="empty-message">No se pudieron cargar las preguntas. Verifica tu conexión.</p>';
  }
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

init();
