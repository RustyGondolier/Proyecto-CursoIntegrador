const express = require('express');
const pool = require('../db/index');

const {
  authJWT
} = require('../middleware/authJWT');

const router = express.Router();

router.get(
  '/',
  authJWT,
  async (req, res) => {
    try{
      const resultado = await pool.query(
        `
        SELECT
          v.id,
          v.placa,
          v.modelo,
          v.tipo_vehiculo_id,
					v.activo,
          tv.codigo AS tipo_vehiculo
        FROM vehiculos v
        LEFT JOIN tipos_vehiculo tv
          ON tv.id = v.tipo_vehiculo_id
        WHERE v.usuario_id = $1
        ORDER BY v.id DESC
        `,
        [req.usuario.id]
      );
      res.json(
        resultado.rows
      );
    }catch(err){
      console.error(err);
      res.status(500).json({
        error:'Error interno'
      });
    }
  }
);

/* =========================
   AGREGAR VEHICULO
========================= */

router.post(
  '/',
  authJWT,
  async (req, res) => {
    const {
      placa,
      modelo,
      tipo_vehiculo_id
    } = req.body;
    try{
      const existe = await pool.query(
        `
        SELECT id
        FROM vehiculos
        WHERE placa = $1
        `,
        [placa.toUpperCase()]
      );
      if(existe.rows.length > 0){
        return res.status(409).json({
          error:'La placa ya existe'
        });
      }
			await pool.query(
				`
				UPDATE vehiculos
				SET activo = false
				WHERE usuario_id = $1
				`,
				[req.usuario.id]
			);
      await pool.query(
        `
        INSERT INTO vehiculos (
          usuario_id,
          tipo_vehiculo_id,
          placa,
          modelo,
					activo
        )
        VALUES ($1,$2,$3,$4,true)
        `,
        [
          req.usuario.id,
          tipo_vehiculo_id || 1,
          placa.toUpperCase(),
          modelo
        ]
      );
      res.status(201).json({
        mensaje:'Vehículo agregado'
      });
    }catch(err){
      console.error(err);
      res.status(500).json({
        error:'Error interno'
      });
    }
  }
);

/* Seleccionar vehiculo*/
router.put(
  '/:id/seleccionar',
  authJWT,
  async (req, res) => {
    const vehiculoId =
      req.params.id;
    try{
      await pool.query(
        `
        UPDATE vehiculos
        SET activo = false
        WHERE usuario_id = $1
        `,
        [req.usuario.id]
      );
      await pool.query(
        `
        UPDATE vehiculos
        SET activo = true
        WHERE id = $1
        AND usuario_id = $2
        `,
        [
          vehiculoId,
          req.usuario.id
        ]
      );
      res.json({
        mensaje:'Vehículo actualizado'
      });
    }catch(err){
      console.error(err);
      res.status(500).json({
        error:'Error interno'
      });
    }
  }
);

module.exports = router;
