const pool =
  require('../../db');

async function registrarAcceso(
  usuarioId,
  estado,
  ip,
  userAgent
){

  await pool.query(
    `
    INSERT INTO historial_accesos(
      usuario_id,
      estado,
      ip_origen,
      user_agent
    )
    VALUES(
      $1,$2,$3,$4
    )
    `,
    [
      usuarioId,
      estado,
      ip,
      userAgent
    ]
  );

}

module.exports = {
  registrarAcceso
};