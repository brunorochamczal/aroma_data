import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import clienteRoutes from './routes/clienteRoutes.js';
import produtoRoutes from './routes/produtoRoutes.js';
import fornecedorRoutes from './routes/fornecedorRoutes.js';
import vendaRoutes from './routes/vendaRoutes.js';
import { authenticate } from './middleware/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://aroma-data.onrender.com',
  credentials: true
}));
app.use(express.json());

// Logs
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.url}`);
  next();
});

// Rotas públicas
app.use('/api/auth', authRoutes);

// Rotas protegidas
app.use('/api/clientes', authenticate, clienteRoutes);
app.use('/api/produtos', authenticate, produtoRoutes);
app.use('/api/fornecedores', authenticate, fornecedorRoutes);
app.use('/api/vendas', authenticate, vendaRoutes);

// Rota de teste
app.get('/teste', (req, res) => {
  res.json({ message: 'Rota de teste funcionando!' });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Aroma Data API funcionando!'
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'Aroma Data API',
    endpoints: {
      auth: '/api/auth',
      clientes: '/api/clientes',
      produtos: '/api/produtos',
      fornecedores: '/api/fornecedores',
      vendas: '/api/vendas',
      health: '/api/health'
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
