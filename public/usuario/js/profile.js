const usuario =
  JSON.parse(
    localStorage.getItem('usuario')
  );

if(!usuario){
  window.location.href =
    '/login.html';
}

/* SIDEBAR */

document.getElementById(
  'sidebarUserName'
).textContent =
  usuario.nombre;

document.getElementById(
  'sidebarUserCode'
).textContent =
  usuario.codigo_universitario;

/* PERFIL */

document.getElementById(
  'profileName'
).textContent =
  usuario.nombre;

document.getElementById(
  'profileCode'
).textContent =
  usuario.codigo_universitario;

document.getElementById(
  'profileRole'
).textContent =
  usuario.rol;

document.getElementById(
  'profileInitial'
).textContent =
  usuario.nombre
    .charAt(0)
    .toUpperCase();

/* DATOS */

async function cargarPerfil(){

  try{

    const perfil =
      await apiFetch('/auth/perfil');

    document.getElementById(
      'dataCodigo'
    ).textContent =
      perfil.codigo_universitario || '-';

    document.getElementById(
      'dataCorreo'
    ).textContent =
      perfil.correo_institucional || '-';

    document.getElementById(
      'dataDni'
    ).textContent =
      perfil.dni || '-';

    document.getElementById(
      'dataTelefono'
    ).textContent =
      perfil.telefono || '-';

    document.getElementById(
      'dataNacimiento'
    ).textContent =
      perfil.fecha_nacimiento || '-';

    document.getElementById(
      'dataLicencia'
    ).textContent =
      perfil.nro_licencia || '-';

    document.getElementById(
      'dataLicenciaVence'
    ).textContent =
      perfil.licencia_fecha_vencimiento || '-';

    if(perfil.codigo_conadis){

      document.getElementById(
        'dataConadis'
      ).textContent =
        perfil.codigo_conadis;

    }else{

      document.getElementById(
        'conadisContainer'
      ).style.display = 'none';
    }

    /* VEHICULO */

    document.getElementById(
      'vehiclesList'
    ).innerHTML = `
      <div class="vehicle-card">

        <div class="vehicle-info">

          <h4>
            ${perfil.modelo || 'Vehículo'}
          </h4>

          <p>
            ${perfil.placa || '-'}
          </p>

        </div>

        <button class="vehicle-btn">
          Seleccionado
        </button>

      </div>
    `;

  }catch(err){

    console.error(err);
  }
}

cargarPerfil();

/* LOGOUT */

document.getElementById(
  'logoutBtn'
).addEventListener(
  'click',
  () => {

    localStorage.clear();

    window.location.href =
      '/login.html';
  }
);


/* =========================
   MODAL EDITAR PERFIL
========================= */

const editProfileBtn =
  document.getElementById(
    'editProfileBtn'
  );

const closeEditProfileModal =
  document.getElementById(
    'closeEditProfileModal'
  );

const cancelEditProfileModal =
  document.getElementById(
    'cancelEditProfileModal'
  );

const editProfileModal =
  document.getElementById(
    'editProfileModal'
  );

/* OPEN */

editProfileBtn.addEventListener(
  'click',
  () => {
    document.getElementById(
      'editNombre'
    ).value =
      usuario.nombre || '';

    document.getElementById(
      'editTelefono'
    ).value =
      usuario.telefono || '';

    document.getElementById(
      'editCorreo'
    ).value =
      usuario.correo_institucional || '';

    document.getElementById(
      'editLicenciaVence'
    ).value =
      usuario.licencia_fecha_vencimiento || '';

    openModal('editProfileModal');
  }
);

/* CLOSE X */

closeEditProfileModal.addEventListener(
  'click',
  () => {

    closeModal('editProfileModal');

  }
);

/* CLOSE CANCEL */

cancelEditProfileModal.addEventListener(
  'click',
  () => {

    closeModal('editProfileModal');

  }
);

/* CLOSE OUTSIDE */

