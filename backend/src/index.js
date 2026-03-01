import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import clienteRoutes from './routes/clienteRoutes.js';
import produtoRoutes from './routes/produtoRoutes.js';
import fornecedorRoutes from './routes/fornecedorRoutes.js';
import vendaRoutes from './routes/vendaRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { authenticate } from './middleware/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
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

// ===== ROTAS PÚBLICAS =====
app.use('/api/auth', authRoutes);

// ===== ROTAS PROTEGIDAS (exigem token) =====
app.use('/api/clientes', authenticate, clienteRoutes);
app.use('/api/produtos', authenticate, produtoRoutes);
app.use('/api/fornecedores', authenticate, fornecedorRoutes);
app.use('/api/vendas', authenticate, vendaRoutes);
app.use('/api/usuarios', authenticate, userRoutes); // <-- CORRIGIDO: movido para antes do listen

// ===== ROTAS DE TESTE =====
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
      fornecedores: '/api/fornecedores',
      vendas: '/api/vendas',
      usuarios: '/api/usuarios',
      health: '/api/health'
    }
  });
});

// ===== 404 HANDLER =====
app.use((req, res) => {
  console.log(`❌ Rota não encontrada: ${req.method} ${req.url}`);
  res.status(404).json({ error: 'Route not found' });
});

// ===== INICIAR SERVIDOR =====
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
  console.log(`   - GET  /api/fornecedores`);
  console.log(`   - POST /api/fornecedores`);
  console.log(`   - GET  /api/vendas`);
  console.log(`   - POST /api/vendas`);
  console.log(`   - GET  /api/usuarios`); // <-- NOVA ROTA
  console.log(`   - POST /api/usuarios`);
});
