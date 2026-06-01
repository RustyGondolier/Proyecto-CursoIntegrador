require('dotenv').config();

const pool = require('./index');

async function crearBloque(
  estacionamientoId,
  codigo,
  tipoVehiculo,
  letra,
  capacidad
) {

  const bloque = await pool.query(
    `
    INSERT INTO bloques (
      estacionamiento_id,
      codigo,
      tipo_vehiculo,
      letra_bloque,
      capacidad,
      descripcion
    )
    VALUES ($1,$2,$3,$4,$5,$6)
    RETURNING id
    `,
    [
      estacionamientoId,
      codigo,
      tipoVehiculo,
      letra,
      capacidad,
      `Bloque ${letra}`
    ]
  );

  return bloque.rows[0].id;
}

async function crearPlazas(
  bloqueId,
  codigoBase,
  cantidad,
  tipoPlazaId
) {

  for(let i = 1; i <= cantidad; i++){

    const numero =
      String(i).padStart(2,'0');

    await pool.query(
      `
      INSERT INTO plazas (
        codigo,
        bloque_id,
        numero_plaza,
        tipo_plaza_id
      )
      VALUES ($1,$2,$3,$4)
      `,
      [
        `${codigoBase}-${numero}`,
        bloqueId,
        i,
        tipoPlazaId
      ]
    );

  }

}

async function seed(){

  try{

    console.log('Limpiando bloques y plazas...');

    await pool.query('DELETE FROM plazas');
    await pool.query('DELETE FROM bloques');

    /*
    ==============================
    TIPOS PLAZA
    ==============================
    */

    const autoEstandar =
      (
        await pool.query(
          `
          SELECT id
          FROM tipos_plaza
          WHERE codigo='auto_estandar'
          `
        )
      ).rows[0].id;

    const motoEstandar =
      (
        await pool.query(
          `
          SELECT id
          FROM tipos_plaza
          WHERE codigo='moto_estandar'
          `
        )
      ).rows[0].id;

    /*
    ==============================
    ESTACIONAMIENTO 1
    95 AUTOS
    ==============================
    */

    const bloquesAutosE1 = [
      ['A',8],
      ['B',8],
      ['C',8],
      ['D',8],
      ['E',8],
      ['F',8],
      ['G',8],
      ['H',8],
      ['I',8],
      ['J',8],
      ['K',8],
      ['L',7]
    ];

    for(const [letra,capacidad] of bloquesAutosE1){

      const bloqueId =
        await crearBloque(
          1,
          `E1-A-${letra}`,
          'auto',
          letra,
          capacidad
        );

      await crearPlazas(
        bloqueId,
        `E1-A-${letra}`,
        capacidad,
        autoEstandar
      );

    }

    /*
    ==============================
    ESTACIONAMIENTO 1
    22 MOTOS
    ==============================
    */

    const bloquesMotoE1 = [
      ['A',8],
      ['B',8],
      ['C',6]
    ];

    for(const [letra,capacidad] of bloquesMotoE1){

      const bloqueId =
        await crearBloque(
          1,
          `E1-M-${letra}`,
          'moto',
          letra,
          capacidad
        );

      await crearPlazas(
        bloqueId,
        `E1-M-${letra}`,
        capacidad,
        motoEstandar
      );

    }

    /*
    ==============================
    ESTACIONAMIENTO 2
    59 AUTOS
    ==============================
    */

    const bloquesAutosE2 = [
      ['A',8],
      ['B',8],
      ['C',8],
      ['D',8],
      ['E',8],
      ['F',8],
      ['G',8],
      ['H',3]
    ];

    for(const [letra,capacidad] of bloquesAutosE2){

      const bloqueId =
        await crearBloque(
          2,
          `E2-A-${letra}`,
          'auto',
          letra,
          capacidad
        );

      await crearPlazas(
        bloqueId,
        `E2-A-${letra}`,
        capacidad,
        autoEstandar
      );

    }

    /*
    ==============================
    ESTACIONAMIENTO 2
    5 MOTOS
    ==============================
    */

    const bloqueMotoE2 =
      await crearBloque(
        2,
        'E2-M-A',
        'moto',
        'A',
        5
      );

    await crearPlazas(
      bloqueMotoE2,
      'E2-M-A',
      5,
      motoEstandar
    );

    console.log('Seed completado');

    process.exit(0);

  }catch(err){

    console.error(err);

    process.exit(1);

  }

}

seed();