editProfileModal.addEventListener(
  'click',
  e => {

    if(
      e.target === editProfileModal
    ){
      closeModal('editProfileModal');
    }

  }
);

/* =========================
   GUARDAR PERFIL
========================= */

const editProfileForm =
  document.getElementById(
    'editProfileForm'
  );

editProfileForm.addEventListener(
  'submit',
  async e => {

    e.preventDefault();

    try{

      const payload = {

        nombre:
          document.getElementById(
            'editNombre'
          ).value,

        telefono:
          document.getElementById(
            'editTelefono'
          ).value,

        correo_institucional:
          document.getElementById(
            'editCorreo'
          ).value,

        licencia_fecha_vencimiento:
          document.getElementById(
             'editLicenciaVence'
          ).value
      };

      await apiFetch(
        '/auth/perfil',
        {
          method:'PUT',

          body:JSON.stringify(
            payload
          )
        }
      );

      /* ACTUALIZAR SESSION */

      usuario.nombre =
        payload.nombre;

      usuario.telefono =
        payload.telefono;

      usuario.correo_institucional =
        payload.correo_institucional;

      usuario.licencia_fecha_vencimiento =
        payload.licencia_fecha_vencimiento;

      localStorage.setItem(
        'usuario',
        JSON.stringify(usuario)
      );

      /* ACTUALIZAR UI */

      document.getElementById(
        'profileName'
      ).textContent =
        payload.nombre;

      document.getElementById(
        'sidebarUserName'
      ).textContent =
        payload.nombre;

      document.getElementById(
        'dataTelefono'
      ).textContent =
        payload.telefono;

      document.getElementById(
        'dataCorreo'
      ).textContent =
        payload.correo_institucional;

      document.getElementById(
        'dataLicenciaVence'
      ).textContent =
        payload.licencia_fecha_vencimiento || '-';

      closeModal(
        'editProfileModal'
      );

      alert(
        'Perfil actualizado'
      );

    }catch(err){

      alert(err.message);

    }

  }
);


const vehiclesList =
  document.getElementById(
    'vehiclesList'
  );

/* =========================
   MODAL AGREGAR VEHICULO
========================= */

const addVehicleBtn =
  document.getElementById(
    'addVehicleBtn'
  );

const addVehicleModal =
  document.getElementById(
    'addVehicleModal'
  );

const closeAddVehicleModal =
  document.getElementById(
    'closeAddVehicleModal'
  );

const cancelAddVehicleModal =
  document.getElementById(
    'cancelAddVehicleModal'
  );

/* OPEN */

addVehicleBtn.addEventListener(
  'click',
  () => {

    openModal('addVehicleModal');

  }
);

/* CLOSE */

closeAddVehicleModal.addEventListener(
  'click',
  () => {

    closeModal('addVehicleModal');

  }
);

cancelAddVehicleModal.addEventListener(
  'click',
  () => {

    closeModal('addVehicleModal');

  }
);

/* CLOSE OUTSIDE */

addVehicleModal.addEventListener(
  'click',
  e => {

    if(e.target === addVehicleModal){

      closeModal('addVehicleModal');

    }

  }
);

/* =========================
   GUARDAR VEHICULO
========================= */

const addVehicleForm =
  document.getElementById(
    'addVehicleForm'
  );

addVehicleForm.addEventListener(
  'submit',
  async e => {

    e.preventDefault();

    try{

      const payload = {

        placa:
          document.getElementById(
            'vehiclePlate'
          ).value,

        modelo:
          document.getElementById(
            'vehicleModel'
          ).value,

        tipo_vehiculo_id:
          Number(
            document.getElementById(
              'vehicleType'
            ).value
          )
      };

      await apiFetch(
        '/vehiculos',
        {
          method:'POST',

          body:JSON.stringify(
            payload
          )
        }
      );

      alert(
        'Vehículo agregado'
      );

      closeModal(
        'addVehicleModal'
      );

      location.reload();

    }catch(err){

      alert(err.message);

    }

  }
);


/* =========================
   CARGAR VEHICULOS
========================= */

