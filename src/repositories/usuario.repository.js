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
      nombre = COALESCE($1, nombre),
      telefono = COALESCE($2, telefono),
      correo_institucional = COALESCE($3, correo_institucional),
      licencia_fecha_vencimiento = COALESCE($4, licencia_fecha_vencimiento),
      dni = COALESCE($5, dni),
      nro_licencia = COALESCE($6, nro_licencia),
      verificado = false,
      requiere_reverificacion = true
    WHERE id = $7
    `,
    [
      datos.nombre ?? null,
      datos.telefono ?? null,
      datos.correo_institucional ?? null,
      datos.licencia_fecha_vencimiento ?? null,
      datos.dni ?? null,
      datos.nro_licencia ?? null,
      id
    ]
  );

}

async function getProfileWithVehicles(
  userId
){

  const resultado =
    await pool.query(
      `
      SELECT
        u.id,
        u.codigo_universitario,
        u.nombre,
        u.rol,
        u.telefono,
        u.dni,
        u.correo_institucional,
        u.nro_licencia,
        u.licencia_fecha_vencimiento,
        u.verificado,
        u.requiere_reverificacion,
        u.estado_cuenta,
        u.motivo_suspension,
        u.codigo_conadis,
        u.conadis_verificado,
        json_agg(
          json_build_object(
            'id', v.id,
            'tipo', tv.codigo,
            'placa', v.placa,
            'modelo', v.modelo,
            'activo', v.activo
          )
          ORDER BY v.activo DESC, v.id
        ) FILTER (WHERE v.id IS NOT NULL) AS vehiculos
      FROM usuarios u
      LEFT JOIN vehiculos v ON v.usuario_id = u.id
      LEFT JOIN tipos_vehiculo tv ON tv.id = v.tipo_vehiculo_id
      WHERE u.id = $1
      GROUP BY u.id
      `,
      [userId]
    );

  return resultado.rows[0] || null;

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

async function findByEmail(
  correo
){

  const resultado =
    await pool.query(
      `
      SELECT id
      FROM usuarios
      WHERE correo_institucional = $1
      `,
      [correo]
    );

  return resultado.rows[0] || null;

}

async function findByLicense(
  licencia
){

  const resultado =
    await pool.query(
      `
      SELECT id
      FROM usuarios
      WHERE nro_licencia = $1
      `,
      [licencia]
    );

  return resultado.rows[0] || null;

}

async function resetVerification(
  userId
){

  await pool.query(
    `
    UPDATE usuarios
    SET verificado = false, requiere_reverificacion = true
    WHERE id = $1
    `,
    [userId]
  );

}

async function getPasswordHash(
  userId
){

  const resultado =
    await pool.query(
      `
      SELECT password_hash
      FROM usuarios
      WHERE id = $1
      `,
      [userId]
    );

  return resultado.rows[0]?.password_hash || null;

}

async function updatePassword(
  userId,
  passwordHash
){

  await pool.query(
    `
    UPDATE usuarios
    SET password_hash = $1
    WHERE id = $2
    `,
    [passwordHash, userId]
  );

}

module.exports = {
  findByCodigo,
  findById,
  create,
  updateProfile,
  getProfileWithVehicles,
  existsByCode,
  findByEmail,
  findByLicense,
  resetVerification,
  getPasswordHash,
  updatePassword
};