function openModal(id){

  document
    .getElementById(id)
    .classList.add('active');
}

function closeModal(id){

  document
    .getElementById(id)
    .classList.remove('active');
}

/* CERRAR HACIENDO CLICK FUERA */

document.querySelectorAll('.modal')
.forEach(modal => {

  modal.addEventListener(
    'click',
    e => {

      if(e.target === modal){

        modal.classList.remove(
          'active'
        );
      }
    }
  );

});