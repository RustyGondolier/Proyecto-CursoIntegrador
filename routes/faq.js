const express = require('express');
const pool = require('../db');

const {
  authJWT,
  rolesGestion
} = require('../middleware/authJWT');

const router = express.Router();

/* =====================================================
   LISTAR FAQ ACTIVAS
===================================================== */

router.get(
  '/',
  authJWT,
  async (req, res) => {

    try {

      const resultado = await pool.query(`
        SELECT
          f.id,
          f.pregunta,
          f.respuesta,
          fc.nombre AS categoria
        FROM faq f
        JOIN faq_categorias fc
          ON fc.id = f.categoria_id
        WHERE f.activo = true
        ORDER BY fc.nombre, f.id
      `);

      res.json(resultado.rows);

    } catch (err) {

      console.error(err);

      res.status(500).json({
        error: 'Error interno'
      });

    }

  }
);

/* =====================================================
   LISTAR CATEGORÍAS
===================================================== */

router.get(
  '/categorias',
  authJWT,
  async (req, res) => {

    try {

      const resultado = await pool.query(`
        SELECT *
        FROM faq_categorias
        ORDER BY nombre
      `);

      res.json(resultado.rows);

    } catch (err) {

      console.error(err);

      res.status(500).json({
        error: 'Error interno'
      });

    }

  }
);

/* =====================================================
   CREAR FAQ
===================================================== */

router.post(
  '/',
  authJWT,
  rolesGestion,
  async (req, res) => {

    const {
      categoria_id,
      pregunta,
      respuesta
    } = req.body;

    if (
      !categoria_id ||
      !pregunta ||
      !respuesta
    ) {
      return res.status(400).json({
        error: 'Campos incompletos'
      });
    }

    try {

      const resultado = await pool.query(
        `
        INSERT INTO faq (
          categoria_id,
          pregunta,
          respuesta
        )
        VALUES ($1,$2,$3)
        RETURNING *
        `,
        [
          categoria_id,
          pregunta,
          respuesta
        ]
      );

      res.status(201).json(
        resultado.rows[0]
      );

    } catch (err) {

      console.error(err);

      res.status(500).json({
        error: 'Error interno'
      });

    }

  }
);

/* =====================================================
   ACTUALIZAR FAQ
===================================================== */

router.put(
  '/:id',
  authJWT,
  rolesGestion,
  async (req, res) => {

    const {
      categoria_id,
      pregunta,
      respuesta,
      activo
    } = req.body;

    try {

      await pool.query(
        `
        UPDATE faq
        SET
          categoria_id = $1,
          pregunta = $2,
          respuesta = $3,
          activo = $4
        WHERE id = $5
        `,
        [
          categoria_id,
          pregunta,
          respuesta,
          activo,
          req.params.id
        ]
      );

      res.json({
        mensaje: 'FAQ actualizada'
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        error: 'Error interno'
      });

    }

  }
);

/* =====================================================
   ELIMINAR FAQ
===================================================== */

router.delete(
  '/:id',
  authJWT,
  rolesGestion,
  async (req, res) => {

    try {

      await pool.query(
        `
        DELETE FROM faq
        WHERE id = $1
        `,
        [req.params.id]
      );

      res.json({
        mensaje: 'FAQ eliminada'
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        error: 'Error interno'
      });

    }

  }
);

/* =====================================================
   CREAR CATEGORÍA
===================================================== */

router.post(
  '/categorias',
  authJWT,
  rolesGestion,
  async (req, res) => {

    const {
      nombre
    } = req.body;

    if (!nombre) {
      return res.status(400).json({
        error: 'Nombre requerido'
      });
    }

    try {

      const resultado = await pool.query(
        `
        INSERT INTO faq_categorias (
          nombre
        )
        VALUES ($1)
        RETURNING *
        `,
        [nombre]
      );

      res.status(201).json(
        resultado.rows[0]
      );

    } catch (err) {

      console.error(err);

      res.status(500).json({
        error: 'Error interno'
      });

    }

  }
);

module.exports = router;