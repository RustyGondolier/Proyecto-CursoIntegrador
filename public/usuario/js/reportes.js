/* =========================
   PLAZA ACTUAL USUARIO
========================= */

let plazaUsuarioId = null;

async function cargarPlazaUsuario(){

  try{

    const data =
      await apiFetch(
        '/reservas/actual'
      );

    if(data?.plaza_id){

      plazaUsuarioId =
        data.plaza_id;

      document.getElementById(
        'userSlotCode'
      ).textContent =
        data.plaza_codigo || '---';

    }else{

      document.getElementById(
        'userSlotCode'
      ).textContent =
        'Sin plaza activa';

    }

  }catch(err){

    console.error(err);

    document.getElementById(
      'userSlotCode'
    ).textContent =
      'No disponible';

  }

}

cargarPlazaUsuario();

/* =========================
   TIPO REPORTE
========================= */

let tipoSeleccionado = '';

document
.querySelectorAll('.report-option')
.forEach(option => {

  option.addEventListener(
    'click',
    () => {

      document
      .querySelectorAll('.report-option')
      .forEach(el => {
        el.classList.remove(
          'active'
        );
      });

      option.classList.add(
        'active'
      );

      tipoSeleccionado =
        option.dataset.tipo;

    }
  );

});

/* =========================
   ENVIAR REPORTE
========================= */

const sendReportBtn =
  document.getElementById(
    'sendReportBtn'
  );

sendReportBtn.addEventListener(
  'click',
  async () => {

    try{

      const descripcion =
        document.getElementById(
          'reportDescription'
        ).value.trim();

      const ubicacion =
        document.getElementById(
          'reportLocation'
        ).value;

      if(!tipoSeleccionado){

        return alert(
          'Selecciona un problema'
        );

      }

      if(!descripcion){

        return alert(
          'Ingresa una descripción'
        );

      }

      if(!ubicacion){

        return alert(
          'Selecciona un estacionamiento'
        );

      }

      const payload = {

        plaza_id:
          plazaUsuarioId,

        descripcion:
          `[${tipoSeleccionado}] ${descripcion}`,

        es_prioritario:false,

        razon_prioridad:null
      };

      await apiFetch(
        '/reportes',
        {
          method:'POST',

          body:JSON.stringify(
            payload
          )
        }
      );

      /* RESUMEN */

      const fecha =
        new Date()
        .toLocaleString(
          'es-PE'
        );

      document.getElementById(
        'reportSummary'
      ).innerHTML = `
        <strong>
          Tipo:
        </strong>
        <br>
        ${tipoSeleccionado}

        <br><br>

        <strong>
          Estacionamiento:
        </strong>
        <br>
        ${ubicacion}

        <br><br>

        <strong>
          Fecha:
        </strong>
        <br>
        ${fecha}
      `;

      openModal(
        'reportSuccessModal'
      );

      /* LIMPIAR */

      document
      .querySelectorAll('.report-option')
      .forEach(el => {
        el.classList.remove(
          'active'
        );
      });

      tipoSeleccionado = '';

      document.getElementById(
        'reportDescription'
      ).value = '';

      document.getElementById(
        'reportLocation'
      ).value = '';

    }catch(err){

      console.error(err);

      alert(
        err.message
      );

    }

  }
);

/* =========================
   CERRAR MODAL
========================= */

document.getElementById(
  'closeReportModal'
).addEventListener(
  'click',
  () => {

    closeModal(
      'reportSuccessModal'
    );

  }
);