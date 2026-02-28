import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { Cliente } from '../models/Cliente.js';

const router = express.Router();

// Todas as rotas de cliente exigem autenticação
router.use(authenticate);

// Listar clientes
router.get('/', async (req, res) => {
  try {
    const clientes = await Cliente.findAll();
    res.json(clientes);
  } catch (error) {
    console.error('Erro ao listar clientes:', error);
    res.status(500).json({ error: error.message });
  }
});

// Criar cliente
router.post('/', async (req, res) => {
  try {
    const cliente = await Cliente.create({
      ...req.body,
      usuario_id: req.user.id
    });
    res.status(201).json(cliente);
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    res.status(500).json({ error: error.message });
  }
});

// Buscar cliente por ID
router.get('/:id', async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    res.json(cliente);
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    res.status(500).json({ error: error.message });
  }
});

// Atualizar cliente
router.put('/:id', async (req, res) => {
  try {
    const cliente = await Cliente.update(req.params.id, req.body);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    res.json(cliente);
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    res.status(500).json({ error: error.message });
  }
});

// Desativar cliente
router.delete('/:id', async (req, res) => {
  try {
    const cliente = await Cliente.delete(req.params.id);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    res.json({ message: 'Cliente desativado com sucesso' });
  } catch (error) {
    console.error('Erro ao desativar cliente:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
