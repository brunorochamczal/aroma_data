import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import clienteRoutes from './routes/clienteRoutes.js';
import produtoRoutes from './routes/produtoRoutes.js';
import vendaRoutes from './routes/vendaRoutes.js';       // NOVO
import fornecedorRoutes from './routes/fornecedorRoutes.js'; // NOVO
import { authenticate } from './middleware/auth.js';

dotenv.config();

// 1️⃣ PRIMEIRO: criar o app
const app = express();
const PORT = process.env.PORT || 3001;

// 2️⃣ DEPOIS: configurar middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://aroma-data.onrender.com',
  credentials: true
}));
app.use(express.json());

// Logs para debug
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.url}`);
  next();
});

// ===== 3️⃣ ROTAS PÚBLICAS =====
app.use('/api/auth', authRoutes);

// ===== 4️⃣ ROTAS PROTEGIDAS (exigem token) =====
app.use('/api/clientes', authenticate, clienteRoutes);
app.use('/api/produtos', authenticate, produtoRoutes);
app.use('/api/vendas', authenticate, vendaRoutes);          // NOVA ROTA
app.use('/api/fornecedores', authenticate, fornecedorRoutes); // NOVA ROTA

// ===== 5️⃣ ROTAS DE TESTE =====
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
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      clientes: '/api/clientes',
      produtos: '/api/produtos',
      vendas: '/api/vendas',
      fornecedores: '/api/fornecedores',
      health: '/api/health'
    }
  });
});

// ===== 6️⃣ TRATAMENTO DE ERROS =====
app.use((req, res) => {
  console.log(`❌ Rota não encontrada: ${req.method} ${req.url}`);
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📌 Rotas disponíveis:`);
  console.log(`   - GET  /`);
  console.log(`   - GET  /teste`);
  console.log(`   - GET  /api/health`);
  console.log(`   - POST /api/auth/login`);
  console.log(`   - POST /api/auth/register`);
  console.log(`   - GET  /api/auth/me`);
  console.log(`   - GET  /api/clientes`);
  console.log(`   - POST /api/clientes`);
  console.log(`   - GET  /api/produtos`);
  console.log(`   - POST /api/produtos`);
  console.log(`   - GET  /api/vendas`);          // NOVO
  console.log(`   - POST /api/vendas`);          // NOVO
  console.log(`   - GET  /api/fornecedores`);    // NOVO
  console.log(`   - POST /api/fornecedores`);    // NOVO
});
