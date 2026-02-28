import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', (req, res) => {
  res.json({ message: 'Rota de fornecedores funcionando!', fornecedores: [] });
});

router.post('/', (req, res) => {
  res.json({ message: 'Fornecedor criado!', fornecedor: req.body });
});

export default router;
