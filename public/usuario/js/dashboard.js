requireAuth();

const usuario = getSessionUser();

const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');

const btnMenu = document.getElementById('btnMenu');
const btnNotif = document.getElementById('btnNotif');

const notifPanel = document.getElementById('notifications');

const container = document.getElementById('estacionamientosContainer');

/* =========================
   SIDEBAR
========================= */

btnMenu.onclick = () => {
  sidebar.classList.add('open');
  overlay.classList.remove('hidden');
};

btnNotif.onclick = () => {
  notifPanel.classList.toggle('hidden');
  overlay.classList.remove('hidden');
};

overlay.onclick = () => {
  sidebar.classList.remove('open');
  notifPanel.classList.add('hidden');
  overlay.classList.add('hidden');
};

/* =========================
   USER INFO
========================= */

document.getElementById('userName').textContent = usuario.nombre;
document.getElementById('userCode').textContent = usuario.codigo_universitario;

/* =========================
   SOCKET
========================= */

const socket = io();

/* =========================
   CARGAR ESTACIONAMIENTOS
========================= */

async function loadParking(){

  const res = await fetch('/api/estacionamientos/ocupacion', {
    headers:{
      Authorization:`Bearer ${getToken()}`
    }
  });

  const data = await res.json();

  if (!Array.isArray(data)) {
    console.error('Respuesta inválida:', data);
    return;
  }

  renderParking(data);
}

function renderParking(data){

  container.innerHTML = '';

  data.forEach(e => {

    const ocupadosAutos = e.autos_ocupados || 0;
    const totalAutos = e.autos_total || 1;

    const ocupadosMotos = e.motos_ocupados || 0;
    const totalMotos = e.motos_total || 1;

    const imgSrc =
      e.id === 1
        ? '/assets/images/estacionamiento-subterraneo.png'
        : '/assets/images/estacionamiento-exterior.png';

    const card = document.createElement('div');
    card.className = 'parking-card';

    card.innerHTML = `
      <img 
        src="${imgSrc}" 
        class="parking-img"
        alt="Estacionamiento ${e.nombre}"
      />

      <div class="parking-header">
        <h3>${e.nombre}</h3>
      </div>

      <p>Autos: ${ocupadosAutos}/${totalAutos}</p>
      <div class="bar"><div class="bar-fill" style="width:${(ocupadosAutos/totalAutos)*100}%"></div></div>

      <p>Motos: ${ocupadosMotos}/${totalMotos}</p>
      <div class="bar"><div class="bar-fill" style="width:${(ocupadosMotos/totalMotos)*100}%"></div></div>

      <div class="btn-row">
        <button class="secondary" onclick="goMap(${e.id})">Ver estacionamiento</button>
        <button class="primary" onclick="requestSpot(${e.id})">Solicitar plaza</button>
      </div>
    `;

    container.appendChild(card);

  });

}

/* =========================
   MAPA (placeholder)
========================= */

function goMap(id){
  localStorage.setItem('parkingSelected', id);
  window.location.href = '/usuario/estacionamiento.html';
}

/* =========================
   GEO VALIDATION
========================= */

async function requestSpot(estacionamiento_id){

  navigator.geolocation.getCurrentPosition(async (pos) => {

    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;

    const res = await fetch('/api/solicitudes', {
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        Authorization:`Bearer ${getToken()}`
      },
      body:JSON.stringify({
        estacionamiento_id,
        lat,
        lng
      })
    });

    const data = await res.json();

    alert(data.mensaje || data.error);

    loadParking();

  }, () => {
    alert('No se pudo obtener ubicación');
  });

}

/* =========================
   SOCKET UPDATE
========================= */

socket.on('ocupacion:update', () => {
  loadParking();
});

/* INIT */
loadParking();