async function cargarVehiculos(){

  try{

    const vehiculos =
      await apiFetch(
        '/vehiculos'
      );

    const container =
      document.getElementById(
        'vehiclesList'
      );

    container.innerHTML = '';

    vehiculos.forEach(
      vehiculo => {
        const card = document.createElement('div');

        card.className = 'vehicle-card';

        card.innerHTML = `
          <div class="vehicle-info">

            <h4>
              ${vehiculo.placa}
            </h4>

            <p>
              ${vehiculo.modelo || '-'}
            </p>

          </div>

          <button
            class="vehicle-btn"
            data-id="${vehiculo.id}"
          >

            ${
              String(vehiculo.activo) === 'true'
                ||
                vehiculo.activo === true
                ? 'Seleccionado'
                : 'Seleccionar'
            }
          
          </button>
        `;

        container.appendChild(card);

      }
    );

  }catch(err){

    console.error(err);

  }

}

/* =========================
   CAMBIAR VEHICULO
========================= */

const changeVehicleBtn =
  document.getElementById(
    'changeVehicleBtn'
  );

const changeVehicleModal =
  document.getElementById(
    'changeVehicleModal'
  );

const closeChangeVehicleModal =
  document.getElementById(
    'closeChangeVehicleModal'
  );

const cancelChangeVehicleModal =
  document.getElementById(
    'cancelChangeVehicleModal'
  );

const confirmChangeVehicleBtn =
  document.getElementById(
    'confirmChangeVehicleBtn'
  );

const vehicleSelectList =
  document.getElementById(
    'vehicleSelectList'
  );

let selectedVehicleId = null;

changeVehicleBtn.addEventListener(
  'click',
  async () => {

    try{

      const vehiculos =
        await apiFetch(
          '/vehiculos'
        );

      vehicleSelectList.innerHTML = '';

      vehiculos.forEach(
        vehiculo => {

          const option =
            document.createElement('label');

          option.className =
            `
            vehicle-option
            ${
              vehiculo.activo
                ? 'active'
                : ''
            }
            `;

          option.innerHTML = `
            <input
              type="radio"
              name="selectedVehicle"
              value="${vehiculo.id}"
              ${
                vehiculo.activo
                  ? 'checked'
                  : ''
              }
            >

            <div class="vehicle-option-info">

              <h4>
                ${vehiculo.placa}
              </h4>

              <p>
                ${vehiculo.modelo || '-'}
              </p>

            </div>
          `;

          vehicleSelectList.appendChild(
            option
          );

        }
      );

      selectedVehicleId =
        vehiculos.find(
          v => v.activo
        )?.id;

      openModal(
        'changeVehicleModal'
      );

    }catch(err){

      alert(err.message);

    }

  }
);

vehicleSelectList.addEventListener(
  'change',
  e => {

    if(
      e.target.name
      === 'selectedVehicle'
    ){

      selectedVehicleId =
        e.target.value;

      document
        .querySelectorAll(
          '.vehicle-option'
        )
        .forEach(option => {

          option.classList.remove(
            'active'
          );

        });

      e.target
        .closest('.vehicle-option')
        .classList.add('active');

    }

  }
);

confirmChangeVehicleBtn.addEventListener(
  'click',
  async () => {

    if(!selectedVehicleId){
      return;
    }

    try{

      await apiFetch(
        `/vehiculos/${selectedVehicleId}/seleccionar`,
        {
          method:'PUT'
        }
      );

      closeModal(
        'changeVehicleModal'
      );

      await cargarVehiculos();

      alert(
        'Vehículo actualizado'
      );

    }catch(err){

      alert(err.message);

    }

  }
);

closeChangeVehicleModal.addEventListener(
  'click',
  () => {

    closeModal(
      'changeVehicleModal'
    );

  }
);

cancelChangeVehicleModal.addEventListener(
  'click',
  () => {

    closeModal(
      'changeVehicleModal'
    );

  }
);

cargarVehiculos();
