function getCurrentPosition(){

  return new Promise(
    (
      resolve,
      reject
    ) => {

      if(
        !navigator.geolocation
      ){

        reject(
          'Tu navegador no soporta geolocalización'
        );

        return;
      }

      navigator.geolocation.getCurrentPosition(

        position => {

          resolve({

            lat:
              position.coords.latitude,

            lng:
              position.coords.longitude

          });

        },

        error => {

          switch(error.code){

            case 1:

              reject(
                'Permiso de ubicación denegado'
              );

              break;

            case 2:

              reject(
                'No fue posible obtener la ubicación'
              );

              break;

            default:

              reject(
                'Error obteniendo ubicación'
              );

          }

        }

      );

    }
  );

}

window.getCurrentPosition =
  getCurrentPosition;