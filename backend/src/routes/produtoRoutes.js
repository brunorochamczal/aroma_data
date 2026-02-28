import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { Produto } from '../models/Produto.js';

const router = express.Router();

router.use(authenticate);

// Listar produtos
router.get('/', async (req, res) => {
  try {
    const produtos = await Produto.findAll();
    res.json(produtos);
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    res.status(500).json({ error: error.message });
  }
});

// Criar produto
router.post('/', async (req, res) => {
  try {
    const produto = await Produto.create({
      ...req.body,
      usuario_id: req.user.id
    });
    res.status(201).json(produto);
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({ error: error.message });
  }
});

// Buscar produto por ID
router.get('/:id', async (req, res) => {
  try {
    const produto = await Produto.findById(req.params.id);
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    res.json(produto);
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    res.status(500).json({ error: error.message });
  }
});

// Atualizar produto
router.put('/:id', async (req, res) => {
  try {
    const produto = await Produto.update(req.params.id, req.body);
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    res.json(produto);
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ error: error.message });
  }
});

// Atualizar estoque
router.post('/:id/estoque', async (req, res) => {
  try {
    const { quantidade, operacao } = req.body;
    const produto = await Produto.updateStock(req.params.id, quantidade, operacao);
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado ou estoque insuficiente' });
    }
    res.json(produto);
  } catch (error) {
    console.error('Erro ao atualizar estoque:', error);
    res.status(500).json({ error: error.message });
  }
});

// Desativar produto
router.delete('/:id', async (req, res) => {
  try {
    const produto = await Produto.delete(req.params.id);
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    res.json({ message: 'Produto desativado com sucesso' });
  } catch (error) {
    console.error('Erro ao desativar produto:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
