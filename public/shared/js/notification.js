function initNotifications() {
  const token = localStorage.getItem('token');
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  if (!token || !usuario.id) return;

  const socket = io({
    auth: { token }
  });

  socket.on('notificacion:nueva', function(notificacion) {
    showToast(notificacion.titulo, notificacion.mensaje, notificacion.url_destino);
  });
}

function showToast(titulo, mensaje, url) {
  const existing = document.querySelector('.toast-notification');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.innerHTML = `
    <div class="toast-content">
      <strong>${escapeHtml(titulo)}</strong>
      <p>${escapeHtml(mensaje)}</p>
    </div>
    <button class="toast-close">&times;</button>
  `;

  if (url) {
    toast.style.cursor = 'pointer';
    toast.addEventListener('click', function(e) {
      if (e.target.closest('.toast-close')) return;
      window.location.href = url;
    });
  }

  toast.querySelector('.toast-close').addEventListener('click', function() {
    toast.remove();
  });

  document.body.appendChild(toast);

  setTimeout(function() {
    toast.classList.add('toast-hiding');
    setTimeout(function() { toast.remove(); }, 300);
  }, 5000);
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

document.addEventListener('DOMContentLoaded', function() {
  if (typeof io !== 'undefined') {
    initNotifications();
  }
});
