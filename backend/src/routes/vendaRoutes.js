import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { Venda } from '../models/Venda.js';

const router = express.Router();

// Todas as rotas exigem autenticação
router.use(authenticate);

// LISTAR vendas
router.get('/', async (req, res) => {
  try {
    const vendas = await Venda.findAll();
    console.log(`📊 ${vendas.length} vendas encontradas`);
    res.json(vendas);
  } catch (error) {
    console.error('❌ Erro ao listar vendas:', error);
    res.status(500).json({ error: error.message });
  }
});

// CRIAR venda
router.post('/', async (req, res) => {
  try {
    console.log('🛒 Recebida requisição POST /vendas');
    console.log('📦 Dados:', req.body);

    const vendaData = {
      ...req.body,
      usuario_id: req.user.id
    };

    const venda = await Venda.create(vendaData);
    
    console.log('✅ Venda criada com sucesso:', venda.id);
    res.status(201).json(venda);
  } catch (error) {
    console.error('❌ Erro ao criar venda:', error);
    res.status(500).json({ error: error.message });
  }
});

// BUSCAR venda por ID
router.get('/:id', async (req, res) => {
  try {
    const venda = await Venda.findById(req.params.id);
    if (!venda) {
      return res.status(404).json({ error: 'Venda não encontrada' });
    }
    res.json(venda);
  } catch (error) {
    console.error('❌ Erro ao buscar venda:', error);
    res.status(500).json({ error: error.message });
  }
});

// CANCELAR venda (soft delete com restauração de estoque)
router.post('/:id/cancelar', async (req, res) => {
  try {
    const venda = await Venda.cancel(req.params.id);
    res.json({ 
      success: true, 
      message: 'Venda cancelada com sucesso',
      venda 
    });
  } catch (error) {
    console.error('❌ Erro ao cancelar venda:', error);
    res.status(500).json({ error: error.message });
  }
});

// EXCLUIR venda (DELETE real - apenas se cancelada)
router.delete('/:id', async (req, res) => {
  try {
    const venda = await Venda.delete(req.params.id);
    res.json({ 
      success: true, 
      message: 'Venda excluída permanentemente' 
    });
  } catch (error) {
    console.error('❌ Erro ao excluir venda:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
