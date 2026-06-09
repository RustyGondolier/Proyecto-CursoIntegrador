const faqRepository = require('../repositories/faq.repository');

async function listar(req, res) {
  try {
    const categorias = await faqRepository.getCategorias();
    res.json(categorias);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al cargar categorías' });
  }
}

async function preguntas(req, res) {
  try {
    const { id } = req.params;
    const preguntas = await faqRepository.getByCategoria(id);
    res.json(preguntas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al cargar preguntas' });
  }
}

module.exports = { listar, preguntas };
