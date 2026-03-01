import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { Cliente } from '../models/Cliente.js';

const router = express.Router();

// Todas as rotas exigem autenticação
router.use(authenticate);

// LISTAR
router.get('/', async (req, res) => {
  try {
    const clientes = await Cliente.findAll();
    res.json(clientes);
  } catch (error) {
    console.error('❌ Erro ao listar clientes:', error);
    res.status(500).json({ error: error.message });
  }
});

// CRIAR
router.post('/', async (req, res) => {
  try {
    const cliente = await Cliente.create({
      ...req.body,
      usuario_id: req.user.id
    });
    res.status(201).json(cliente);
  } catch (error) {
    console.error('❌ Erro ao criar cliente:', error);
    res.status(500).json({ error: error.message });
  }
});

// BUSCAR por ID
router.get('/:id', async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    res.json(cliente);
  } catch (error) {
    console.error('❌ Erro ao buscar cliente:', error);
    res.status(500).json({ error: error.message });
  }
});

// ATUALIZAR
router.put('/:id', async (req, res) => {
  try {
    const cliente = await Cliente.update(req.params.id, req.body);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    res.json(cliente);
  } catch (error) {
    console.error('❌ Erro ao atualizar cliente:', error);
    res.status(500).json({ error: error.message });
  }
});

// EXCLUIR (DELETE REAL)
router.delete('/:id', async (req, res) => {
  try {
    const cliente = await Cliente.delete(req.params.id);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    res.json({ 
      success: true,
      message: 'Cliente excluído permanentemente com sucesso' 
    });
  } catch (error) {
    console.error('❌ Erro ao excluir cliente:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
