import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Rotas que seu frontend espera
app.get('/api/vendas', (req, res) => {
  // Retornar lista de vendas
  res.json([
    { id: 1, cliente: 'João', valor: 100, data: '2024-01-01' },
    { id: 2, cliente: 'Maria', valor: 200, data: '2024-01-02' }
  ]);
});

app.get('/api/vendas/:id', (req, res) => {
  // Retornar uma venda específica
  res.json({ id: req.params.id, cliente: 'João', valor: 100 });
});

app.post('/api/vendas', (req, res) => {
  // Criar nova venda
  const novaVenda = req.body;
  res.status(201).json({ ...novaVenda, id: Date.now() });
});

app.listen(PORT, () => {
  console.log(`🚀 API rodando na porta ${PORT}`);
});
