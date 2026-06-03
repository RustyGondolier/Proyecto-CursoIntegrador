function bindSidebar(){

  const menuBtn =
    document.getElementById(
      'menuBtn'
    );

  const sidebar =
    document.getElementById(
      'sidebar'
    );

  if(menuBtn){

    menuBtn.addEventListener(
      'click',
      () => {

        sidebar.classList.toggle(
          'open'
        );

      }
    );

  }

  const logoutBtn =
    document.getElementById(
      'logoutBtn'
    );

  if(logoutBtn){

    logoutBtn.addEventListener(
      'click',
      () => {

        localStorage.clear();

        window.location.href =
          '/auth/login.html';

      }
    );

  }

}

window.bindSidebar =
  bindSidebar;