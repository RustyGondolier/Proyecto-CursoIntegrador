async function init(){

  await loadLayout();

  renderDashboard();

}

function renderDashboard(){

  const usuario =
    JSON.parse(
      localStorage.getItem(
        'usuario'
      )
    );

  document
    .getElementById(
      'welcomeText'
    )
    .textContent =
      `Bienvenido ${usuario.nombre}`;

  document
    .getElementById(
      'locationStatus'
    )
    .innerHTML =
      `
      La ubicación será validada
      al momento de solicitar una plaza.
      `;

  document
    .getElementById(
      'parkingContainer'
    )
    .innerHTML =
      createParkingCards();

}

function createParkingCards(){

  return `

    <div class="parking-card">

      <img
        class="parking-image"
        src="/assets/images/campus/sur-estacionamiento-1.jpg"
        alt="Estacionamiento 1"
      >

      <div class="parking-body">

        <h2>
          Estacionamiento 1
        </h2>

        <p>
          Autos:
          0 / 95
        </p>

        <div class="progress">

          <div
            class="progress-fill auto"
            style="width:0%;"
          ></div>

        </div>

        <p>
          Motos:
          0 / 22
        </p>

        <div class="progress">

          <div
            class="progress-fill moto"
            style="width:0%;"
          ></div>

        </div>

        <div class="parking-actions">

          <button>
            Ver estacionamiento
          </button>

          <button
            class="request-btn"
          >
            Solicitar plaza
          </button>

        </div>

      </div>

    </div>

    <div class="parking-card">

      <img
        class="parking-image"
        src="/assets/images/campus/sur-estacionamiento-2.jpg"
        alt="Estacionamiento 2"
      >

      <div class="parking-body">

        <h2>
          Estacionamiento 2
        </h2>

        <p>
          Autos:
          0 / 59
        </p>

        <div class="progress">

          <div
            class="progress-fill auto"
            style="width:0%;"
          ></div>

        </div>

        <p>
          Motos:
          0 / 5
        </p>

        <div class="progress">

          <div
            class="progress-fill moto"
            style="width:0%;"
          ></div>

        </div>

        <div class="parking-actions">

          <button>
            Ver estacionamiento
          </button>

          <button
            class="request-btn"
          >
            Solicitar plaza
          </button>

        </div>

      </div>

    </div>

  `;

}

init();