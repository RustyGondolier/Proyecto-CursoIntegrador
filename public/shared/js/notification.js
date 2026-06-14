let notifSocket = null;
let notifPanelOpen = false;

function initNotifications() {
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  if (!usuario.id) return;

  const panelHtml = document.getElementById('notificationPanelContainer');
  if (!panelHtml) return;

  const btn = document.getElementById('notificationBtn');
  const badge = document.getElementById('notificationBadge');
  const panel = document.getElementById('notificationPanel');
  const overlay = document.getElementById('notificationOverlay');
  const closeBtn = document.getElementById('closeNotificationPanel');
  const list = document.getElementById('notificationList');
  const markAllBtn = document.getElementById('markAllReadBtn');

  if (!btn || !panel || !overlay || !closeBtn || !list) return;

  actualizarBadge(badge);

  notifSocket = io({
    withCredentials: true
  });

  notifSocket.on('notificacion:nueva', function(notificacion) {
    showToast(notificacion.titulo, notificacion.mensaje, notificacion.url_destino);
    actualizarBadge(badge);
    if (notifPanelOpen) {
      agregarNotificacionAlInicio(list, notificacion, badge);
    }
  });

  btn.addEventListener('click', function(e) {
    e.stopPropagation();
    togglePanel(panel, overlay, list, badge);
  });

  closeBtn.addEventListener('click', function() {
    cerrarPanel(panel, overlay);
  });

  overlay.addEventListener('click', function() {
    cerrarPanel(panel, overlay);
  });

  markAllBtn.addEventListener('click', async function() {
    try {
      await marcarTodasLeidas();
      list.querySelectorAll('.notif-item.unread').forEach(function(el) {
        el.classList.remove('unread');
      });
      if (badge) {
        badge.textContent = '0';
        badge.classList.add('hidden');
      }
    } catch (err) { console.warn('Error al marcar notificaciones como leídas:', err); }
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && notifPanelOpen) {
      cerrarPanel(panel, overlay);
    }
  });
}

function actualizarBadge(badge) {
  if (!badge) return;
  contarNoLeidas().then(function(r) {
    if (r.total > 0) {
      badge.textContent = r.total > 99 ? '99+' : r.total;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }).catch(function(err) { console.warn('Error al contar no leídas:', err); });
}

async function togglePanel(panel, overlay, list, badge) {
  if (notifPanelOpen) {
    cerrarPanel(panel, overlay);
    return;
  }
  notifPanelOpen = true;
  panel.classList.add('open');
  overlay.classList.remove('hidden');
  list.innerHTML = '<div class="notification-empty">Cargando...</div>';
  try {
    const notificaciones = await listarNotificaciones();
    if (notificaciones.length === 0) {
      list.innerHTML = '<div class="notification-empty">No tienes notificaciones</div>';
    } else {
      list.innerHTML = '';
      notificaciones.forEach(function(n) {
        list.appendChild(crearElementoNotificacion(n, badge));
      });
    }
  } catch (err) { console.warn('Error al cargar notificaciones:', err);
    list.innerHTML = '<div class="notification-empty">Error al cargar notificaciones</div>';
  }
}

function cerrarPanel(panel, overlay) {
  notifPanelOpen = false;
  panel.classList.remove('open');
  overlay.classList.add('hidden');
}

function crearElementoNotificacion(n, badge) {
  var div = document.createElement('div');
  div.className = 'notif-item' + (n.leida ? '' : ' unread');
  div.dataset.id = n.id;

  var tiempo = '';
  if (n.creado_en) {
    var d = new Date(n.creado_en);
    var ahora = new Date();
    var diffMs = ahora - d;
    var diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) tiempo = 'Ahora';
    else if (diffMin < 60) tiempo = diffMin + ' min';
    else if (diffMin < 1440) tiempo = Math.floor(diffMin / 60) + 'h';
    else tiempo = d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' });
  }

  div.innerHTML =
    '<div class="notif-content">' +
      '<div class="notif-title">' + escapeHtml(n.titulo) + '</div>' +
      '<div class="notif-message">' + escapeHtml(n.mensaje) + '</div>' +
      '<div class="notif-time">' + tiempo + '</div>' +
    '</div>';

  if (n.url_destino) {
    div.style.cursor = 'pointer';
    div.addEventListener('click', function() {
      if (!n.leida) {
        marcarLeida(n.id);
        div.classList.remove('unread');
        actualizarBadge(badge);
      }
      window.location.href = n.url_destino;
    });
  }

  return div;
}

function agregarNotificacionAlInicio(list, n, badge) {
  var empty = list.querySelector('.notification-empty');
  if (empty) empty.remove();

  var existingFirst = list.firstChild;
  var el = crearElementoNotificacion(n, badge);
  if (existingFirst) {
    list.insertBefore(el, existingFirst);
  } else {
    list.appendChild(el);
  }
}

function showToast(titulo, mensaje, url) {
  var existing = document.querySelector('.toast-notification');
  if (existing) existing.remove();

  var toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.innerHTML =
    '<div class="toast-content">' +
      '<strong>' + escapeHtml(titulo) + '</strong>' +
      '<p>' + escapeHtml(mensaje) + '</p>' +
    '</div>' +
    '<button class="toast-close">&times;</button>';

  if (url) {
    toast.style.cursor = 'pointer';
    toast.addEventListener('click', function(e) {
      if (e.target.closest('.toast-close')) return;
      window.location.href = url;
    });
  }

  toast.querySelector('.toast-close').addEventListener('click', function(e) {
    e.stopPropagation();
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