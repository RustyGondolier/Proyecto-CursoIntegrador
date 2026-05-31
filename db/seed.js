require('dotenv').config();

const bcrypt = require('bcryptjs');
const pool = require('./index');

async function seed() {

  try {

    console.log('Iniciando seed...');

    const passwordHash = await bcrypt.hash(
      'Admin123*',
      10
    );

    const usuarios = [
      {
        codigo: 'SUP001',
        nombre: 'Supervisor General',
        rol: 'supervisor'
      },
      {
        codigo: 'ADM001',
        nombre: 'Administrador Sistema',
        rol: 'administrador'
      },
      {
        codigo: 'DIR001',
        nombre: 'Dirección Estacionamientos',
        rol: 'direccion'
      }
    ];

    for (const usuario of usuarios) {

      const existe = await pool.query(
        `
        SELECT id
        FROM usuarios
        WHERE codigo_universitario = $1
        `,
        [usuario.codigo]
      );

      if (existe.rows.length > 0) {
        console.log(
          `Usuario ${usuario.codigo} ya existe`
        );
        continue;
      }

      await pool.query(
        `
        INSERT INTO usuarios (
          codigo_universitario,
          nombre,
          password_hash,
          rol,
          verificado,
          requiere_reverificacion
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          true,
          false
        )
        `,
        [
          usuario.codigo,
          usuario.nombre,
          passwordHash,
          usuario.rol
        ]
      );

      console.log(
        `Usuario ${usuario.codigo} creado`
      );
    }

    console.log('Seed completado');

    process.exit(0);

  } catch (err) {

    console.error(err);

    process.exit(1);

  }

}

seed();