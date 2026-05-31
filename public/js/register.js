const radiosConadis =
    document.querySelectorAll(
        'input[name="conadisTiene"]'
    );

const conadisContainer =
    document.getElementById(
        "conadisContainer"
    );

radiosConadis.forEach(radio => {

    radio.addEventListener("change", () => {

        if (radio.value === "si" && radio.checked) {

            conadisContainer.style.display =
                "block";

        } else if (
            radio.value === "no" &&
            radio.checked
        ) {

            conadisContainer.style.display =
                "none";

            document.getElementById(
                "conadis"
            ).value = "";

        }

    });

});

function detectarRol(codigo){

    const inicio =
        codigo.trim().charAt(0).toUpperCase();

    if(inicio === "C"){
        return "docente";
    }

    return "estudiante";
}

document
.getElementById("registerForm")
.addEventListener("submit", async (e) => {

    e.preventDefault();

    const codigo =
        document.getElementById("codigo").value;

    const rol =
        detectarRol(codigo);

    const body = {

        codigo_universitario: codigo,

        nombre:
            document.getElementById("nombre").value,

        password:
            document.getElementById("password").value,

        telefono:
            document.getElementById("telefono").value,

        dni:
            document.getElementById("dni").value,

        fecha_nacimiento:
            document.getElementById("fechaNacimiento").value,

        correo_institucional:
            document.getElementById("correo").value,

        nro_licencia:
            document.getElementById("licencia").value,

        licencia_fecha_vencimiento:
            document.getElementById("fechaLicencia").value,

        codigo_conadis:
            document.getElementById("conadis").value || null,

        rol,

        placa:
            document.getElementById("placa").value,

        modelo:
            document.getElementById("modelo").value,

        tipo_vehiculo_id:
            parseInt(
                document.getElementById("tipoVehiculo").value
            )

    };

    try{

        const response = await fetch(
            "/api/auth/register",
            {
                method:"POST",
                headers:{
                    "Content-Type":"application/json"
                },
                body:JSON.stringify(body)
            }
        );

        const data =
            await response.json();

        if(!response.ok){
            throw new Error(
                data.error
            );
        }

        alert(
            "Registro exitoso"
        );

        window.location.href =
            "/login.html";

    }catch(error){

        alert(
            error.message
        );

    }

});