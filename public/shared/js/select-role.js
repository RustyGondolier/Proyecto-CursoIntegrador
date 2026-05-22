document
  .querySelectorAll('.role-card')
  .forEach(card => {

    card.addEventListener(
      'click',
      () => {

        const selectedRole =
          card.dataset.role;

        sessionStorage.setItem(
          'modoAcceso',
          selectedRole
        );

        window.location.href =
          '/select-campus.html';

      }
    );

});