const API_URL =

  window.location.hostname === 'localhost'

    ? 'http://localhost:3000/api'

    : 'https://TU-BACKEND.onrender.com/api';


const SOCKET_URL =

  window.location.hostname === 'localhost'

    ? 'http://localhost:3000'

    : 'https://TU-BACKEND.onrender.com';