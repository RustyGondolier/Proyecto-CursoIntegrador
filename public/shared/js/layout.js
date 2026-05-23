const overlay =
  document.getElementById('overlay');

const sidebar =
  document.getElementById('sidebar');

const menuBtn =
  document.getElementById('menuBtn');

const notificationsBtn =
  document.getElementById('notificationsBtn');

const notificationsPanel =
  document.getElementById(
    'notificationsPanel'
  );

/* OPEN SIDEBAR */

menuBtn.addEventListener(
  'click',
  () => {

    sidebar.classList.add('active');

    overlay.classList.add('active');
  }
);

/* OPEN NOTIFICATIONS */

notificationsBtn.addEventListener(
  'click',
  () => {

    notificationsPanel.classList.add('active');

    overlay.classList.add('active');
  }
);

/* CLOSE ALL */

overlay.addEventListener(
  'click',
  () => {

    sidebar.classList.remove('active');

    notificationsPanel.classList.remove('active');

    overlay.classList.remove('active');
  }
);