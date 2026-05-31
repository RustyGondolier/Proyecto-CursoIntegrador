const usuario =
  JSON.parse(
    sessionStorage.getItem('usuario')
  );

/* USER */

if(usuario){

  document.getElementById(
    'sidebarUserName'
  ).textContent =
    usuario.nombre || 'Usuario';

  document.getElementById(
    'sidebarUserCod'
  ).textContent =
    usuario.codigo_universitario
    ||
    'Código no disponible';
}

document.querySelector(
  '.sidebar-avatar'
).textContent =
  usuario.nombre
    ? usuario.nombre.charAt(0).toUpperCase()
    : 'U';

/* SOCKET */

const socket = io();

/* LOAD */

async function cargarOcupacion(){

  try{

    const data =
      await apiFetch(
        '/analytics/ocupacion'
      );

    /* SUBTERRANEO */

    document.getElementById(
      'subAutosLibres'
    ).textContent =
      data.subterraneo.autos.libres;

    document.getElementById(
      'subAutosOcupados'
    ).textContent =
      data.subterraneo.autos.ocupadas;

    document.getElementById(
      'subMotosLibres'
    ).textContent =
      data.subterraneo.motos.libres;

    document.getElementById(
      'subMotosOcupadas'
    ).textContent =
      data.subterraneo.motos.ocupadas;

    /* EXTERIOR */

    document.getElementById(
      'extAutosLibres'
    ).textContent =
      data.exterior.autos.libres;

    document.getElementById(
      'extAutosOcupados'
    ).textContent =
      data.exterior.autos.ocupadas;

    document.getElementById(
      'extMotosLibres'
    ).textContent =
      data.exterior.motos.libres;

    document.getElementById(
      'extMotosOcupadas'
    ).textContent =
      data.exterior.motos.ocupadas;

  }catch(err){

    console.error(err);

  }

}

/*
async function cargarPlazas(){

  try{

    const plazas =
      await apiFetch('/plazas');

    console.log(plazas);

  }catch(err){

    console.error(err);
  }
}
*/
/*
async function cargarOcupacion(){

  try{

    const data =
      await apiFetch(
        '/analytics/ocupacion'
      );

    actualizarDashboard(data);

  }catch(err){

    console.error(err);

    usarDatosPrueba();
  }
}
*/

/* UPDATE */

function actualizarDashboard(data){

  data.forEach(item => {

    const nombre =
      item.estacionamiento.toLowerCase();

    if(nombre.includes('1')){

      actualizarCard(
        'sub',
        item
      );

    }else{

      actualizarCard(
        'ext',
        item
      );
    }

  });

}

/* CARD */

function actualizarCard(
  prefix,
  item
){

  document.getElementById(
    `${prefix}Total`
  ).textContent =
    item.total_plazas;

  document.getElementById(
    `${prefix}Ocupadas`
  ).textContent =
    item.ocupadas;

  document.getElementById(
    `${prefix}Libres`
  ).textContent =
    item.libres;

  document.getElementById(
    `${prefix}Reservadas`
  ).textContent =
    item.reservadas;

  document.getElementById(
    `${prefix}Bar`
  ).style.width =
    `${item.porcentaje_ocupacion}%`;
}

/* MOCK */

function usarDatosPrueba(){

  actualizarCard(
    'sub',
    {
      total_plazas:117,
      ocupadas:64,
      libres:40,
      reservadas:13,
      porcentaje_ocupacion:65
    }
  );

  actualizarCard(
    'ext',
    {
      total_plazas:64,
      ocupadas:31,
      libres:28,
      reservadas:5,
      porcentaje_ocupacion:48
    }
  );

}

/* SOCKET UPDATE */

socket.on(
  'plaza:actualizada',
  () => {

    cargarOcupacion();
  }
);

/* INIT */

cargarPlazas();
// cargarOcupacion();