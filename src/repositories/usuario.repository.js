const pool =
  require('../../db');

async function findByCodigo(
  codigo
){

  const resultado =
    await pool.query(
      `
      SELECT *
      FROM usuarios
      WHERE codigo_universitario = $1
      `,
      [codigo]
    );

  return resultado.rows[0];

}

async function findById(
  id
){

  const resultado =
    await pool.query(
      `
      SELECT *
      FROM usuarios
      WHERE id = $1
      `,
      [id]
    );

  return resultado.rows[0];

}

async function create(
  datos
){

  const resultado =
    await pool.query(
      `
      INSERT INTO usuarios(
        codigo_universitario,
        nombre,
        password_hash,
        telefono,
        dni,
        fecha_nacimiento,
        correo_institucional,
        nro_licencia,
        licencia_fecha_vencimiento,
        codigo_conadis,
        rol
      )
      VALUES(
        $1,$2,$3,$4,$5,
        $6,$7,$8,$9,$10,$11
      )
      RETURNING *
      `,
      [
        datos.codigo_universitario,
        datos.nombre,
        datos.password_hash,
        datos.telefono,
        datos.dni,
        datos.fecha_nacimiento,
        datos.correo_institucional,
        datos.nro_licencia,
        datos.licencia_fecha_vencimiento,
        datos.codigo_conadis,
        datos.rol
      ]
    );

  return resultado.rows[0];

}

async function updateProfile(
  id,
  datos
){

  await pool.query(
    `
    UPDATE usuarios
    SET
      nombre = $1,
      telefono = $2,
      correo_institucional = $3,
      licencia_fecha_vencimiento = $4
    WHERE id = $5
    `,
    [
      datos.nombre,
      datos.telefono,
      datos.correo_institucional,
      datos.licencia_fecha_vencimiento,
      id
    ]
  );

}

/* Comprobacion si existe el usuario - Para register */

async function existsByCode(
  codigo
){

  const resultado =
    await pool.query(
      `
      SELECT id
      FROM usuarios
      WHERE codigo_universitario = $1
      `,
      [codigo]
    );

  return resultado.rows.length > 0;

}

module.exports = {
  findByCodigo,
  findById,
  create,
  updateProfile,
  existsByCode
};