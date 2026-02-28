import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', (req, res) => {
  res.json({ message: 'Rota de vendas funcionando!', vendas: [] });
});

router.post('/', (req, res) => {
  res.json({ message: 'Venda criada!', venda: req.body });
});

export default router;
