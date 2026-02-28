import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { Fornecedor } from '../models/Fornecedor.js';

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const fornecedores = await Fornecedor.findAll();
    console.log(`🏢 Fornecedores encontrados:`, fornecedores.length);
    res.json(fornecedores);
  } catch (error) {
    console.error('❌ Erro ao listar fornecedores:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    console.log('🏢 Recebido POST /fornecedores:', req.body);
    
    const fornecedor = await Fornecedor.create({
      ...req.body,
      usuario_id: req.user.id
    });
    
    console.log('✅ Fornecedor criado:', fornecedor);
    res.status(201).json(fornecedor);
  } catch (error) {
    console.error('❌ Erro ao criar fornecedor:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
